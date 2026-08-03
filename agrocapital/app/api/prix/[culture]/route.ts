import { NextResponse } from "next/server";

/**
 * GET /api/prix/[culture]
 * Renvoie l'historique des prix observés sur les marchés pour la culture spécifiée.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ culture: string }> }
) {
  const { culture } = await params;

  // TODO: 1. Valider la culture (maïs, soja, riz, mil, etc.).
  // TODO: 2. Récupérer l'historique des prix enregistrés dans Prisma (`prisma.historiquePrix.findMany`).

  return NextResponse.json({
    culture,
    unite: "sac (100kg)",
    devise: "FCFA",
    historique: [
      { mois: "Mars", prix: 7600 },
      { mois: "Avr.", prix: 7900 },
      { mois: "Mai", prix: 8200 },
      { mois: "Juin", prix: 8000 },
      { mois: "Juil.", prix: 8500 },
      { mois: "Août", prix: 8800 },
    ],
  });
}
