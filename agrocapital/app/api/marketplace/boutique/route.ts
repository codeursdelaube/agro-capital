import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { boutiqueSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/marketplace/boutique — Lister les boutiques (public) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where = {
      actif: true,
      ...(region ? { user: { region } } : {}),
      ...(q
        ? {
            OR: [
              { nom: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [boutiques, total] = await prisma.$transaction([
      prisma.boutique.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nom: true,
          description: true,
          photoUrl: true,
          createdAt: true,
          user: {
            select: { id: true, nom: true, prenom: true, region: true },
          },
          _count: { select: { produits: true } },
        },
      }),
      prisma.boutique.count({ where }),
    ]);

    return ok({ boutiques, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/marketplace/boutique — Créer sa boutique (AGRICULTEUR seulement) */
export async function POST(req: Request) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const body = await parseBody(req, boutiqueSchema);

    // Vérifier qu'il n'a pas déjà une boutique (contrainte unique)
    const existante = await prisma.boutique.findUnique({
      where: { userId: currentUser.id },
    });
    if (existante) {
      return err("Vous avez déjà une boutique", 409);
    }

    const boutique = await prisma.boutique.create({
      data: { ...body, userId: currentUser.id },
      select: {
        id: true,
        nom: true,
        description: true,
        photoUrl: true,
        actif: true,
        createdAt: true,
      },
    });

    return ok(boutique, 201);
  } catch (error) {
    return handleError(error);
  }
}
