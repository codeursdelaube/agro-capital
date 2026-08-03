import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { updateProduitSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/marketplace/produits/[id] — Détail d'un produit (public) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const produit = await prisma.produit.findUnique({
      where: { id },
      select: {
        id: true,
        culture: true,
        nom: true,
        description: true,
        prixUnitaire: true,
        uniteMesure: true,
        quantiteDisponible: true,
        quantiteMinCommande: true,
        statut: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
        boutique: {
          select: {
            id: true,
            nom: true,
            photoUrl: true,
            user: {
              select: { id: true, nom: true, prenom: true, region: true, telephone: true },
            },
          },
        },
      },
    });

    if (!produit) return err("Produit introuvable", 404);
    return ok(produit);
  } catch (error) {
    return handleError(error);
  }
}

/** PATCH /api/marketplace/produits/[id] — Modifier un produit */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;
    const body = await parseBody(req, updateProduitSchema);

    // Vérifier la propriété via la boutique
    const produit = await prisma.produit.findUnique({
      where: { id },
      include: { boutique: true },
    });
    if (!produit) return err("Produit introuvable", 404);
    if (produit.boutique.userId !== currentUser.id) return err("Accès refusé", 403);

    // Recalculer le statut si la quantité change
    const nouvelleQte = body.quantiteDisponible ?? produit.quantiteDisponible;
    const statut =
      body.statut ??
      (nouvelleQte === 0 ? "RUPTURE" : produit.statut === "RUPTURE" ? "DISPONIBLE" : produit.statut);

    const updated = await prisma.produit.update({
      where: { id },
      data: { ...body, statut },
      select: {
        id: true,
        culture: true,
        nom: true,
        prixUnitaire: true,
        quantiteDisponible: true,
        statut: true,
        updatedAt: true,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/marketplace/produits/[id] — Archiver un produit */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;

    const produit = await prisma.produit.findUnique({
      where: { id },
      include: { boutique: true },
    });
    if (!produit) return err("Produit introuvable", 404);
    if (produit.boutique.userId !== currentUser.id) return err("Accès refusé", 403);

    await prisma.produit.update({
      where: { id },
      data: { statut: "ARCHIVE" },
    });

    return ok({ message: "Produit archivé" });
  } catch (error) {
    return handleError(error);
  }
}
