import { requireAuth } from "@/_lib/auth";
import { getRecommandationCulture } from "@/_lib/agro-pilot-client";
import { ok, err, handleError } from "@/_lib/api-helpers";

/** GET /api/agro-pilot/recommandations — Transmet à GET /agro-pilot/recommandation-culture de FastAPI Railway */
export async function GET() {
  try {
    const user = await requireAuth();
    const result = await getRecommandationCulture(user.id);

    if (!result) {
      return err("Impossible de récupérer les recommandations depuis le service FastAPI Railway.", 502);
    }

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
