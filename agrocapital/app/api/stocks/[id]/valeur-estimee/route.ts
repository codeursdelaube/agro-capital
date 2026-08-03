import { NextResponse } from "next/server";

/**
 * GET /api/stocks/[id]/valeur-estimee
 * Calcule et renvoie l'estimation réévaluée de la valeur d'un stock par l'analyse IA.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: 1. Charger les détails du stock depuis Prisma (`prisma.stock.findUnique`).
  // TODO: 2. Exécuter la formule/modèle d'estimation IA basée sur le prix actuel et la prédiction météo/marché.
  // TODO: 3. Retourner la valeur estimée actuelle et la valeur projetée.

  return NextResponse.json({
    stockId: id,
    culture: "Maïs",
    quantite: 42,
    valeurActuelle: 369600, // 42 * 8800 FCFA
    valeurEstimeeFuture: 428400, // 42 * 10200 FCFA (octobre)
    gainPotentiel: 58800,
    devise: "FCFA",
  });
}
