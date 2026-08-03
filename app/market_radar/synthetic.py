"""
market_radar/synthetic.py — Générateur de données de prix synthétiques réalistes.

Utilisé en fallback quand la table prix_historiques contient moins de
MIN_DATA_POINTS entrées pour une (culture, région) donnée.

Données calibrées sur les marchés agricoles togolais (FCFA/kg).
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Dict

import pandas as pd
import numpy as np

# ── Prix de base par culture (FCFA/kg) ────────────────────────────────────────
# Source : estimations marchés Lomé/Kara 2023-2024

PRIX_BASE: Dict[str, Dict] = {
    "maïs": {
        "base": 220,
        "min": 150,
        "max": 320,
        # Facteur saisonnier par mois (1 = neutre, >1 = plus cher, <1 = moins cher)
        # Le maïs est moins cher après récolte (oct-déc) et plus cher en saison creuse (mai-août)
        "saisonnalite": [1.1, 1.2, 1.2, 1.3, 1.4, 1.3, 1.1, 1.0, 0.9, 0.8, 0.85, 0.9],
    },
    "manioc": {
        "base": 150,
        "min": 80,
        "max": 250,
        "saisonnalite": [1.0, 1.0, 0.95, 0.9, 1.0, 1.1, 1.1, 1.0, 0.95, 0.9, 0.95, 1.0],
    },
    "igname": {
        "base": 350,
        "min": 200,
        "max": 600,
        "saisonnalite": [1.2, 1.3, 1.4, 1.3, 1.1, 0.9, 0.8, 0.85, 0.9, 0.95, 1.0, 1.1],
    },
    "arachide": {
        "base": 480,
        "min": 300,
        "max": 700,
        "saisonnalite": [1.1, 1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.85, 0.9, 1.0, 1.1, 1.2],
    },
    "sorgho": {
        "base": 200,
        "min": 130,
        "max": 300,
        "saisonnalite": [1.1, 1.2, 1.2, 1.1, 1.0, 0.9, 0.85, 0.85, 0.8, 0.85, 0.9, 1.0],
    },
    "mil": {
        "base": 180,
        "min": 120,
        "max": 280,
        "saisonnalite": [1.1, 1.2, 1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.8, 0.85, 0.9, 1.0],
    },
    "haricot": {
        "base": 550,
        "min": 350,
        "max": 900,
        "saisonnalite": [1.0, 1.0, 1.1, 1.1, 1.2, 1.1, 1.0, 0.9, 0.85, 0.9, 0.95, 1.0],
    },
    "tomate": {
        "base": 300,
        "min": 100,
        "max": 700,
        "saisonnalite": [0.8, 0.7, 0.75, 0.9, 1.2, 1.4, 1.5, 1.3, 1.1, 0.9, 0.8, 0.75],
    },
    "piment": {
        "base": 400,
        "min": 200,
        "max": 800,
        "saisonnalite": [0.9, 0.9, 1.0, 1.1, 1.3, 1.4, 1.3, 1.1, 0.9, 0.85, 0.85, 0.9],
    },
    "coton": {
        "base": 260,
        "min": 200,
        "max": 320,
        "saisonnalite": [1.0, 1.0, 1.0, 1.0, 0.95, 0.95, 0.9, 0.9, 0.95, 1.0, 1.05, 1.05],
    },
    "gombo": {
        "base": 350,
        "min": 200,
        "max": 600,
        "saisonnalite": [1.1, 1.2, 1.1, 1.0, 0.9, 0.85, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05],
    },
}

# Culture par défaut si non reconnue
_DEFAULT_CULTURE = "maïs"


def _get_config(culture: str) -> Dict:
    """Retourne la configuration de prix pour une culture, avec fallback."""
    culture_norm = culture.strip().lower()
    return PRIX_BASE.get(culture_norm, PRIX_BASE[_DEFAULT_CULTURE])


def generate_price_history(
    culture: str,
    region: str,
    n_jours: int = 365,
    end_date: date | None = None,
) -> pd.DataFrame:
    """
    Génère un historique de prix synthétique réaliste pour (culture, région).

    Args:
        culture: Nom de la culture
        region: Région du Togo (influence légèrement les prix)
        n_jours: Nombre de jours d'historique à générer
        end_date: Dernier jour de la série (défaut = aujourd'hui)

    Returns:
        DataFrame avec colonnes : date, prix_par_kg, indice_meteo
    """
    if end_date is None:
        end_date = date.today()

    config = _get_config(culture)

    # Légère variation régionale (±10%)
    region_factor = _region_factor(region)

    dates = []
    prix = []
    meteo = []

    # Prix initial basé sur le mois de départ
    start_date = end_date - timedelta(days=n_jours - 1)
    current_price = config["base"] * region_factor

    rng = np.random.default_rng(seed=hash(f"{culture}{region}") % (2**32))

    for i in range(n_jours):
        current_date = start_date + timedelta(days=i)
        month_idx = current_date.month - 1  # 0-based

        # Prix cible pour ce mois
        target_price = config["base"] * config["saisonnalite"][month_idx] * region_factor

        # Mouvement brownien géométrique (tendance vers la cible + bruit)
        drift = (target_price - current_price) * 0.05
        noise = rng.normal(0, config["base"] * 0.02)  # Bruit de 2%
        current_price = max(config["min"], min(config["max"], current_price + drift + noise))

        # Indice météo : 0.5 = sécheresse, 1.0 = normal, 1.5 = bonnes pluies
        indice = round(rng.uniform(0.6, 1.4), 2)

        dates.append(current_date)
        prix.append(round(current_price, 1))
        meteo.append(indice)

    return pd.DataFrame({"date": dates, "prix_par_kg": prix, "indice_meteo": meteo})


def _region_factor(region: str) -> float:
    """
    Ajustement de prix selon la région (proximité des marchés).
    Lomé/Maritime = référence. Les régions éloignées ont des prix légèrement différents.
    """
    facteurs = {
        "maritime": 1.00,
        "lomé": 1.00,
        "lome": 1.00,
        "plateaux": 0.95,
        "centrale": 0.92,
        "kara": 0.90,
        "savanes": 0.88,
    }
    return facteurs.get(region.strip().lower(), 1.00)
