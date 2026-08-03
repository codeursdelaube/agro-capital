import { NextResponse } from "next/server";

/**
 * GET /api/prediction/[culture]
 * Renvoie les prédictions produites par le modèle IA (Market Radar) pour une culture.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ culture: string }> }
) {
  const { culture } = await params;

  // TODO: 1. Charger les données d'entraînement/données météo récentes & historiques depuis Prisma.
  // TODO: 2. Appeler le service/algorithme d'IA de prédiction des prix.
  // TODO: 3. Retourner l'intervalle de confiance (prix estimé, fourchette basse/haute).

  return NextResponse.json({
    culture,
    unite: "sac (100kg)",
    devise: "FCFA",
    predictions: [
      { mois: "Sept.", prix: 9300, bas: 8800, haut: 9800 },
      { mois: "Oct.", prix: 10200, bas: 9500, haut: 10900 },
      { mois: "Nov.", prix: 10800, bas: 9800, haut: 11600 },
    ],
    recommandation: "Attendre le mois d'octobre pour maximiser la marge.",
  });
}
