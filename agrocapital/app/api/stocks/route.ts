import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { stockSchema } from "@/_lib/validators";
import { ok, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/stocks — Mes stocks physiques déclarés */
export async function GET(req: Request) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { searchParams } = new URL(req.url);
    const culture = searchParams.get("culture") ?? undefined;
    const statut = searchParams.get("statut") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where = {
      userId: currentUser.id,
      ...(culture ? { culture: { contains: culture, mode: "insensitive" as const } } : {}),
      ...(statut ? { statut: statut as never } : {}),
    };

    const [stocks, total] = await prisma.$transaction([
      prisma.stock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dateDeclaration: "desc" },
        select: {
          id: true,
          culture: true,
          quantiteKg: true,
          valeurEstimee: true,
          statut: true,
          dateDeclaration: true,
          updatedAt: true,
          notes: true,
          _count: { select: { produits: true, demandesNantissement: true } },
        },
      }),
      prisma.stock.count({ where }),
    ]);

    return ok({ stocks, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/stocks — Déclarer un nouveau stock physique */
export async function POST(req: Request) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const body = await parseBody(req, stockSchema);

    const stock = await prisma.stock.create({
      data: { ...body, userId: currentUser.id },
      select: {
        id: true,
        culture: true,
        quantiteKg: true,
        valeurEstimee: true,
        statut: true,
        dateDeclaration: true,
      },
    });

    return ok(stock, 201);
  } catch (error) {
    return handleError(error);
  }
}
