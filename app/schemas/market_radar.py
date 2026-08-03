"""
schemas/market_radar.py — Modèles Pydantic pour le module Market Radar.
"""
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    culture: str = Field(..., example="maïs", description="Nom de la culture agricole")
    region: str = Field(..., example="Maritime", description="Région du Togo")


class PredictResponse(BaseModel):
    culture: str
    region: str
    tendance: str = Field(..., description="hausse | baisse | stable")
    confiance: float = Field(..., ge=0.0, le=1.0, description="Score de confiance entre 0 et 1")
    prix_actuel: float = Field(..., description="Prix actuel moyen en FCFA/kg")
    prix_prevu_j15: float = Field(..., description="Prix prévu dans 15 jours en FCFA/kg")
    recommandation: str = Field(..., description="Conseil textuel pour l'agriculteur")
    donnees_demo: bool = Field(
        False,
        description="True si les données historiques réelles sont insuffisantes — données simulées utilisées"
    )


class ScoreVenteResponse(BaseModel):
    culture: str
    region: str
    score: int = Field(..., ge=0, le=100, description="Score d'opportunité de vente (0=conserver, 100=vendre immédiatement)")
    interpretation: str = Field(..., description="vendre_maintenant | attendre | neutre")
    justification: str = Field(..., description="Explication courte du score")
    donnees_demo: bool = False
