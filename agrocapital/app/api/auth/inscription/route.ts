import { prisma } from "@/_lib/prisma";
import { hashPin } from "@/_lib/auth";
import { inscriptionSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";

/** POST /api/auth/inscription — Créer un nouveau compte */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, inscriptionSchema);

    // Vérifier que le numéro n'est pas déjà utilisé
    const existant = await prisma.user.findUnique({
      where: { telephone: body.telephone },
    });
    if (existant) {
      return err("Ce numéro de téléphone est déjà enregistré", 409);
    }

    const pinHash = await hashPin(body.pin);

    // Découpage automatique Nom / Prénom si un seul champ complet a été fourni
    let nomFinal = body.nom.trim();
    let prenomFinal = body.prenom?.trim();

    if (!prenomFinal && nomFinal.includes(" ")) {
      const parts = nomFinal.split(/\s+/);
      nomFinal = parts[0];
      prenomFinal = parts.slice(1).join(" ");
    }

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          telephone: body.telephone,
          pinHash,
          nom: nomFinal,
          prenom: prenomFinal || null,
          region: body.region,
          role: body.role,
        },
        select: {
          id: true,
          telephone: true,
          nom: true,
          prenom: true,
          region: true,
          role: true,
          createdAt: true,
        },
      });

      // Créer les portefeuilles automatiquement pour les agriculteurs
      if (body.role === "AGRICULTEUR") {
        await tx.portefeuilleNumerique.create({ data: { userId: newUser.id } });
        await tx.portefeuilleBancaire.create({ data: { userId: newUser.id } });
      }

      return newUser;
    });

    return ok(user, 201);
  } catch (error) {
    return handleError(error);
  }
}
