import { prisma } from "@/_lib/prisma";
import { verifyPin, createSession } from "@/_lib/auth";
import { connexionSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** POST /api/auth/connexion — Authentifier un utilisateur */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, connexionSchema);

    const user = await prisma.user.findUnique({
      where: { telephone: body.telephone },
      select: {
        id: true,
        telephone: true,
        nom: true,
        prenom: true,
        region: true,
        role: true,
        actif: true,
        pinHash: true,
      },
    });

    // Message générique pour ne pas révéler si le numéro existe
    if (!user || !user.actif) {
      return err("Numéro ou PIN incorrect", 401);
    }

    const pinValide = await verifyPin(body.pin, user.pinHash);
    if (!pinValide) {
      return err("Numéro ou PIN incorrect", 401);
    }

    // Créer la session et poser le cookie
    await createSession(user.id);

    // Ne jamais retourner le pinHash
    const { pinHash: _, ...userSafe } = user;
    return ok({ user: userSafe });
  } catch (error) {
    return handleError(error);
  }
}
