import { requireAdminAccess } from "@/_lib/admin-auth";
import { prisma } from "@/_lib/prisma";
import { ok, handleError } from "@/_lib/api-helpers";

/** GET /api/admin/stats — Statistiques du tableau de bord secret admin */
export async function GET() {
  try {
    await requireAdminAccess();

    const [
      totalUtilisateurs,
      totalAgriculteurs,
      totalClients,
      demandesAttente,
      demandesApprouvees,
      derniersInscrits,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "AGRICULTEUR" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.demandeNantissement.count({ where: { statut: "EN_ATTENTE" } }),
      prisma.demandeNantissement.count({ where: { statut: "APPROUVEE" } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, nom: true, prenom: true, telephone: true, role: true, region: true, createdAt: true },
      }),
    ]);

    return ok({
      totalUtilisateurs,
      totalAgriculteurs,
      totalClients,
      demandesAttente,
      demandesApprouvees,
      derniersInscrits,
    });
  } catch (error) {
    return handleError(error);
  }
}
