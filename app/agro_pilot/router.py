"""
agro_pilot/router.py — Endpoints du module Agro-Pilot.

POST /agro-pilot/chat
GET  /agro-pilot/recommandation-culture
GET  /agro-pilot/meilleur-moment-vente
GET  /agro-pilot/periode-plantation
GET  /agro-pilot/analyse-risque
POST /agro-pilot/dossier-financement
POST /agro-pilot/diagnostic-image
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.agro_pilot import service
from app.agro_pilot.llm_client import diagnose_plant_image
from app.schemas.agro_pilot import (
    ChatRequest,
    ChatResponse,
    RecommandationCultureResponse,
    MeilleurMomentVenteResponse,
    PeriodePlantationResponse,
    AnalyseRisqueResponse,
    DossierFinancementRequest,
    DossierFinancementResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/agro-pilot",
    tags=["Agro-Pilot"],
)


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat avec Agro-Pilot",
    description=(
        "Envoie un message à Agro-Pilot. Le contexte de l'agriculteur (stocks, ventes, région) "
        "est chargé automatiquement depuis la base de données — ne redemandez jamais des "
        "informations déjà présentes. Alimenté par Gemini 1.5 Flash."
    ),
)
async def chat(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    try:
        return await service.chat(payload.user_id, payload.message, db)
    except Exception as exc:
        logger.error("Erreur chat user %s: %s", payload.user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la génération de la réponse.",
        )


@router.get(
    "/recommandation-culture",
    response_model=RecommandationCultureResponse,
    summary="Quoi cultiver cette saison ?",
    description=(
        "Recommande les cultures les plus rentables pour l'agriculteur, basées sur son historique "
        "et les prix du marché. Vérifie d'abord les recommandations récentes en DB (< 7 jours). "
        "Note : ce service calcule et retourne, mais ne persiste pas en DB (lecture seule)."
    ),
)
async def recommandation_culture(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> RecommandationCultureResponse:
    try:
        return await service.recommandation_culture(user_id, db)
    except Exception as exc:
        logger.error("Erreur recommandation-culture user %s: %s", user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul des recommandations.",
        )


@router.get(
    "/meilleur-moment-vente",
    response_model=MeilleurMomentVenteResponse,
    summary="Quand vendre ce stock ?",
    description=(
        "Calcule le timing optimal pour vendre un stock donné en combinant "
        "la prédiction de prix (Prophet) et les données du stock de l'agriculteur."
    ),
)
async def meilleur_moment_vente(
    user_id: str,
    stock_id: str,
    db: AsyncSession = Depends(get_db),
) -> MeilleurMomentVenteResponse:
    try:
        return await service.meilleur_moment_vente(user_id, stock_id, db)
    except Exception as exc:
        logger.error("Erreur meilleur-moment-vente %s/%s: %s", user_id, stock_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul du moment de vente.",
        )


@router.get(
    "/periode-plantation",
    response_model=PeriodePlantationResponse,
    summary="Période idéale de plantation",
    description=(
        "Retourne la période de plantation optimale pour une culture dans une région du Togo. "
        "Basé sur un calendrier agricole togolais calibré — réponse instantanée (pas de DB)."
    ),
)
async def periode_plantation(
    culture: str,
    region: str,
) -> PeriodePlantationResponse:
    try:
        return await service.periode_plantation(culture, region)
    except Exception as exc:
        logger.error("Erreur periode-plantation %s/%s: %s", culture, region, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul de la période de plantation.",
        )


@router.get(
    "/analyse-risque",
    response_model=AnalyseRisqueResponse,
    summary="Analyse des risques",
    description=(
        "Analyse les risques climatiques et de marché pour l'agriculteur. "
        "Combine les données de stocks, les tendances de prix et le calendrier climatique togolais."
    ),
)
async def analyse_risque(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> AnalyseRisqueResponse:
    try:
        return await service.analyse_risque(user_id, db)
    except Exception as exc:
        logger.error("Erreur analyse-risque user %s: %s", user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'analyse des risques.",
        )


@router.post(
    "/dossier-financement",
    response_model=DossierFinancementResponse,
    summary="Générer un dossier de financement",
    description=(
        "Génère un texte d'aide à la rédaction de dossier de prêt ou subvention, "
        "personnalisé selon les données de l'agriculteur. "
        "Types acceptés : pret_agricole | subvention | microfinance."
    ),
)
async def dossier_financement(
    payload: DossierFinancementRequest,
    db: AsyncSession = Depends(get_db),
) -> DossierFinancementResponse:
    try:
        return await service.dossier_financement(payload.user_id, payload.type_demande, db)
    except Exception as exc:
        logger.error("Erreur dossier-financement user %s: %s", payload.user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la génération du dossier.",
        )


@router.post("/agro-pilot/diagnostic-image")
async def diagnostic_image(file: UploadFile = File(...)):
    """
    Reçoit une photo de plante et retourne un diagnostic des maladies possibles.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier envoyé n'est pas une image.")

    image_bytes = await file.read()

    if len(image_bytes) > 5 * 1024 * 1024:  # 5 Mo
        raise HTTPException(status_code=400, detail="Image trop volumineuse (max 5 Mo).")

    result = await diagnose_plant_image(image_bytes, mime_type=file.content_type)
    return result
