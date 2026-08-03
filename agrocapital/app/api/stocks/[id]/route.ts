import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { updateStockSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/stocks/[id] — Détail d'un stock */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;

    const stock = await prisma.stock.findUnique({
      where: { id, userId: currentUser.id },
      select: {
        id: true,
        culture: true,
        quantiteKg: true,
        valeurEstimee: true,
        statut: true,
        dateDeclaration: true,
        updatedAt: true,
        notes: true,
        produits: {
          select: { id: true, nom: true, quantiteDisponible: true, statut: true },
        },
        demandesNantissement: {
          select: {
            id: true,
            montantDemande: true,
            montantDebloque: true,
            statut: true,
            createdAt: true,
          },
        },
      },
    });

    if (!stock) return err("Stock introuvable", 404);
    return ok(stock);
  } catch (error) {
    return handleError(error);
  }
}

/** PATCH /api/stocks/[id] — Mettre à jour un stock */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;
    const body = await parseBody(req, updateStockSchema);

    const stock = await prisma.stock.findUnique({
      where: { id },
      select: { userId: true, statut: true },
    });
    if (!stock) return err("Stock introuvable", 404);
    if (stock.userId !== currentUser.id) return err("Accès refusé", 403);

    // Ne pas modifier un stock nanti sans passer par le processus de nantissement
    if (stock.statut === "NANTI" && body.statut && body.statut !== "NANTI") {
      return err(
        "Ce stock est nanti. Veuillez d'abord rembourser ou annuler la demande de nantissement.",
        422
      );
    }

    const updated = await prisma.stock.update({
      where: { id },
      data: body,
      select: { id: true, culture: true, quantiteKg: true, statut: true, updatedAt: true },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/stocks/[id] — Supprimer un stock (seulement si DISPONIBLE) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;

    const stock = await prisma.stock.findUnique({
      where: { id },
      select: { userId: true, statut: true, _count: { select: { produits: true } } },
    });
    if (!stock) return err("Stock introuvable", 404);
    if (stock.userId !== currentUser.id) return err("Accès refusé", 403);
    if (stock.statut !== "DISPONIBLE") {
      return err(
        `Impossible de supprimer un stock avec statut "${stock.statut}"`,
        422
      );
    }
    if (stock._count.produits > 0) {
      return err(
        "Ce stock est lié à des produits en boutique. Archivez d'abord les produits.",
        422
      );
    }

    await prisma.stock.delete({ where: { id } });
    return ok({ message: "Stock supprimé" });
  } catch (error) {
    return handleError(error);
  }
}
