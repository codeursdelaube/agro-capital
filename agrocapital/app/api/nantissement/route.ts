import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { demandeNantissementSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/nantissement — Mes demandes de nantissement */
export async function GET(req: Request) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { searchParams } = new URL(req.url);
    const statut = searchParams.get("statut") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where = {
      userId: currentUser.id,
      ...(statut ? { statut: statut as never } : {}),
    };

    const [demandes, total] = await prisma.$transaction([
      prisma.demandeNantissement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          montantDemande: true,
          montantDebloque: true,
          tauxDecote: true,
          statut: true,
          motif: true,
          dateDebloiement: true,
          dateRemboursementDue: true,
          createdAt: true,
          updatedAt: true,
          stock: {
            select: { id: true, culture: true, quantiteKg: true, valeurEstimee: true },
          },
          transaction: {
            select: { statut: true, reference: true, montant: true },
          },
        },
      }),
      prisma.demandeNantissement.count({ where }),
    ]);

    return ok({ demandes, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/nantissement — Soumettre une demande de nantissement */
export async function POST(req: Request) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const body = await parseBody(req, demandeNantissementSchema);

    // Vérifier que le stock appartient à l'agriculteur et est disponible
    const stock = await prisma.stock.findUnique({
      where: { id: body.stockId },
      select: { userId: true, statut: true, valeurEstimee: true, quantiteKg: true },
    });

    if (!stock || stock.userId !== currentUser.id) {
      return err("Stock introuvable ou non autorisé", 404);
    }
    if (stock.statut !== "DISPONIBLE") {
      return err(
        `Ce stock ne peut pas être nanti (statut actuel : ${stock.statut})`,
        422
      );
    }

    // Vérifier qu'il n'y a pas déjà une demande en cours sur ce stock
    const demandeExistante = await prisma.demandeNantissement.findFirst({
      where: { stockId: body.stockId, statut: { in: ["EN_ATTENTE", "APPROUVEE"] } },
    });
    if (demandeExistante) {
      return err("Une demande de nantissement est déjà en cours pour ce stock", 409);
    }

    // Calcul du montant maximum nantissable (70% de la valeur estimée par défaut)
    const TAUX_DECOTE_DEFAULT = 0.7;
    const valeurGarantie = stock.valeurEstimee ?? stock.quantiteKg * 1000; // fallback 1000 FCFA/kg
    const montantMaxNantissable = valeurGarantie * TAUX_DECOTE_DEFAULT;

    if (body.montantDemande > montantMaxNantissable) {
      return err(
        `Montant demandé trop élevé. Maximum nantissable : ${Math.floor(montantMaxNantissable).toLocaleString("fr-FR")} FCFA`,
        422
      );
    }

    const demande = await prisma.$transaction(async (tx: any) => {
      // Verrouiller le stock
      await tx.stock.update({
        where: { id: body.stockId },
        data: { statut: "NANTI" },
      });

      const nouvelleDemande = await tx.demandeNantissement.create({
        data: {
          userId: currentUser.id,
          stockId: body.stockId,
          montantDemande: body.montantDemande,
          motif: body.motif,
          ...(body.dateRemboursementDue
            ? { dateRemboursementDue: new Date(body.dateRemboursementDue) }
            : {}),
        },
        select: {
          id: true,
          montantDemande: true,
          statut: true,
          motif: true,
          createdAt: true,
          stock: { select: { culture: true, quantiteKg: true } },
        },
      });

      return nouvelleDemande;
    });

    return ok(demande, 201);
  } catch (error) {
    return handleError(error);
  }
}
