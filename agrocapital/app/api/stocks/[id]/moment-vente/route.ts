import { requireAuth } from "@/_lib/auth";
import { getMeilleurMomentVente } from "@/_lib/agro-pilot-client";
import { ok, err, handleError } from "@/_lib/api-helpers";

/** GET /api/stocks/[id]/moment-vente — Transmet directement à GET /agro-pilot/meilleur-moment-vente de FastAPI Railway */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const result = await getMeilleurMomentVente(user.id, id);

    if (!result) {
      return err("Impossible d'obtenir l'opportunité de vente depuis le service FastAPI Railway.", 502);
    }

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
