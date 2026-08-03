import { requireRole, requireAuth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { annonceSchema, reservationSchema } from "@/_lib/validators";
import { ok, handleError, parseBody } from "@/_lib/api-helpers";

/** GET /api/annonces — Lister les annonces de récolte (public avec filtres) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const culture = searchParams.get("culture") ?? undefined;
    const region = searchParams.get("region") ?? undefined;
    const statut = searchParams.get("statut") ?? "OUVERTE";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where = {
      ...(statut ? { statut: statut as never } : {}),
      ...(culture ? { culture: { contains: culture, mode: "insensitive" as const } } : {}),
      ...(region ? { region } : {}),
    };

    const [annonces, total] = await prisma.$transaction([
      prisma.annonceRecolte.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dateRecoltePrevu: "asc" },
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
          user: { select: { id: true, nom: true, prenom: true } },
          _count: { select: { reservations: true } },
        },
      }),
      prisma.annonceRecolte.count({ where }),
    ]);

    return ok({ annonces, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/annonces — Créer une annonce de récolte OU réserver sur une annonce */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action"); // "reserver" pour les réservations

    if (action === "reserver") {
      // Réservation client sur une annonce existante
      const currentUser = await requireAuth();
      const body = await parseBody(req, reservationSchema);

      const annonce = await prisma.annonceRecolte.findUnique({
        where: { id: body.annonceId },
        select: { statut: true, userId: true },
      });

      if (!annonce || annonce.statut !== "OUVERTE") {
        const { err } = await import("@/_lib/api-helpers");
        return err("Cette annonce n'accepte pas de réservation", 422);
      }
      if (annonce.userId === currentUser.id) {
        const { err } = await import("@/_lib/api-helpers");
        return err("Vous ne pouvez pas réserver votre propre annonce", 422);
      }

      const reservation = await prisma.$transaction(async (tx: any) => {
        const res = await tx.reservation.create({
          data: {
            annonceId: body.annonceId,
            clientId: currentUser.id,
            quantiteKg: body.quantiteKg,
            commentaire: body.commentaire,
          },
        });

        // Notifier l'agriculteur
        await tx.notification.create({
          data: {
            userId: annonce.userId,
            type: "ANNONCE",
            titre: "Nouvelle réservation",
            message: `${currentUser.nom} a réservé ${body.quantiteKg} kg sur votre annonce`,
            lienRessource: `/annonces/${body.annonceId}`,
          },
        });

        return res;
      });

      return ok(reservation, 201);
    }

    // Création d'une annonce par un agriculteur
    const currentUser = await requireRole("AGRICULTEUR");
    const body = await parseBody(req, annonceSchema);

    const annonce = await prisma.annonceRecolte.create({
      data: {
        ...body,
        dateRecoltePrevu: new Date(body.dateRecoltePrevu),
        userId: currentUser.id,
      },
      select: {
        id: true,
        culture: true,
        quantiteEstimee: true,
        prixEstime: true,
        dateRecoltePrevu: true,
        statut: true,
        region: true,
        createdAt: true,
      },
    });

    // Notifier les utilisateurs qui suivent cette culture
    const suiveurs = await prisma.suivi.findMany({
      where: { cultureSuivie: { equals: body.culture, mode: "insensitive" } },
      select: { followerId: true },
    });

    if (suiveurs.length > 0) {
      await prisma.notification.createMany({
        data: suiveurs.map((s: any) => ({
          userId: s.followerId,
          type: "ANNONCE" as const,
          titre: `Nouvelle récolte annoncée : ${body.culture}`,
          message: `${currentUser.nom} annonce une récolte de ${body.quantiteEstimee} kg dans la région ${body.region}`,
          lienRessource: `/annonces/${annonce.id}`,
        })),
        skipDuplicates: true,
      });
    }

    return ok(annonce, 201);
  } catch (error) {
    return handleError(error);
  }
}
