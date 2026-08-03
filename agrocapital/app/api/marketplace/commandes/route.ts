import { requireAuth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { commandeSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/marketplace/commandes — Mes commandes (acheteur ET vendeur) */
export async function GET(req: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") ?? "acheteur"; // "acheteur" | "vendeur"
    const statut = searchParams.get("statut") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where =
      role === "vendeur"
        ? { vendeurId: currentUser.id, ...(statut ? { statut: statut as never } : {}) }
        : { acheteurId: currentUser.id, ...(statut ? { statut: statut as never } : {}) };

    const [commandes, total] = await prisma.$transaction([
      prisma.commande.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quantite: true,
          montantTotal: true,
          statut: true,
          modePaiement: true,
          adresseLivraison: true,
          createdAt: true,
          updatedAt: true,
          produit: {
            select: { id: true, nom: true, culture: true, uniteMesure: true, photoUrl: true },
          },
          acheteur: { select: { id: true, nom: true, prenom: true, telephone: true } },
          vendeur: { select: { id: true, nom: true, prenom: true, telephone: true, region: true } },
        },
      }),
      prisma.commande.count({ where }),
    ]);

    return ok({ commandes, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/marketplace/commandes — Passer une commande
 *
 * La validation du stock ET la décrémentation se font dans une transaction Prisma
 * avec un verrou optimiste pour éviter les race conditions (overselling).
 */
export async function POST(req: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await parseBody(req, commandeSchema);

    const commande = await prisma.$transaction(async (tx: any) => {
      // 1. Récupérer le produit avec LOCK FOR UPDATE (via select + update atomique)
      const produit = await tx.produit.findUnique({
        where: { id: body.produitId },
        select: {
          id: true,
          nom: true,
          prixUnitaire: true,
          quantiteDisponible: true,
          quantiteMinCommande: true,
          statut: true,
          boutique: {
            select: { userId: true, actif: true },
          },
        },
      });

      if (!produit) throw new StockError("Produit introuvable", 404);
      if (!produit.boutique.actif) throw new StockError("Cette boutique n'est plus active", 422);
      if (produit.statut === "ARCHIVE") throw new StockError("Ce produit n'est plus disponible", 422);
      if (produit.statut === "RUPTURE" || produit.quantiteDisponible <= 0) {
        throw new StockError("Ce produit est en rupture de stock", 422);
      }

      // Un acheteur ne peut pas acheter ses propres produits
      if (produit.boutique.userId === currentUser.id) {
        throw new StockError("Vous ne pouvez pas acheter vos propres produits", 422);
      }

      // Vérifier la quantité minimum
      if (body.quantite < produit.quantiteMinCommande) {
        throw new StockError(
          `La quantité minimum est de ${produit.quantiteMinCommande}`,
          422
        );
      }

      // 2. Vérifier la disponibilité DANS la transaction (protection contre les races)
      if (produit.quantiteDisponible < body.quantite) {
        throw new StockError(
          `Stock insuffisant. Disponible : ${produit.quantiteDisponible}`,
          422
        );
      }

      const montantTotal = body.quantite * produit.prixUnitaire;
      const nouvelleQte = produit.quantiteDisponible - body.quantite;

      // 3. Décrémenter le stock du produit de façon atomique (updateMany avec condition WHERE)
      // Si une autre transaction a déjà modifié la quantité, le count retourné sera 0
      const { count } = await tx.produit.updateMany({
        where: {
          id: body.produitId,
          quantiteDisponible: { gte: body.quantite }, // condition atomique
        },
        data: {
          quantiteDisponible: nouvelleQte,
          statut: nouvelleQte === 0 ? "RUPTURE" : "DISPONIBLE",
        },
      });

      // count = 0 → race condition détectée (un autre acheteur a pris le dernier stock)
      if (count === 0) {
        throw new StockError("Stock épuisé (commande concurrente). Veuillez réessayer.", 409);
      }

      // 4. Si le produit est lié à un stock physique, mettre à jour son statut
      const produitComplet = await tx.produit.findUnique({
        where: { id: body.produitId },
        select: { stockSourceId: true },
      });
      if (produitComplet?.stockSourceId) {
        await tx.stock.update({
          where: { id: produitComplet.stockSourceId },
          data: { statut: nouvelleQte === 0 ? "VENDU" : "RESERVE" },
        });
      }

      // 5. Créer la commande
      const nouvelleCommande = await tx.commande.create({
        data: {
          produitId: body.produitId,
          acheteurId: currentUser.id,
          vendeurId: produit.boutique.userId,
          quantite: body.quantite,
          montantTotal,
          adresseLivraison: body.adresseLivraison,
          notes: body.notes,
        },
        select: {
          id: true,
          quantite: true,
          montantTotal: true,
          statut: true,
          createdAt: true,
          produit: { select: { nom: true, culture: true } },
          vendeur: { select: { nom: true, telephone: true } },
        },
      });

      // 6. Notifier le vendeur
      await tx.notification.create({
        data: {
          userId: produit.boutique.userId,
          type: "COMMANDE",
          titre: "Nouvelle commande reçue",
          message: `${currentUser.nom} a commandé ${body.quantite} de "${produit.nom}"`,
          lienRessource: `/commandes/${nouvelleCommande.id}`,
        },
      });

      return nouvelleCommande;
    });

    return ok(commande, 201);
  } catch (error) {
    if (error instanceof StockError) {
      return err(error.message, error.status);
    }
    return handleError(error);
  }
}

/** Erreur métier liée au stock */
class StockError extends Error {
  constructor(message: string, public status: number = 422) {
    super(message);
    this.name = "StockError";
  }
}
