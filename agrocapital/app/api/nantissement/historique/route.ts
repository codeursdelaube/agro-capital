import { NextResponse } from "next/server";

/**
 * GET /api/nantissement/historique
 * Récupère l'historique des demandes de nantissement de l'agriculteur connecté.
 */
export async function GET() {
  // TODO: 1. Identifier l'utilisateur connecté via sa session/JWT.
  // TODO: 2. Récupérer toutes ses demandes de nantissement dans Prisma (`prisma.demandeNantissement.findMany`).

  return NextResponse.json({
    historique: [
      {
        id: "dem_101",
        culture: "Maïs",
        quantiteGarantie: "42 sacs",
        montantDebloque: 200000,
        statut: "Acceptée",
        date: "2026-07-25",
        operateur: "T-Money",
      },
      {
        id: "dem_102",
        culture: "Soja",
        quantiteGarantie: "12 sacs",
        montantDebloque: 50000,
        statut: "Remboursé",
        date: "2026-06-10",
        operateur: "Flooz",
      },
    ],
  });
}
