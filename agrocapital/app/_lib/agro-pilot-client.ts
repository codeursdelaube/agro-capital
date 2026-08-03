/**
 * Client serveur sécurisé pour le service FastAPI Agro-Pilot déployé sur Railway.
 * Ce fichier s'exécute EXCLUSIVEMENT CÔTÉ SERVEUR (dans les Route Handlers Next.js).
 * L'URL Railway n'est JAMAIS exposée au client.
 */

const BASE_URL = process.env.AGRO_PILOT_API_URL || "https://agro-capital-production.up.railway.app";
const TIMEOUT_MS = 10000;

async function fetchFastAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
      cache: "no-store", // Données toujours à jour
    });

    if (!res.ok) {
      console.error(`[FastAPI Error] ${endpoint} returned status ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[FastAPI Network Error] ${endpoint}:`, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// TYPES DE RÉPONSE EXPORTS FASTAPI
// ============================================================

export type HealthResponse = {
  status: string;
  service: string;
  version: string;
  modules: string[];
};

export type PredictMarketResponse = {
  culture: string;
  region: string;
  tendance: "hausse" | "baisse" | "stable";
  confiance: number;
  prix_actuel: number;
  prix_prevu_j15: number;
  recommandation: string;
  donnees_demo: boolean;
};

export type ScoreVenteResponse = {
  culture: string;
  region: string;
  score: number;
  interpretation: "vendre_maintenant" | "attendre" | "neutre";
  justification: string;
  donnees_demo: boolean;
};

export type ChatPilotResponse = {
  reponse: string;
  contexte_utilise: boolean;
};

export type RecommandationCultureResponse = {
  user_id: string;
  cultures: Array<{
    culture: string;
    score_rentabilite: number;
    raison: string;
    saison_optimale: string;
  }>;
  source: "cache_db" | "calcul_frais";
  date_calcul: string;
};

export type MeilleurMomentVenteResponse = {
  culture: string;
  stock_kg: number;
  valeur_estimee_fcfa: number;
  date_optimale: string;
  delai_jours: number;
  prix_estime_fcfa: number;
  variation_esperee_pct: number;
  justification: string;
};

export type PeriodePlantationResponse = {
  culture: string;
  region: string;
  periode_optimale: string;
  mois_debut: string;
  mois_fin: string;
  duree_cycle_jours: number;
  conseils: string;
};

export type AnalyseRisqueResponse = {
  user_id: string;
  niveau_risque_global: "faible" | "modere" | "eleve";
  score_risque: number;
  risques_marche: string[];
  risques_climatiques: string[];
  recommandations: string[];
};

export type DossierFinancementResponse = {
  type_demande: "pret_agricole" | "subvention" | "microfinance";
  texte_dossier: string;
  documents_requis: string[];
  conseils_redaction: string;
};

// ============================================================
// METHODES DE CLIENT SERVEUR
// ============================================================

export async function checkFastAPIHealth(): Promise<HealthResponse | null> {
  return fetchFastAPI<HealthResponse>("/health");
}

export async function predictMarketRadar(culture: string, region: string): Promise<PredictMarketResponse | null> {
  return fetchFastAPI<PredictMarketResponse>("/market-radar/predict", {
    method: "POST",
    body: JSON.stringify({ culture, region }),
  });
}

export async function getScoreVente(culture: string, region: string): Promise<ScoreVenteResponse | null> {
  return fetchFastAPI<ScoreVenteResponse>(`/market-radar/score-vente?culture=${encodeURIComponent(culture)}&region=${encodeURIComponent(region)}`);
}

export async function sendPilotChat(userId: string, message: string): Promise<ChatPilotResponse | null> {
  return fetchFastAPI<ChatPilotResponse>("/agro-pilot/chat", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, message }),
  });
}

export async function getRecommandationCulture(userId: string): Promise<RecommandationCultureResponse | null> {
  return fetchFastAPI<RecommandationCultureResponse>(`/agro-pilot/recommandation-culture?user_id=${encodeURIComponent(userId)}`);
}

export async function getMeilleurMomentVente(userId: string, stockId: string): Promise<MeilleurMomentVenteResponse | null> {
  return fetchFastAPI<MeilleurMomentVenteResponse>(`/agro-pilot/meilleur-moment-vente?user_id=${encodeURIComponent(userId)}&stock_id=${encodeURIComponent(stockId)}`);
}

export async function getPeriodePlantation(culture: string, region: string): Promise<PeriodePlantationResponse | null> {
  return fetchFastAPI<PeriodePlantationResponse>(`/agro-pilot/periode-plantation?culture=${encodeURIComponent(culture)}&region=${encodeURIComponent(region)}`);
}

export async function getAnalyseRisque(userId: string): Promise<AnalyseRisqueResponse | null> {
  return fetchFastAPI<AnalyseRisqueResponse>(`/agro-pilot/analyse-risque?user_id=${encodeURIComponent(userId)}`);
}

export async function generateDossierFinancement(userId: string, typeDemande: "pret_agricole" | "subvention" | "microfinance"): Promise<DossierFinancementResponse | null> {
  return fetchFastAPI<DossierFinancementResponse>("/agro-pilot/dossier-financement", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, type_demande: typeDemande }),
  });
}
