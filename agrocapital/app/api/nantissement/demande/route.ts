import { NextResponse } from "next/server";

/**
 * POST /api/nantissement/demande
 * Soumet une nouvelle demande de micro-nantissement basée sur un stock de récolte déclaré.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stockId, montantDemande, operateur, telephonePay } = body;

    if (!stockId || !montantDemande) {
      return NextResponse.json(
        { error: "Le stockId et le montant demandé sont requis." },
        { status: 400 }
      );
    }

    // TODO: 1. Vérifier si le stockId existe et est disponible dans Prisma (`prisma.stock.findUnique`).
    // TODO: 2. Calculer le ratio de garantie (max 40% de la valeur estimée du stock).
    // TODO: 3. Créer l'enregistrement de la demande dans Prisma (`prisma.demandeNantissement.create`).
    // TODO: 4. Déclencher le processus de décaissement Mobile Money via l'API partenaire (T-Money/Flooz).

    return NextResponse.json(
      {
        message: "Demande de nantissement enregistrée avec succès (Placeholder API)",
        demande: {
          id: `dem_${Date.now()}`,
          stockId,
          montantDemande: Number(montantDemande),
          statut: "En attente",
          operateur: operateur || "T-Money",
          telephonePay: telephonePay || "90 12 34 56",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la création de la demande de nantissement." },
      { status: 500 }
    );
  }
}
