import { requireAuth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { ok, err, handleError } from "@/_lib/api-helpers";

/** GET /api/notifications — Mes notifications (non lues en priorité) */
export async function GET(req: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(req.url);
    const nonLuesSeulement = searchParams.get("nonLues") === "true";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where = {
      userId: currentUser.id,
      ...(nonLuesSeulement ? { lu: false } : {}),
    };

    const [notifications, total, totalNonLues] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ lu: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          type: true,
          titre: true,
          message: true,
          lienRessource: true,
          lu: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: currentUser.id, lu: false } }),
    ]);

    return ok({ notifications, total, totalNonLues, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/notifications — Marquer des notifications comme lues
 * Body: { ids: string[] } ou { toutesLues: true }
 */
export async function PATCH(req: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await req.json();

    if (body.toutesLues === true) {
      // Marquer toutes les notifications comme lues
      const { count } = await prisma.notification.updateMany({
        where: { userId: currentUser.id, lu: false },
        data: { lu: true },
      });
      return ok({ message: `${count} notifications marquées comme lues` });
    }

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return err("Fournissez des IDs de notifications ou toutesLues: true", 400);
    }

    // Marquer les notifications spécifiées comme lues (en vérifiant l'appartenance)
    const { count } = await prisma.notification.updateMany({
      where: { id: { in: body.ids }, userId: currentUser.id },
      data: { lu: true },
    });

    return ok({ message: `${count} notification(s) marquée(s) comme lue(s)` });
  } catch (error) {
    return handleError(error);
  }
}
