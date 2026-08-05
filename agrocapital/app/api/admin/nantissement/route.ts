import { requireAdminAccess } from "@/_lib/admin-auth";
import { prisma } from "@/_lib/prisma";
import { ok, handleError } from "@/_lib/api-helpers";

/** GET /api/admin/nantissement — Liste TOUTES les demandes de warrantage (ADMIN / IMF uniquement) */
export async function GET(req: Request) {
  try {
    await requireAdminAccess();

    const { searchParams } = new URL(req.url);
    const statut = searchParams.get("statut") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where = {
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
          user: {
            select: { id: true, nom: true, prenom: true, telephone: true, region: true },
          },
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
