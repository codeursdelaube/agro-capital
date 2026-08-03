"""
market_radar/router.py — Endpoints du module Market Radar.

POST /predict         → Prédiction de prix à J+15
GET  /score-vente     → Score d'opportunité de vente (0-100)
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.market_radar import service
from app.schemas.market_radar import PredictRequest, PredictResponse, ScoreVenteResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/market-radar",
    tags=["Market Radar"],
)


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Prédiction de prix à J+15",
    description=(
        "Prédit le prix d'une culture dans une région togolaise pour les 15 prochains jours. "
        "Utilise Prophet sur l'historique réel, avec fallback sur données synthétiques si nécessaire. "
        "Les résultats sont mis en cache 30 minutes."
    ),
)
async def predict_price(
    payload: PredictRequest,
    db: AsyncSession = Depends(get_db),
) -> PredictResponse:
    """Retourne la prédiction de prix avec tendance, confiance et conseil."""
    try:
        return await service.get_prediction(
            culture=payload.culture,
            region=payload.region,
            db=db,
        )
    except Exception as exc:
        logger.error("Erreur prédiction %s/%s: %s", payload.culture, payload.region, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul de la prédiction de prix.",
        )


@router.get(
    "/score-vente",
    response_model=ScoreVenteResponse,
    summary="Score d'opportunité de vente",
    description=(
        "Retourne un indice de 0 à 100 pour évaluer s'il faut vendre maintenant ou attendre. "
        "Score > 65 = vendre maintenant | Score < 35 = attendre | Entre les deux = neutre."
    ),
)
async def score_vente(
    culture: str,
    region: str,
    db: AsyncSession = Depends(get_db),
) -> ScoreVenteResponse:
    """Score d'opportunité de vente immédiate vs conservation."""
    try:
        return await service.get_score_vente(
            culture=culture,
            region=region,
            db=db,
        )
    except Exception as exc:
        logger.error("Erreur score-vente %s/%s: %s", culture, region, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul du score de vente.",
        )
