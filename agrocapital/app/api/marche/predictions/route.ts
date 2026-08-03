import { prisma } from "@/_lib/prisma";
import { ok, err, handleError } from "@/_lib/api-helpers";

/**
 * GET /api/marche/predictions
 * Prédictions de prix générées par le service Agro-Pilot (FastAPI).
 * Next.js lit cette table — FastAPI écrit dedans.
 * Query params : culture, region
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const culture = searchParams.get("culture");
    const region = searchParams.get("region") ?? undefined;

    if (!culture) return err("Le paramètre culture est requis", 400);

    const now = new Date();

    // Récupérer uniquement les prédictions non expirées
    const predictions = await prisma.prediction.findMany({
      where: {
        culture: { contains: culture, mode: "insensitive" },
        ...(region ? { region } : {}),
        dateExpiration: { gt: now }, // Ne retourner que les prédictions valides
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        culture: true,
        region: true,
        prixPrevu: true,
        tendance: true,
        confiance: true,
        recommandation: true,
        periodeOptimale: true,
        dateExpiration: true,
        createdAt: true,
      },
    });

    if (predictions.length === 0) {
      // Aucune prédiction disponible — retourner un message clair pour l'UI
      return ok({
        predictions: [],
        message: "Aucune prédiction disponible pour cette culture/région. Le service Agro-Pilot mettra bientôt à jour les données.",
      });
    }

    return ok({ predictions });
  } catch (error) {
    return handleError(error);
  }
}
