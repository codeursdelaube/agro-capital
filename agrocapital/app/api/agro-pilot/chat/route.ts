import { requireAuth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { ok, err, handleError } from "@/_lib/api-helpers";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1, "Le message ne peut pas être vide").max(1000),
});

const BASE_URL = process.env.AGRO_PILOT_API_URL || "https://agro-capital-production.up.railway.app";

/**
 * POST /api/agro-pilot/chat
 *
 * 1. Charge le contexte complet de l'agriculteur depuis la DB (stocks, annonces,
 *    commandes, nantissements, portefeuille, région…)
 * 2. Envoie le message + contexte enrichi au backend FastAPI Railway
 */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = chatSchema.parse(body);

    // ─── Charger le contexte agriculteur depuis la DB ────────────────────────
    const contexteAgriculteur = await buildContexteAgriculteur(user.id, user.role);

    // ─── Appel FastAPI avec le contexte enrichi ───────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let fastApiResult = null;

    try {
      const res = await fetch(`${BASE_URL}/agro-pilot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          message: parsed.message,
          // Contexte injecté directement dans le payload
          contexte_agriculteur: contexteAgriculteur,
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.ok) {
        fastApiResult = await res.json();
      } else {
        console.error(`[FastAPI Chat] Status ${res.status}`);
      }
    } catch (e) {
      console.error("[FastAPI Chat Network Error]", e);
    } finally {
      clearTimeout(timeout);
    }

    if (!fastApiResult) {
      return err("Le service Agro-Pilot n'a pas répondu. Réessayez dans quelques instants.", 502);
    }

    return ok({
      reponse: fastApiResult.reponse,
      contexte_utilise: fastApiResult.contexte_utilise ?? true,
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── Construction du contexte agriculteur ────────────────────────────────────

async function buildContexteAgriculteur(userId: string, role: string) {
  if (role !== "AGRICULTEUR") {
    // Pour les CLIENTs : contexte minimal
    return { role: "CLIENT" };
  }

  // Charger toutes les données pertinentes en parallèle
  const [user, stocks, annonces, commandes, nantissements, portefeuilleBancaire] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { nom: true, prenom: true, region: true },
      }),
      prisma.stock.findMany({
        where: { userId },
        select: {
          culture: true,
          quantiteKg: true,
          valeurEstimee: true,
          statut: true,
          dateDeclaration: true,
          notes: true,
        },
        orderBy: { dateDeclaration: "desc" },
        take: 10,
      }),
      prisma.annonceRecolte.findMany({
        where: { userId },
        select: {
          culture: true,
          quantiteEstimee: true,
          prixEstime: true,
          dateRecoltePrevu: true,
          statut: true,
          region: true,
        },
        orderBy: { dateRecoltePrevu: "asc" },
        take: 5,
      }),
      prisma.commande.findMany({
        where: { vendeurId: userId },
        select: {
          montantTotal: true,
          statut: true,
          createdAt: true,
          produit: { select: { culture: true, nom: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.demandeNantissement.findMany({
        where: { userId },
        select: {
          montantDemande: true,
          montantDebloque: true,
          statut: true,
          createdAt: true,
          stock: { select: { culture: true, quantiteKg: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.portefeuilleBancaire.findUnique({
        where: { userId },
        select: { solde: true },
      }),
    ]);

  // Calculer des métriques agrégées utiles pour les conseils
  const totalStockKg = stocks.reduce((s, st) => s + st.quantiteKg, 0);
  const stocksDisponibles = stocks.filter((s) => s.statut === "DISPONIBLE");
  const culturesUniques = [...new Set(stocks.map((s) => s.culture))];
  const revenuTotalCommandes = commandes.reduce((s, c) => s + c.montantTotal, 0);
  const nantissementEnCours = nantissements.find(
    (n) => n.statut === "EN_ATTENTE" || n.statut === "APPROUVEE"
  );

  return {
    role: "AGRICULTEUR",
    profil: {
      nom: user ? `${user.nom}${user.prenom ? " " + user.prenom : ""}` : "Agriculteur",
      region: user?.region ?? "Non renseignée",
    },
    stocks: {
      total_kg: totalStockKg,
      cultures: culturesUniques,
      nombre_stocks: stocks.length,
      stocks_disponibles: stocksDisponibles.map((s) => ({
        culture: s.culture,
        quantite_kg: s.quantiteKg,
        valeur_estimee_fcfa: s.valeurEstimee,
        notes: s.notes,
      })),
    },
    annonces_recolte: annonces.map((a) => ({
      culture: a.culture,
      quantite_estimee_kg: a.quantiteEstimee,
      prix_estime_fcfa: a.prixEstime,
      date_recolte_prevue: a.dateRecoltePrevu?.toISOString().split("T")[0],
      statut: a.statut,
      region: a.region,
    })),
    ventes_recentes: commandes.map((c) => ({
      produit: c.produit?.culture ?? "Inconnu",
      montant_fcfa: c.montantTotal,
      statut: c.statut,
    })),
    revenu_total_fcfa: revenuTotalCommandes,
    warrantage: nantissementEnCours
      ? {
          statut: nantissementEnCours.statut,
          montant_demande: nantissementEnCours.montantDemande,
          montant_debloque: nantissementEnCours.montantDebloque,
          culture_nantie: nantissementEnCours.stock?.culture,
        }
      : null,
    solde_portefeuille_fcfa: portefeuilleBancaire?.solde ?? 0,
  };
}
