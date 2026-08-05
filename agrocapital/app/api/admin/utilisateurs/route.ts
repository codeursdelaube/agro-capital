import { requireAdminAccess } from "@/_lib/admin-auth";
import { prisma } from "@/_lib/prisma";
import { ok, handleError } from "@/_lib/api-helpers";

/** GET /api/admin/utilisateurs — Lister tous les utilisateurs */
export async function GET(req: Request) {
  try {
    await requireAdminAccess();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") ?? undefined;
    const recherche = searchParams.get("q") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

    const where = {
      ...(role ? { role: role as never } : {}),
      ...(recherche
        ? {
            OR: [
              { nom: { contains: recherche, mode: "insensitive" as const } },
              { prenom: { contains: recherche, mode: "insensitive" as const } },
              { telephone: { contains: recherche, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [utilisateurs, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          telephone: true,
          nom: true,
          prenom: true,
          region: true,
          role: true,
          actif: true,
          createdAt: true,
          _count: {
            select: {
              stocks: true,
              commandesAcheteur: true,
              commandesVendeur: true,
              demandesNantissement: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return ok({ utilisateurs, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
