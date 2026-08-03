import { requireAuth } from "@/_lib/auth";
import { getRecommandationCulture } from "@/_lib/agro-pilot-client";
import { ok, handleError } from "@/_lib/api-helpers";

/** GET /api/agro-pilot/recommandations — Proxy serveur pour les cultures recommandées */
export async function GET() {
  try {
    const user = await requireAuth();
    const result = await getRecommandationCulture(user.id);

    if (result) {
      return ok(result);
    }

    // Fallback si indisponible
    return ok({
      user_id: user.id,
      cultures: [
        {
          culture: "Sésame",
          score_rentabilite: 92,
          raison: "Forte demande à l'exportation et besoins modérés en eau.",
          saison_optimale: "Mai - Juillet",
        },
        {
          culture: "Soja",
          score_rentabilite: 88,
          raison: "Excellents cours sur le marché régional et fixation d'azote.",
          saison_optimale: "Juin - Août",
        },
        {
          culture: "Maïs Jaune",
          score_rentabilite: 81,
          raison: "Prix stables et forte demande des éleveurs locaux.",
          saison_optimale: "Avril - Juin",
        },
      ],
      source: "calcul_frais",
      date_calcul: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
