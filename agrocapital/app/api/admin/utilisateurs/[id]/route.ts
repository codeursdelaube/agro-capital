import { requireAdminAccess } from "@/_lib/admin-auth";
import { prisma } from "@/_lib/prisma";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";
import { z } from "zod";

const updateActifSchema = z.object({
  actif: z.boolean(),
  motif: z.string().optional(),
});

/** GET /api/admin/utilisateurs/[id] — Détails d'un utilisateur */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        telephone: true,
        nom: true,
        prenom: true,
        region: true,
        role: true,
        actif: true,
        createdAt: true,
        updatedAt: true,
        boutique: { select: { id: true, nom: true } },
        stocks: { select: { id: true, culture: true, quantiteKg: true, valeurEstimee: true, statut: true } },
        demandesNantissement: { select: { id: true, montantDemande: true, statut: true, createdAt: true } },
        commandesAcheteur: { select: { id: true, montantTotal: true, statut: true } },
        commandesVendeur: { select: { id: true, montantTotal: true, statut: true } },
      },
    });

    if (!user) return err("Utilisateur introuvable", 404);

    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

/** PATCH /api/admin/utilisateurs/[id] — Bannir (actif: false) ou Réactiver (actif: true) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess();
    const { id } = await params;
    const body = await parseBody(req, updateActifSchema);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, actif: true },
    });

    if (!user) return err("Utilisateur introuvable", 404);

    // Ne pas se bannir soi-même s'il est ADMIN principal
    if (user.role === "ADMIN" && !body.actif) {
      return err("Impossible de bannir un compte Administrateur principal", 422);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { actif: body.actif },
      select: { id: true, nom: true, telephone: true, actif: true, updatedAt: true },
    });

    // Si banni, supprimer les sessions actives pour déconnecter immédiatement
    if (!body.actif) {
      await prisma.session.deleteMany({ where: { userId: id } }).catch(() => {});
    }

    return ok(updatedUser);
  } catch (error) {
    return handleError(error);
  }
}
