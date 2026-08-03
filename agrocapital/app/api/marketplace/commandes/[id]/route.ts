import { requireAuth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { updateCommandeSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/marketplace/commandes/[id] — Détail d'une commande */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const commande = await prisma.commande.findUnique({
      where: { id },
      select: {
        id: true,
        quantite: true,
        montantTotal: true,
        statut: true,
        modePaiement: true,
        adresseLivraison: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        produit: {
          select: {
            id: true,
            nom: true,
            culture: true,
            uniteMesure: true,
            prixUnitaire: true,
            photoUrl: true,
          },
        },
        acheteur: {
          select: { id: true, nom: true, prenom: true, telephone: true, region: true },
        },
        vendeur: {
          select: { id: true, nom: true, prenom: true, telephone: true, region: true },
        },
        transaction: {
          select: { statut: true, reference: true, operateur: true, montant: true },
        },
      },
    });

    if (!commande) return err("Commande introuvable", 404);

    // Seul l'acheteur ou le vendeur peut voir les détails
    if (
      commande.acheteur.id !== currentUser.id &&
      commande.vendeur.id !== currentUser.id &&
      currentUser.role !== "ADMIN"
    ) {
      return err("Accès refusé", 403);
    }

    return ok(commande);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/marketplace/commandes/[id] — Changer le statut d'une commande
 *
 * Transitions autorisées :
 * - Vendeur : EN_ATTENTE → CONFIRMEE | ANNULEE
 * - Vendeur : CONFIRMEE → EN_LIVRAISON
 * - Vendeur : EN_LIVRAISON → LIVREE
 * - Acheteur : EN_ATTENTE → ANNULEE
 * - Acheteur ou Vendeur : tout statut → LITIGE
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, updateCommandeSchema);

    const commande = await prisma.commande.findUnique({
      where: { id },
      select: {
        id: true,
        statut: true,
        acheteurId: true,
        vendeurId: true,
        quantite: true,
        produitId: true,
        montantTotal: true,
        produit: { select: { stockSourceId: true, quantiteDisponible: true } },
        vendeur: { select: { portefeuilleNumerique: { select: { id: true } } } },
      },
    });

    if (!commande) return err("Commande introuvable", 404);

    const isAcheteur = commande.acheteurId === currentUser.id;
    const isVendeur = commande.vendeurId === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isAcheteur && !isVendeur && !isAdmin) return err("Accès refusé", 403);

    // Vérification des transitions autorisées
    const { statut: nouveauStatut } = body;
    const statutActuel = commande.statut;

    const transitionsVendeur: Record<string, string[]> = {
      EN_ATTENTE: ["CONFIRMEE", "ANNULEE"],
      CONFIRMEE: ["EN_LIVRAISON"],
      EN_LIVRAISON: ["LIVREE"],
    };
    const transitionsAcheteur: Record<string, string[]> = {
      EN_ATTENTE: ["ANNULEE"],
    };

    const peutTransitionner = () => {
      if (isAdmin) return true;
      if (nouveauStatut === "LITIGE") return isAcheteur || isVendeur;
      if (isVendeur && transitionsVendeur[statutActuel]?.includes(nouveauStatut)) return true;
      if (isAcheteur && transitionsAcheteur[statutActuel]?.includes(nouveauStatut)) return true;
      return false;
    };

    if (!peutTransitionner()) {
      return err(
        `Transition ${statutActuel} → ${nouveauStatut} non autorisée pour votre rôle`,
        422
      );
    }

    const updatedCommande = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.commande.update({
        where: { id },
        data: {
          statut: nouveauStatut,
          ...(body.modePaiement ? { modePaiement: body.modePaiement } : {}),
        },
        select: { id: true, statut: true, updatedAt: true, modePaiement: true },
      });

      // Si annulée APRÈS confirmation → remettre le stock
      if (
        nouveauStatut === "ANNULEE" &&
        (statutActuel === "CONFIRMEE" || statutActuel === "EN_LIVRAISON")
      ) {
        await tx.produit.update({
          where: { id: commande.produitId },
          data: {
            quantiteDisponible: { increment: commande.quantite },
            statut: "DISPONIBLE",
          },
        });

        if (commande.produit.stockSourceId) {
          await tx.stock.update({
            where: { id: commande.produit.stockSourceId },
            data: { statut: "DISPONIBLE" },
          });
        }
      }

      // Si LIVREE → créditer le portefeuille numérique du vendeur
      if (nouveauStatut === "LIVREE") {
        const portefeuilleId = commande.vendeur.portefeuilleNumerique?.id;
        if (portefeuilleId) {
          await tx.portefeuilleNumerique.update({
            where: { id: portefeuilleId },
            data: { solde: { increment: commande.montantTotal } },
          });
          await tx.mouvementNumerique.create({
            data: {
              portefeuilleId,
              montant: commande.montantTotal,
              libelle: `Vente livrée — Commande #${id.slice(-8).toUpperCase()}`,
              commandeId: id,
            },
          });
        }
      }

      // Notification à l'acheteur
      await tx.notification.create({
        data: {
          userId: commande.acheteurId,
          type: "COMMANDE",
          titre: "Mise à jour de votre commande",
          message: `Votre commande est maintenant : ${nouveauStatut}`,
          lienRessource: `/commandes/${id}`,
        },
      });

      return updated;
    });

    return ok(updatedCommande);
  } catch (error) {
    return handleError(error);
  }
}
