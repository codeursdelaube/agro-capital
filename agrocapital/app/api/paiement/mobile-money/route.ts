import { requireAuth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { mobileMoneySchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/**
 * POST /api/paiement/mobile-money
 *
 * Initie une transaction Mobile Money (T-Money ou Flooz).
 * Actuellement en mode SANDBOX : simule la réponse de l'opérateur.
 * En production : remplacer le bloc "SANDBOX" par l'appel API réel de l'opérateur.
 */
export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await parseBody(req, mobileMoneySchema);

    // Exactement un des deux doit être présent
    if (!body.commandeId && !body.demandeNantissementId) {
      return err("Une commande ou une demande de nantissement est requise", 400);
    }
    if (body.commandeId && body.demandeNantissementId) {
      return err("La transaction ne peut pas être liée à la fois à une commande et un nantissement", 400);
    }

    // Vérifier l'unicité (une seule transaction par commande / nantissement)
    if (body.commandeId) {
      const existante = await prisma.transactionMobileMoney.findUnique({
        where: { commandeId: body.commandeId },
      });
      if (existante && existante.statut === "REUSSIE") {
        return err("Cette commande a déjà été payée", 409);
      }
    }

    // =============================================
    // SANDBOX — Simuler la réponse de l'opérateur
    // En production, remplacer par l'appel API opérateur
    // =============================================
    const sandboxReponse = await simulerOperateurMobileMoney({
      operateur: body.operateur,
      numero: body.numeroCible,
      montant: body.montant,
    });
    // =============================================

    const transaction = await prisma.$transaction(async (tx: any) => {
      const nouvelleTransaction = await tx.transactionMobileMoney.create({
        data: {
          commandeId: body.commandeId,
          demandeNantissementId: body.demandeNantissementId,
          operateur: body.operateur,
          numeroCible: body.numeroCible,
          montant: body.montant,
          statut: sandboxReponse.succes ? "REUSSIE" : "ECHOUEE",
          reference: sandboxReponse.reference,
          metadonnees: sandboxReponse,
        },
        select: {
          id: true,
          statut: true,
          reference: true,
          montant: true,
          operateur: true,
          createdAt: true,
        },
      });

      // Si paiement d'une commande livrable → marquer comme LIVREE
      if (sandboxReponse.succes && body.commandeId) {
        await tx.commande.update({
          where: { id: body.commandeId },
          data: { statut: "LIVREE", modePaiement: body.operateur },
        });
      }

      return nouvelleTransaction;
    });

    if (!sandboxReponse.succes) {
      return ok(
        { transaction, message: "Transaction échouée — simulation sandbox" },
        402
      );
    }

    return ok({ transaction, message: "Paiement réussi" }, 201);
  } catch (error) {
    return handleError(error);
  }
}

// =============================================
// SANDBOX : simulateur de réponse opérateur
// =============================================
async function simulerOperateurMobileMoney(params: {
  operateur: string;
  numero: string;
  montant: number;
}): Promise<{
  succes: boolean;
  reference: string;
  operateur: string;
  timestamp: string;
  code: string;
  message: string;
}> {
  // Simuler une latence réseau réaliste
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Simuler un taux de succès de 90% (réaliste pour les intégrations Mobile Money)
  const succes = Math.random() > 0.1;
  const reference = `${params.operateur.toUpperCase()}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  return {
    succes,
    reference: succes ? reference : "",
    operateur: params.operateur,
    timestamp: new Date().toISOString(),
    code: succes ? "00" : "05",
    message: succes
      ? "Transaction approuvée"
      : "Transaction refusée — solde insuffisant ou réseau indisponible",
  };
}
