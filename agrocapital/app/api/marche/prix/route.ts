import { prisma } from "@/_lib/prisma";
import { prixFiltresSchema } from "@/_lib/validators";
import { ok, err, handleError } from "@/_lib/api-helpers";

/**
 * GET /api/marche/prix
 * Historique des prix par culture et région — lu par le frontend ET par FastAPI (read-only).
 * Query params : culture (requis), region, dateDebut, dateFin, page, limit
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params = prixFiltresSchema.parse(Object.fromEntries(searchParams));

    const where = {
      culture: { contains: params.culture, mode: "insensitive" as const },
      ...(params.region ? { region: params.region } : {}),
      ...(params.dateDebut || params.dateFin
        ? {
            date: {
              ...(params.dateDebut ? { gte: new Date(params.dateDebut) } : {}),
              ...(params.dateFin ? { lte: new Date(params.dateFin) } : {}),
            },
          }
        : {}),
    };

    const [prix, total] = await prisma.$transaction([
      prisma.prixHistorique.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { date: "desc" },
        select: {
          id: true,
          culture: true,
          region: true,
          prix: true,
          source: true,
          date: true,
        },
      }),
      prisma.prixHistorique.count({ where }),
    ]);

    // Calculer des statistiques de base pour le graphique
    const stats =
      prix.length > 0
        ? {
            prixMin: Math.min(...prix.map((p: { prix: number }) => p.prix)),
            prixMax: Math.max(...prix.map((p: { prix: number }) => p.prix)),
            prixMoyen:
              prix.reduce((acc: number, p: { prix: number }) => acc + p.prix, 0) / prix.length,
          }
        : null;

    return ok({ prix, total, stats, page: params.page, limit: params.limit });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/marche/prix — Enregistrer un prix observé (ADMIN ou système)
 * Utilisé pour alimenter la table PrixHistorique depuis le terrain
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { culture, region, prix, source, date } = body;

    if (!culture || !region || !prix) {
      return err("culture, region et prix sont requis", 400);
    }

    const nouveau = await prisma.prixHistorique.create({
      data: {
        culture,
        region,
        prix: Number(prix),
        source: source ?? "collecte_terrain",
        date: date ? new Date(date) : new Date(),
      },
      select: { id: true, culture: true, region: true, prix: true, source: true, date: true },
    });

    return ok(nouveau, 201);
  } catch (error) {
    return handleError(error);
  }
}
