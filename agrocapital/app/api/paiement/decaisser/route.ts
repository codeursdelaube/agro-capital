import { NextResponse } from "next/server";

/**
 * POST /api/paiement/decaisser
 * Simule le décaissement Mobile Money (T-Money ou Flooz) vers le téléphone de l'agriculteur.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { demandeId, montant, telephone, operateur } = body;

    if (!demandeId || !montant || !telephone) {
      return NextResponse.json(
        { error: "Les paramètres demandeId, montant et telephone sont requis." },
        { status: 400 }
      );
    }

    // TODO: 1. Appeler l'API de paiement Mobile Money partenaire (API Togocom T-Money / Moov Flooz).
    // TODO: 2. Mettre à jour le statut du paiement dans Prisma (`prisma.transaction.create` / `update`).
    // TODO: 3. Envoyer une notification SMS / notification in-app à l'utilisateur.

    return NextResponse.json({
      message: `Décaissement en cours vers le ${telephone} via ${operateur || "T-Money"} (Mock)`,
      transactionId: `tx_momo_${Date.now()}`,
      statut: "Envoyé",
      montant: Number(montant),
      telephone,
      operateur: operateur || "T-Money",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors du décaissement Mobile Money." },
      { status: 500 }
    );
  }
}
