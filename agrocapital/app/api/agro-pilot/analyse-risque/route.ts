import { requireAuth } from "@/_lib/auth";
import { getAnalyseRisque } from "@/_lib/agro-pilot-client";
import { ok, handleError } from "@/_lib/api-helpers";

/** GET /api/agro-pilot/analyse-risque — Proxy serveur pour l'analyse de risque */
export async function GET() {
  try {
    const user = await requireAuth();
    const result = await getAnalyseRisque(user.id);

    if (result) {
      return ok(result);
    }

    // Fallback
    return ok({
      user_id: user.id,
      niveau_risque_global: "faible",
      score_risque: 25,
      risques_marche: [
        "Volatilité modérée du maïs avant la récolte principale.",
        "Possibilité d'afflux d'importations régionales.",
      ],
      risques_climatiques: [
        "Pluviométrie irrégulière possible en fin de saison.",
        "Risque de température élevée en période de séchage.",
      ],
      recommandations: [
        "Diversifier les ventes sur 2 périodes distinctes.",
        "Utiliser les entrepôts certifiés pour réduire les pertes post-récolte.",
      ],
    });
  } catch (error) {
    return handleError(error);
  }
}
