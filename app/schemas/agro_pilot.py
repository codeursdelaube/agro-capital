"""
schemas/agro_pilot.py — Modèles Pydantic pour le module Agro-Pilot.
"""
from typing import List
from pydantic import BaseModel, Field


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    user_id: str = Field(..., description="UUID de l'agriculteur (table users)")
    message: str = Field(..., min_length=1, max_length=2000, description="Message de l'agriculteur")


class ChatResponse(BaseModel):
    reponse: str = Field(..., description="Réponse d'Agro-Pilot")
    contexte_utilise: bool = Field(True, description="Indique si le contexte DB a été chargé")


# ── Recommandation culture ─────────────────────────────────────────────────────

class CultureRecommandee(BaseModel):
    culture: str
    score_rentabilite: float = Field(..., description="Score estimé de 0 à 10")
    raison: str
    saison_optimale: str


class RecommandationCultureResponse(BaseModel):
    user_id: str
    cultures: List[CultureRecommandee]
    source: str = Field(..., description="cache_db | calcul_frais")
    date_calcul: str


# ── Meilleur moment de vente ───────────────────────────────────────────────────

class MeilleurMomentVenteResponse(BaseModel):
    culture: str
    stock_kg: float
    valeur_estimee_fcfa: float
    date_optimale: str = Field(..., description="Date optimale suggérée (YYYY-MM-DD)")
    delai_jours: int = Field(..., description="Nombre de jours à attendre")
    prix_estime_fcfa: float
    variation_esperee_pct: float = Field(..., description="Variation de prix espérée en %")
    justification: str


# ── Période de plantation ─────────────────────────────────────────────────────

class PeriodePlantationResponse(BaseModel):
    culture: str
    region: str
    periode_optimale: str = Field(..., description="Ex : Avril – Juin")
    mois_debut: int = Field(..., ge=1, le=12)
    mois_fin: int = Field(..., ge=1, le=12)
    duree_cycle_jours: int
    conseils: str


# ── Analyse de risque ─────────────────────────────────────────────────────────

class AnalyseRisqueResponse(BaseModel):
    user_id: str
    niveau_risque_global: str = Field(..., description="faible | modere | eleve")
    score_risque: int = Field(..., ge=0, le=100)
    risques_marche: List[str]
    risques_climatiques: List[str]
    recommandations: List[str]


# ── Dossier de financement ────────────────────────────────────────────────────

class DossierFinancementRequest(BaseModel):
    user_id: str
    type_demande: str = Field(
        ...,
        description="pret_agricole | subvention | microfinance",
        example="pret_agricole"
    )


class DossierFinancementResponse(BaseModel):
    type_demande: str
    texte_dossier: str = Field(..., description="Texte d'aide à la rédaction du dossier")
    documents_requis: List[str] = Field(..., description="Liste des pièces justificatives nécessaires")
    conseils_redaction: str = Field(..., description="Conseils pour maximiser les chances d'acceptation")
