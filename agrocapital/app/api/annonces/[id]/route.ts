import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { updateAnnonceSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/annonces/[id] — Détail d'une annonce avec ses réservations */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const annonce = await prisma.annonceRecolte.findUnique({
      where: { id },
      select: {
        id: true,
        culture: true,
        quantiteEstimee: true,
        prixEstime: true,
        dateRecoltePrevu: true,
        statut: true,
        region: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, nom: true, prenom: true, region: true, telephone: true } },
        reservations: {
          select: {
            id: true,
            quantiteKg: true,
            commentaire: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!annonce) return err("Annonce introuvable", 404);
    return ok(annonce);
  } catch (error) {
    return handleError(error);
  }
}

/** PATCH /api/annonces/[id] — Modifier ou changer le statut d'une annonce */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const { id } = await params;
    const body = await parseBody(req, updateAnnonceSchema);

    const annonce = await prisma.annonceRecolte.findUnique({
      where: { id },
      select: { userId: true, statut: true },
    });
    if (!annonce) return err("Annonce introuvable", 404);
    if (annonce.userId !== currentUser.id) return err("Accès refusé", 403);

    const updated = await prisma.annonceRecolte.update({
      where: { id },
      data: {
        ...body,
        ...(body.dateRecoltePrevu ? { dateRecoltePrevu: new Date(body.dateRecoltePrevu) } : {}),
      },
      select: {
        id: true,
        culture: true,
        statut: true,
        quantiteEstimee: true,
        dateRecoltePrevu: true,
        updatedAt: true,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
