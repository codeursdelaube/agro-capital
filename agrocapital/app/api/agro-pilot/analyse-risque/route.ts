import { requireAuth } from "@/_lib/auth";
import { getAnalyseRisque } from "@/_lib/agro-pilot-client";
import { ok, err, handleError } from "@/_lib/api-helpers";

/** GET /api/agro-pilot/analyse-risque — Transmet à GET /agro-pilot/analyse-risque de FastAPI Railway */
export async function GET() {
  try {
    const user = await requireAuth();
    const result = await getAnalyseRisque(user.id);

    if (!result) {
      return err("Impossible de récupérer l'analyse de risque depuis le service FastAPI Railway.", 502);
    }

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
