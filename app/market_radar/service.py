"""
market_radar/service.py — Orchestrateur du module Market Radar.

Flux pour POST /predict :
  1. Vérifie le cache TTL
  2. Charge l'historique depuis prix_historiques (DB) ou fallback synthétique
  3. Entraîne Prophet / régression → prix prévu J+15
  4. Classifie la tendance
  5. Génère la recommandation textuelle
  6. Met en cache + retourne

NOTE : Les noms de colonnes SQL (date, prix_par_kg, marche, culture) correspondent
au schéma décrit dans le brief. À ajuster si le schéma Prisma réel diffère.
"""
from __future__ import annotations

import asyncio
import logging

import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache import store as cache_store
from app.market_radar import forecaster, synthetic
from app.schemas.market_radar import PredictResponse, ScoreVenteResponse

logger = logging.getLogger(__name__)

# Nombre minimum de lignes en DB pour éviter le fallback synthétique
MIN_REAL_DATA_POINTS = 30


async def get_prediction(
    culture: str,
    region: str,
    db: AsyncSession,
) -> PredictResponse:
    """
    Retourne la prédiction de prix pour (culture, région).
    Utilise le cache si disponible, sinon calcule.
    """
    # ── 1. Cache ──────────────────────────────────────────────────────────────
    cached = cache_store.get_prediction(culture, region)
    if cached:
        logger.debug("Cache hit: prédiction %s/%s", culture, region)
        return PredictResponse(**cached)

    # ── 2. Données historiques ────────────────────────────────────────────────
    df, donnees_demo = await _load_price_history(culture, region, db)

    # ── 3. Prédiction (Prophet ou fallback) — dans un thread ─────────────────
    raw = await asyncio.to_thread(forecaster.predict_price, df, 15)

    # ── 4. Direction + confiance ──────────────────────────────────────────────
    tendance, confiance = forecaster.classify_direction(
        raw["prix_actuel"], raw["prix_prevu"]
    )
    # Si la confiance du modèle est faible, la déclasser légèrement
    confiance = round(min(confiance, raw["confiance_modele"] + 0.1), 2)

    # ── 5. Recommandation textuelle ───────────────────────────────────────────
    recommandation = _build_recommandation(tendance, confiance, raw)

    # ── 6. Construction de la réponse ─────────────────────────────────────────
    result = PredictResponse(
        culture=culture,
        region=region,
        tendance=tendance,
        confiance=confiance,
        prix_actuel=raw["prix_actuel"],
        prix_prevu_j15=raw["prix_prevu"],
        recommandation=recommandation,
        donnees_demo=donnees_demo,
    )

    # ── 7. Mise en cache ──────────────────────────────────────────────────────
    cache_store.set_prediction(culture, region, result.model_dump())
    return result


async def get_score_vente(
    culture: str,
    region: str,
    db: AsyncSession,
) -> ScoreVenteResponse:
    """
    Retourne le score d'opportunité de vente (0-100).
    """
    # ── Cache ─────────────────────────────────────────────────────────────────
    cached = cache_store.get_score(culture, region)
    if cached:
        return ScoreVenteResponse(**cached)

    # ── Récupère ou calcule la prédiction ─────────────────────────────────────
    pred = await get_prediction(culture, region, db)

    # ── Calcul du score ───────────────────────────────────────────────────────
    # On a besoin du prix moyen historique (inclus dans la réponse de forecaster)
    df, _ = await _load_price_history(culture, region, db)
    prix_moy = float(df["prix_par_kg"].mean()) if len(df) > 0 else pred.prix_actuel

    score, interpretation, justification = forecaster.compute_score_vente(
        prix_actuel=pred.prix_actuel,
        prix_prevu=pred.prix_prevu_j15,
        tendance=pred.tendance,
        confiance=pred.confiance,
        prix_historique_moy=prix_moy,
    )

    result = ScoreVenteResponse(
        culture=culture,
        region=region,
        score=score,
        interpretation=interpretation,
        justification=justification,
        donnees_demo=pred.donnees_demo,
    )

    cache_store.set_score(culture, region, result.model_dump())
    return result


# ── Fonctions internes ────────────────────────────────────────────────────────

async def _load_price_history(
    culture: str,
    region: str,
    db: AsyncSession,
) -> tuple[pd.DataFrame, bool]:
    """
    Charge l'historique de prix depuis la base.
    Retourne (DataFrame, donnees_demo).

    NOTE : Adapter les noms de colonnes si le schéma Prisma réel diffère.
    Table attendue : prix_historiques (date, culture, marche, prix_par_kg, indice_meteo)
    """
    try:
        # Lecture seule : SELECT uniquement
        result = await db.execute(
            text("""
                SELECT date, prix_par_kg, indice_meteo
                FROM prix_historiques
                WHERE LOWER(culture) = LOWER(:culture)
                  AND LOWER(marche) = LOWER(:region)
                  AND date >= NOW() - INTERVAL '2 years'
                ORDER BY date ASC
            """),
            {"culture": culture, "region": region},
        )
        rows = result.fetchall()

        if len(rows) >= MIN_REAL_DATA_POINTS:
            df = pd.DataFrame(rows, columns=["date", "prix_par_kg", "indice_meteo"])
            return df, False

        # Pas assez de données réelles → fallback synthétique
        logger.info(
            "Données insuffisantes pour %s/%s (%d points). Fallback synthétique.",
            culture, region, len(rows),
        )

    except Exception as exc:
        # La table n'existe pas encore ou erreur de connexion
        logger.warning("Impossible de lire prix_historiques: %s", exc)

    # ── Données synthétiques ──────────────────────────────────────────────────
    df = synthetic.generate_price_history(culture, region, n_jours=365)
    return df, True


def _build_recommandation(tendance: str, confiance: float, raw: dict) -> str:
    """Génère un conseil textuel court adapté à l'agriculteur togolais."""
    prix_actuel = raw["prix_actuel"]
    prix_prevu = raw["prix_prevu"]
    variation = ((prix_prevu - prix_actuel) / prix_actuel) * 100

    if tendance == "hausse":
        if confiance >= 0.70:
            return (
                f"Attendez 10 à 15 jours avant de vendre. "
                f"Le prix devrait passer de {prix_actuel:.0f} à {prix_prevu:.0f} FCFA/kg "
                f"(+{variation:.1f}%). Confiance élevée."
            )
        return (
            f"Légère hausse prévue ({variation:+.1f}%). "
            "Vous pouvez attendre quelques jours, mais la confiance est modérée."
        )
    elif tendance == "baisse":
        if confiance >= 0.70:
            return (
                f"Vendez dès que possible. Le prix risque de baisser de "
                f"{prix_actuel:.0f} à {prix_prevu:.0f} FCFA/kg ({variation:.1f}%)."
            )
        return (
            f"Légère baisse prévue ({variation:.1f}%). "
            "Envisagez de vendre dans les prochains jours."
        )
    else:
        return (
            f"Le prix devrait rester stable autour de {prix_actuel:.0f} FCFA/kg. "
            "Vendez selon vos besoins de trésorerie."
        )
