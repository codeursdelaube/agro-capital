import { requireRole } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { produitSchema, produitsFiltresSchema } from "@/_lib/validators";
import { ok, err, handleError, parseBody } from "@/_lib/api-helpers";
import type { Prisma } from "@prisma/client";

/** GET /api/marketplace/produits — Catalogue public avec filtres */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params = produitsFiltresSchema.parse(Object.fromEntries(searchParams));

    const where: Prisma.ProduitWhereInput = {
      statut: params.statut ?? "DISPONIBLE",
      ...(params.culture
        ? { culture: { contains: params.culture, mode: "insensitive" } }
        : {}),
      ...(params.prixMin !== undefined || params.prixMax !== undefined
        ? {
            prixUnitaire: {
              ...(params.prixMin !== undefined ? { gte: params.prixMin } : {}),
              ...(params.prixMax !== undefined ? { lte: params.prixMax } : {}),
            },
          }
        : {}),
      ...(params.region
        ? { boutique: { user: { region: params.region } } }
        : {}),
      boutique: { actif: true },
    };

    const [produits, total] = await prisma.$transaction([
      prisma.produit.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: "desc" },
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
          boutique: {
            select: {
              id: true,
              nom: true,
              user: { select: { id: true, nom: true, prenom: true, region: true } },
            },
          },
        },
      }),
      prisma.produit.count({ where }),
    ]);

    return ok({ produits, total, page: params.page, limit: params.limit });
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/marketplace/produits — Ajouter un produit à sa boutique */
export async function POST(req: Request) {
  try {
    const currentUser = await requireRole("AGRICULTEUR");
    const body = await parseBody(req, produitSchema);

    // Récupérer la boutique de l'agriculteur
    const boutique = await prisma.boutique.findUnique({
      where: { userId: currentUser.id },
    });
    if (!boutique) {
      return err("Vous devez d'abord créer votre boutique", 422);
    }
    if (!boutique.actif) {
      return err("Votre boutique est désactivée", 422);
    }

    // Si un stock source est spécifié, vérifier qu'il appartient bien à l'agriculteur
    if (body.stockSourceId) {
      const stock = await prisma.stock.findUnique({
        where: { id: body.stockSourceId },
      });
      if (!stock || stock.userId !== currentUser.id) {
        return err("Stock source invalide ou non autorisé", 422);
      }
      if (stock.statut === "NANTI") {
        return err("Ce stock est actuellement nanti et ne peut pas être mis en vente", 422);
      }
    }

    const produit = await prisma.produit.create({
      data: { ...body, boutiqueId: boutique.id },
      select: {
        id: true,
        culture: true,
        nom: true,
        prixUnitaire: true,
        uniteMesure: true,
        quantiteDisponible: true,
        statut: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    return ok(produit, 201);
  } catch (error) {
    return handleError(error);
  }
}
