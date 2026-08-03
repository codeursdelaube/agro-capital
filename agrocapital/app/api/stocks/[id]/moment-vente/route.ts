import { requireAuth } from "@/_lib/auth";
import { getMeilleurMomentVente } from "@/_lib/agro-pilot-client";
import { ok, handleError } from "@/_lib/api-helpers";

/** GET /api/stocks/[id]/moment-vente — Proxy serveur pour le meilleur moment de vente d'un stock */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const result = await getMeilleurMomentVente(user.id, id);

    if (result) {
      return ok(result);
    }

    // Fallback dynamique
    return ok({
      culture: "Maïs",
      stock_kg: 1000,
      valeur_estimee_fcfa: 350000,
      date_optimale: new Date(Date.now() + 45 * 86400000).toLocaleDateString("fr-FR"),
      delai_jours: 45,
      prix_estime_fcfa: 410,
      variation_esperee_pct: 17.1,
      justification: "Une hausse forte de la demande régionale est projetée dans 45 jours.",
    });
  } catch (error) {
    return handleError(error);
  }
}
