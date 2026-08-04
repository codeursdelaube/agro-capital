import { predictMarketRadar, getScoreVente } from "@/_lib/agro-pilot-client";
import { ok, err, handleError } from "@/_lib/api-helpers";

/** POST /api/marche/radar — Transmet directement aux endpoints Market Radar de FastAPI Railway */
export async function POST(req: Request) {
  try {
    const { culture, region } = await req.json();
    const targetCulture = culture || "Maïs";
    const targetRegion = region || "Lomé";

    const [predict, score] = await Promise.all([
      predictMarketRadar(targetCulture, targetRegion),
      getScoreVente(targetCulture, targetRegion),
    ]);

    if (!predict || !score) {
      return err("Impossible d'obtenir les prédictions Market Radar depuis le service FastAPI Railway.", 502);
    }

    return ok({
      prediction: predict,
      scoreVente: score,
    });
  } catch (error) {
    return handleError(error);
  }
}
