import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { ok, handleError } from "@/_lib/api-helpers";

/** GET /api/portefeuilles/numerique — Solde et historique des mouvements de ventes */
export async function GET(req: Request) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 30)));

    const portefeuille = await prisma.portefeuilleNumerique.findUnique({
      where: { userId: currentUser.id },
      select: {
        id: true,
        solde: true,
        updatedAt: true,
        mouvements: {
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            montant: true,
            libelle: true,
            commandeId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!portefeuille) {
      return ok({ solde: 0, mouvements: [], message: "Portefeuille non initialisé" });
    }

    const totalMouvements = await prisma.mouvementNumerique.count({
      where: { portefeuilleId: portefeuille.id },
    });

    return ok({ ...portefeuille, totalMouvements, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
