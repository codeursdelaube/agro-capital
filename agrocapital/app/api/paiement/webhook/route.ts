import { NextResponse } from "next/server";

/**
 * POST /api/paiement/webhook
 * Reçoit les notifications asynchrones de statut de paiement en provenance des agrégateurs T-Money/Flooz.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { transactionId, status, externalReference } = payload;

    // TODO: 1. Vérifier la signature de sécurité du Webhook (HMAC / Clé API partenaire).
    // TODO: 2. Rechercher la transaction dans Prisma (`prisma.transaction.findUnique`).
    // TODO: 3. Mettre à jour le statut de la demande et du stock associé si paiement validé ou échoué.

    return NextResponse.json({
      received: true,
      transactionId,
      status: status || "SUCCESS",
      reference: externalReference,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors du traitement du Webhook de paiement." },
      { status: 400 }
    );
  }
}
