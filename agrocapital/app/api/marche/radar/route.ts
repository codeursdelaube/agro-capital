import { predictMarketRadar, getScoreVente } from "@/_lib/agro-pilot-client";
import { ok, handleError } from "@/_lib/api-helpers";

/** POST /api/marche/radar — Prédiction et score de marché */
export async function POST(req: Request) {
  try {
    const { culture, region } = await req.json();
    const targetCulture = culture || "Maïs";
    const targetRegion = region || "Lomé";

    const [predict, score] = await Promise.all([
      predictMarketRadar(targetCulture, targetRegion),
      getScoreVente(targetCulture, targetRegion),
    ]);

    return ok({
      prediction: predict || {
        culture: targetCulture,
        region: targetRegion,
        tendance: "hausse",
        confiance: 0.85,
        prix_actuel: 350,
        prix_prevu_j15: 380,
        recommandation: "Conservez vos stocks pendant 15 jours. Une hausse de 8.5% est projetée.",
        donnees_demo: true,
      },
      scoreVente: score || {
        culture: targetCulture,
        region: targetRegion,
        score: 78,
        interpretation: "attendre",
        justification: "Le marché est orienté à la hausse. Patientez quelques semaines.",
        donnees_demo: true,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
