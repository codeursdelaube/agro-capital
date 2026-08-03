import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { approuverNantissementSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/nantissement/[id] — Détail d'une demande de nantissement */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;

    const demande = await prisma.demandeNantissement.findUnique({
      where: { id },
      select: {
        id: true,
        montantDemande: true,
        montantDebloque: true,
        tauxDecote: true,
        statut: true,
        motif: true,
        dateDebloiement: true,
        dateRemboursementDue: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, nom: true, telephone: true } },
        stock: {
          select: {
            id: true,
            culture: true,
            quantiteKg: true,
            valeurEstimee: true,
            statut: true,
          },
        },
        transaction: {
          select: { statut: true, reference: true, montant: true, operateur: true },
        },
      },
    });

    if (!demande) return err("Demande introuvable", 404);

    // Agriculteur ne voit que ses propres demandes, admin voit tout
    if (demande.user.id !== currentUser.id && currentUser.role !== "ADMIN") {
      return err("Accès refusé", 403);
    }

    return ok(demande);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/nantissement/[id] — Approuver ou rejeter une demande (ADMIN seulement)
 * En cas d'approbation : crédite le portefeuille bancaire de l'agriculteur
 * En cas de rejet : remet le stock en statut DISPONIBLE
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await parseBody(req, approuverNantissementSchema);

    const demande = await prisma.demandeNantissement.findUnique({
      where: { id },
      select: {
        id: true,
        statut: true,
        stockId: true,
        userId: true,
        montantDemande: true,
      },
    });

    if (!demande) return err("Demande introuvable", 404);
    if (demande.statut !== "EN_ATTENTE") {
      return err(`Cette demande a déjà été traitée (statut : ${demande.statut})`, 422);
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      if (body.statut === "REJETEE") {
        // Libérer le stock
        await tx.stock.update({
          where: { id: demande.stockId },
          data: { statut: "DISPONIBLE" },
        });

        return tx.demandeNantissement.update({
          where: { id },
          data: { statut: "REJETEE" },
          select: { id: true, statut: true, updatedAt: true },
        });
      }

      // APPROUVEE
      const montantDebloque = body.montantDebloque ?? demande.montantDemande;
      const tauxDecote = body.tauxDecote ?? 0.7;
      const dateDebloiement = body.dateDebloiement
        ? new Date(body.dateDebloiement)
        : new Date();
      const dateRemboursementDue = body.dateRemboursementDue
        ? new Date(body.dateRemboursementDue)
        : undefined;

      const demandeUpdated = await tx.demandeNantissement.update({
        where: { id },
        data: {
          statut: "APPROUVEE",
          montantDebloque,
          tauxDecote,
          dateDebloiement,
          ...(dateRemboursementDue ? { dateRemboursementDue } : {}),
        },
        select: { id: true, statut: true, montantDebloque: true, dateDebloiement: true, updatedAt: true },
      });

      // Créditer le portefeuille bancaire
      const portefeuille = await tx.portefeuilleBancaire.upsert({
        where: { userId: demande.userId },
        create: { userId: demande.userId, solde: montantDebloque },
        update: { solde: { increment: montantDebloque } },
        select: { id: true },
      });

      await tx.mouvementBancaire.create({
        data: {
          portefeuilleId: portefeuille.id,
          montant: montantDebloque,
          libelle: `Décaissement nantissement — Demande #${id.slice(-8).toUpperCase()}`,
          demandeNantissementId: id,
        },
      });

      // Notification à l'agriculteur
      await tx.notification.create({
        data: {
          userId: demande.userId,
          type: "NANTISSEMENT",
          titre: "Votre demande de nantissement a été approuvée",
          message: `${montantDebloque.toLocaleString("fr-FR")} FCFA ont été déposés dans votre portefeuille bancaire`,
          lienRessource: `/nantissement/${id}`,
        },
      });

      return demandeUpdated;
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
