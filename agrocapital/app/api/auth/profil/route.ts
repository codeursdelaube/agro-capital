import { requireAuth, deleteSession } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { updateProfilSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/auth/profil — Profil de l'utilisateur connecté */
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        telephone: true,
        nom: true,
        prenom: true,
        region: true,
        role: true,
        actif: true,
        createdAt: true,
        boutique: { select: { id: true, nom: true, actif: true } },
        portefeuilleNumerique: { select: { solde: true } },
        portefeuilleBancaire: { select: { solde: true } },
        _count: {
          select: {
            stocks: true,
            commandesAcheteur: true,
            commandesVendeur: true,
            annonces: true,
          },
        },
      },
    });

    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

/** PATCH /api/auth/profil — Mettre à jour son profil */
export async function PATCH(req: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await parseBody(req, updateProfilSchema);

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: body,
      select: {
        id: true,
        telephone: true,
        nom: true,
        prenom: true,
        region: true,
        role: true,
        updatedAt: true,
      },
    });

    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/auth/profil — Déconnexion */
export async function DELETE() {
  try {
    await deleteSession();
    return ok({ message: "Déconnecté avec succès" });
  } catch (error) {
    return handleError(error);
  }
}
