import { requireAuth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { suiviSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/notifications/suivis — Mes abonnements (agriculteurs et cultures suivis) */
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const suivis = await prisma.suivi.findMany({
      where: { followerId: currentUser.id },
      select: {
        id: true,
        cultureSuivie: true,
        createdAt: true,
        followedUser: {
          select: { id: true, nom: true, prenom: true, region: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ suivis });
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/notifications/suivis — S'abonner à un agriculteur ou une culture */
export async function POST(req: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await parseBody(req, suiviSchema);

    // Si suivi d'un agriculteur, vérifier qu'il existe et a le bon rôle
    if (body.followedUserId) {
      const agriculteur = await prisma.user.findUnique({
        where: { id: body.followedUserId },
        select: { role: true, actif: true },
      });
      if (!agriculteur || agriculteur.role !== "AGRICULTEUR") {
        return err("Utilisateur introuvable ou non agriculteur", 404);
      }
      if (body.followedUserId === currentUser.id) {
        return err("Vous ne pouvez pas vous suivre vous-même", 422);
      }
    }

    const suivi = await prisma.suivi.create({
      data: {
        followerId: currentUser.id,
        followedUserId: body.followedUserId,
        cultureSuivie: body.cultureSuivie,
      },
      select: {
        id: true,
        cultureSuivie: true,
        createdAt: true,
        followedUser: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    return ok(suivi, 201);
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/notifications/suivis?id=... — Se désabonner */
export async function DELETE(req: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return err("ID du suivi requis", 400);

    const suivi = await prisma.suivi.findUnique({
      where: { id },
      select: { followerId: true },
    });
    if (!suivi) return err("Suivi introuvable", 404);
    if (suivi.followerId !== currentUser.id) return err("Accès refusé", 403);

    await prisma.suivi.delete({ where: { id } });
    return ok({ message: "Désabonnement effectué" });
  } catch (error) {
    return handleError(error);
  }
}
