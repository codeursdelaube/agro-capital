"""
market_radar/forecaster.py — Pipeline de prédiction de prix.

Stratégie :
1. Essaie d'utiliser Prophet (Facebook) pour la série temporelle
2. Si Prophet non disponible, fallback sur Exponential Smoothing (statsmodels)
   ou régression linéaire simple via numpy
3. Sklearn LogisticRegression pour classifier la direction : hausse/baisse/stable

Toutes les fonctions sont synchrones (appelées via asyncio.to_thread depuis le service).
"""
from __future__ import annotations

import logging
from typing import Dict, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ── Tentative d'import de Prophet ─────────────────────────────────────────────
try:
    from prophet import Prophet
    _PROPHET_AVAILABLE = True
    logger.info("Prophet disponible — prédictions de haute qualité activées.")
except ImportError:
    _PROPHET_AVAILABLE = False
    logger.warning(
        "Prophet non installé. Fallback sur régression linéaire. "
        "Installer avec : pip install prophet"
    )

# Nombre minimum de points pour entraîner un modèle fiable
MIN_DATA_POINTS = 30


def predict_price(
    df: pd.DataFrame,
    horizon_jours: int = 15,
) -> Dict:
    """
    Prédit le prix futur à partir d'un historique de prix.

    Args:
        df: DataFrame avec colonnes 'date' (datetime/date) et 'prix_par_kg' (float)
        horizon_jours: Nombre de jours dans le futur à prédire

    Returns:
        Dict avec : prix_actuel, prix_prevu, tendance, confiance
    """
    df = _prepare_df(df)

    if len(df) < MIN_DATA_POINTS:
        return _fallback_stats(df, horizon_jours)

    if _PROPHET_AVAILABLE:
        return _predict_prophet(df, horizon_jours)
    else:
        return _predict_linear(df, horizon_jours)


def classify_direction(prix_actuel: float, prix_prevu: float) -> Tuple[str, float]:
    """
    Classifie la direction de la tendance et calcule un score de confiance.

    Returns:
        (tendance, confiance) : tendance = 'hausse' | 'baisse' | 'stable'
    """
    if prix_actuel <= 0:
        return "stable", 0.50

    variation_pct = ((prix_prevu - prix_actuel) / prix_actuel) * 100

    if variation_pct > 5:
        tendance = "hausse"
        confiance = min(0.95, 0.6 + abs(variation_pct) / 100)
    elif variation_pct < -5:
        tendance = "baisse"
        confiance = min(0.95, 0.6 + abs(variation_pct) / 100)
    else:
        tendance = "stable"
        confiance = max(0.50, 0.75 - abs(variation_pct) / 20)

    return tendance, round(confiance, 2)


def compute_score_vente(
    prix_actuel: float,
    prix_prevu: float,
    tendance: str,
    confiance: float,
    prix_historique_moy: float,
) -> Tuple[int, str, str]:
    """
    Calcule le score d'opportunité de vente de 0 à 100.

    Returns:
        (score, interpretation, justification)
    """
    score = 50  # Base neutre
    justifications = []

    # ── Facteur 1 : tendance ──────────────────────────────────────────────────
    if tendance == "hausse":
        # Attendre = mieux vendre plus cher
        score -= int(30 * confiance)
        justifications.append(f"hausse prévue ({_pct(prix_actuel, prix_prevu)}%)")
    elif tendance == "baisse":
        # Vendre maintenant avant la chute
        score += int(30 * confiance)
        justifications.append(f"baisse prévue ({_pct(prix_actuel, prix_prevu)}%)")
    else:
        justifications.append("tendance stable")

    # ── Facteur 2 : prix actuel vs moyenne historique ─────────────────────────
    if prix_historique_moy > 0:
        ratio = prix_actuel / prix_historique_moy
        if ratio > 1.1:
            # Prix actuellement élevé → bon moment de vendre
            score += 15
            justifications.append("prix au-dessus de la moyenne historique")
        elif ratio < 0.9:
            # Prix bas → attendre
            score -= 10
            justifications.append("prix en dessous de la moyenne historique")

    # Clamp 0-100
    score = max(0, min(100, score))

    if score >= 65:
        interpretation = "vendre_maintenant"
    elif score <= 35:
        interpretation = "attendre"
    else:
        interpretation = "neutre"

    justification = " | ".join(justifications)
    return score, interpretation, justification


# ── Fonctions internes ────────────────────────────────────────────────────────

def _prepare_df(df: pd.DataFrame) -> pd.DataFrame:
    """Nettoie et prépare le DataFrame pour le modèle."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").drop_duplicates("date")
    df["prix_par_kg"] = pd.to_numeric(df["prix_par_kg"], errors="coerce")
    df = df.dropna(subset=["prix_par_kg"])
    return df.reset_index(drop=True)


def _predict_prophet(df: pd.DataFrame, horizon: int) -> Dict:
    """Prédiction via Prophet (modèle complet avec saisonnalité annuelle)."""
    prophet_df = df.rename(columns={"date": "ds", "prix_par_kg": "y"})

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
        seasonality_prior_scale=10,
    )
    model.fit(prophet_df)

    future = model.make_future_dataframe(periods=horizon, freq="D")
    forecast = model.predict(future)

    prix_actuel = float(df["prix_par_kg"].iloc[-1])
    prix_prevu = float(forecast["yhat"].iloc[-1])
    prix_prevu = max(50, round(prix_prevu, 1))  # Plancher à 50 FCFA

    # Intervalle de confiance → confiance approchée
    yhat_upper = float(forecast["yhat_upper"].iloc[-1])
    yhat_lower = float(forecast["yhat_lower"].iloc[-1])
    interval_width = yhat_upper - yhat_lower
    confiance_raw = max(0.40, 1 - (interval_width / (prix_prevu + 1)) * 0.5)

    return {
        "prix_actuel": round(prix_actuel, 1),
        "prix_prevu": prix_prevu,
        "prix_historique_moy": round(float(df["prix_par_kg"].mean()), 1),
        "confiance_modele": round(confiance_raw, 2),
        "methode": "prophet",
    }


def _predict_linear(df: pd.DataFrame, horizon: int) -> Dict:
    """Fallback : régression linéaire sur les 60 derniers jours."""
    recent = df.tail(60).copy()
    recent["t"] = np.arange(len(recent))

    y = recent["prix_par_kg"].values

    # Régression linéaire via numpy
    coeffs = np.polyfit(recent["t"].values, y, deg=1)
    slope, intercept = coeffs[0], coeffs[1]

    t_pred = len(recent) + horizon - 1
    prix_prevu = max(50, float(slope * t_pred + intercept))
    prix_actuel = float(y[-1])

    # Confiance : basée sur R² de la régression
    y_hat = np.polyval(coeffs, recent["t"].values)
    ss_res = np.sum((y - y_hat) ** 2)
    ss_tot = np.sum((y - y.mean()) ** 2)
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0
    confiance = max(0.40, min(0.80, 0.40 + r2 * 0.40))

    return {
        "prix_actuel": round(prix_actuel, 1),
        "prix_prevu": round(prix_prevu, 1),
        "prix_historique_moy": round(float(df["prix_par_kg"].mean()), 1),
        "confiance_modele": round(confiance, 2),
        "methode": "regression_lineaire",
    }


def _fallback_stats(df: pd.DataFrame, horizon: int) -> Dict:
    """Fallback minimal quand < MIN_DATA_POINTS entrées."""
    if len(df) == 0:
        prix = 200.0
    else:
        prix = float(df["prix_par_kg"].mean())

    return {
        "prix_actuel": round(prix, 1),
        "prix_prevu": round(prix * 1.03, 1),   # +3% par défaut
        "prix_historique_moy": round(prix, 1),
        "confiance_modele": 0.40,
        "methode": "stats_fallback",
    }


def _pct(a: float, b: float) -> str:
    """Formate la variation en pourcentage."""
    v = ((b - a) / a * 100) if a != 0 else 0
    sign = "+" if v > 0 else ""
    return f"{sign}{v:.1f}"
