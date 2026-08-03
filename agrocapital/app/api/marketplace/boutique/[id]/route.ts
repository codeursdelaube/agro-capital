import { requireRole, requireAuth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { boutiqueSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/marketplace/boutique/[id] — Détail d'une boutique (public) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const boutique = await prisma.boutique.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        description: true,
        photoUrl: true,
        actif: true,
        createdAt: true,
        user: {
          select: { id: true, nom: true, prenom: true, region: true },
        },
        produits: {
          where: { statut: "DISPONIBLE" },
          select: {
            id: true,
            culture: true,
            nom: true,
            prixUnitaire: true,
            uniteMesure: true,
            quantiteDisponible: true,
            photoUrl: true,
            statut: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!boutique) return err("Boutique introuvable", 404);
    return ok(boutique);
  } catch (error) {
    return handleError(error);
  }
}

/** PATCH /api/marketplace/boutique/[id] — Modifier sa boutique */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;
    const body = await parseBody(req, boutiqueSchema.partial());

    const boutique = await prisma.boutique.findUnique({ where: { id } });
    if (!boutique) return err("Boutique introuvable", 404);
    if (boutique.userId !== currentUser.id) return err("Accès refusé", 403);

    const updated = await prisma.boutique.update({
      where: { id },
      data: body,
      select: { id: true, nom: true, description: true, photoUrl: true, actif: true, updatedAt: true },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/marketplace/boutique/[id] — Archiver sa boutique (soft delete) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;

    const boutique = await prisma.boutique.findUnique({ where: { id } });
    if (!boutique) return err("Boutique introuvable", 404);
    if (boutique.userId !== currentUser.id) return err("Accès refusé", 403);

    await prisma.boutique.update({ where: { id }, data: { actif: false } });
    return ok({ message: "Boutique désactivée" });
  } catch (error) {
    return handleError(error);
  }
}
