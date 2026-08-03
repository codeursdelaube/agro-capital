"""
agro_pilot/risk_analyzer.py — Analyse des risques climatiques et marché.

Combine des règles métier (saisonnalité togolaise, seuils de prix) avec
des données du contexte de l'agriculteur pour produire un profil de risque.
Pas de LLM ici : réponse rapide et déterministe.
"""
from __future__ import annotations

from datetime import date
from typing import Dict, List, Any

# ── Données climatiques Togo par région et mois ───────────────────────────────
# Indice de risque sécheresse par mois (0 = faible, 1 = élevé)
RISQUE_SECHERESSE: Dict[str, List[float]] = {
    "maritime":  [0.1, 0.2, 0.1, 0.1, 0.2, 0.6, 0.7, 0.6, 0.2, 0.1, 0.3, 0.2],
    "plateaux":  [0.2, 0.3, 0.1, 0.1, 0.2, 0.5, 0.7, 0.7, 0.2, 0.1, 0.2, 0.3],
    "centrale":  [0.3, 0.4, 0.2, 0.2, 0.3, 0.6, 0.8, 0.8, 0.3, 0.2, 0.4, 0.4],
    "kara":      [0.4, 0.5, 0.2, 0.2, 0.3, 0.5, 0.8, 0.8, 0.3, 0.2, 0.5, 0.5],
    "savanes":   [0.6, 0.7, 0.3, 0.2, 0.3, 0.5, 0.7, 0.7, 0.3, 0.2, 0.6, 0.7],
}
_DEFAULT_REGION = "maritime"

# Indice de risque inondation par mois
RISQUE_INONDATION: Dict[str, List[float]] = {
    "maritime":  [0.1, 0.1, 0.2, 0.4, 0.6, 0.3, 0.2, 0.3, 0.5, 0.4, 0.2, 0.1],
    "plateaux":  [0.1, 0.1, 0.3, 0.5, 0.6, 0.3, 0.1, 0.2, 0.5, 0.5, 0.2, 0.1],
    "centrale":  [0.1, 0.1, 0.2, 0.4, 0.5, 0.3, 0.1, 0.1, 0.4, 0.4, 0.2, 0.1],
    "kara":      [0.1, 0.1, 0.2, 0.4, 0.5, 0.3, 0.1, 0.1, 0.4, 0.3, 0.1, 0.1],
    "savanes":   [0.1, 0.1, 0.2, 0.3, 0.4, 0.3, 0.1, 0.1, 0.3, 0.3, 0.1, 0.1],
}


def analyze_risk(context: Dict[str, Any]) -> Dict:
    """
    Analyse les risques pour l'agriculteur basée sur son contexte.

    Args:
        context: Dict retourné par context_builder.build_farmer_context()

    Returns:
        Dict avec niveau_risque, score, risques_marche, risques_climatiques, recommandations
    """
    region = context.get("user", {}).get("region", "maritime").lower()
    stocks = context.get("stocks", [])
    ventes = context.get("ventes_recentes", [])
    stats = context.get("resume_stats", {})

    risques_marche: List[str] = []
    risques_climatiques: List[str] = []
    recommandations: List[str] = []

    score = 0  # Score global de risque (0 = faible, 100 = très élevé)

    # ── Risques climatiques ───────────────────────────────────────────────────
    mois_actuel = date.today().month - 1  # 0-based

    region_key = _normalize_region(region)
    secheresse = RISQUE_SECHERESSE.get(region_key, RISQUE_SECHERESSE[_DEFAULT_REGION])[mois_actuel]
    inondation = RISQUE_INONDATION.get(region_key, RISQUE_INONDATION[_DEFAULT_REGION])[mois_actuel]

    if secheresse >= 0.6:
        risques_climatiques.append(f"Risque de sécheresse élevé en {_mois_nom(mois_actuel)} dans la région {region}")
        recommandations.append("Prévoir une irrigation d'appoint ou réduire les surfaces cultivées")
        score += 25
    elif secheresse >= 0.3:
        risques_climatiques.append(f"Risque de sécheresse modéré en {_mois_nom(mois_actuel)}")
        recommandations.append("Surveiller l'humidité des sols et adapter les apports en eau")
        score += 10

    if inondation >= 0.5:
        risques_climatiques.append(f"Risque d'inondation en {_mois_nom(mois_actuel)} (saison des pluies)")
        recommandations.append("Éviter de planter dans les zones basses, protéger les stocks")
        score += 20
    elif inondation >= 0.3:
        risques_climatiques.append("Risque modéré de fortes pluies — surveiller les cours d'eau")
        score += 8

    # ── Risques marché ────────────────────────────────────────────────────────

    # Diversification : ne pas dépendre d'une seule culture
    nb_cultures = stats.get("nb_cultures_en_stock", 0)
    culture_principale = stats.get("culture_principale")

    if nb_cultures == 1:
        risques_marche.append(
            f"Concentration totale sur une seule culture "
            f"({culture_principale or 'non identifiée'}) — risque de perte totale"
        )
        recommandations.append("Diversifier avec au moins 2-3 cultures différentes")
        score += 20
    elif nb_cultures == 0:
        risques_marche.append("Aucun stock déclaré — pas de visibilité sur l'activité")
        score += 10

    # Stock immobilisé trop longtemps
    for stock in stocks:
        date_decl = _parse_date(stock.get("date"))
        if date_decl:
            jours = (date.today() - date_decl).days
            if jours > 90:
                risques_marche.append(
                    f"Stock de {stock['culture']} déclaré il y a {jours} jours — "
                    "risque de perte de qualité et de valeur"
                )
                recommandations.append(
                    f"Envisager de vendre le stock de {stock['culture']} rapidement"
                )
                score += 15
                break  # Un seul avertissement de ce type

    # CA en baisse (moins de ventes récentes = signal d'alerte)
    if stats.get("ca_90j_fcfa", 0) == 0 and len(ventes) == 0:
        risques_marche.append("Aucune vente enregistrée sur les 90 derniers jours")
        recommandations.append("Vérifier la visibilité de votre boutique sur la marketplace")
        score += 10

    # Stocks sans valorisation
    stocks_sans_valeur = [s for s in stocks if s.get("valeur_estimee", 0) == 0]
    if stocks_sans_valeur:
        risques_marche.append(
            f"{len(stocks_sans_valeur)} stock(s) sans valeur estimée — "
            "difficulté à évaluer votre patrimoine"
        )
        recommandations.append("Renseigner la valeur estimée de vos stocks dans la marketplace")
        score += 5

    # ── Score global ──────────────────────────────────────────────────────────
    score = min(score, 100)

    if score >= 50:
        niveau = "eleve"
    elif score >= 25:
        niveau = "modere"
    else:
        niveau = "faible"

    # Recommandations par défaut si aucun risque détecté
    if not recommandations:
        recommandations.append("Votre situation semble stable. Continuez à mettre à jour vos stocks.")
        recommandations.append("Consultez le Market Radar régulièrement pour optimiser vos ventes.")

    return {
        "niveau_risque_global": niveau,
        "score_risque": score,
        "risques_marche": risques_marche,
        "risques_climatiques": risques_climatiques,
        "recommandations": recommandations,
    }


# ── Données de plantation ─────────────────────────────────────────────────────

PERIODES_PLANTATION: Dict[str, Dict] = {
    "maïs": {
        "maritime":  {"debut": 4, "fin": 6, "conseil": "Deux cycles possibles : avril-juin et août-septembre."},
        "plateaux":  {"debut": 4, "fin": 6, "conseil": "Idéal avril-juin. Deuxième cycle août-octobre."},
        "centrale":  {"debut": 5, "fin": 7, "conseil": "Planter en mai-juin avec les premières pluies."},
        "kara":      {"debut": 5, "fin": 7, "conseil": "Planter dès que les pluies s'installent (mai-juin)."},
        "savanes":   {"debut": 6, "fin": 8, "conseil": "Saison des pluies plus tardive : juin-août."},
        "duree": 90,
    },
    "manioc": {
        "maritime":  {"debut": 3, "fin": 5, "conseil": "Planter en début de saison des pluies."},
        "plateaux":  {"debut": 4, "fin": 6, "conseil": "Tolère bien la sécheresse une fois établi."},
        "centrale":  {"debut": 4, "fin": 6, "conseil": "Idéal en début de saison."},
        "kara":      {"debut": 5, "fin": 7, "conseil": "Planter avec les premières pluies."},
        "savanes":   {"debut": 6, "fin": 8, "conseil": "Très résistant, peut être planté plus tard."},
        "duree": 300,
    },
    "igname": {
        "maritime":  {"debut": 2, "fin": 4, "conseil": "Planter tôt (fév-mars) pour une récolte en août-sept."},
        "plateaux":  {"debut": 2, "fin": 4, "conseil": "Idéal février-mars avec les premières pluies."},
        "centrale":  {"debut": 3, "fin": 5, "conseil": "Mars-avril selon les précipitations."},
        "kara":      {"debut": 3, "fin": 5, "conseil": "Planter en mars-avril."},
        "savanes":   {"debut": 4, "fin": 6, "conseil": "Avril-juin selon les précipitations."},
        "duree": 240,
    },
    "arachide": {
        "maritime":  {"debut": 4, "fin": 6, "conseil": "Deux cycles : avril-juin et août-octobre."},
        "plateaux":  {"debut": 4, "fin": 6, "conseil": "Idéal en début de saison des pluies."},
        "centrale":  {"debut": 5, "fin": 7, "conseil": "Planter avec les pluies de mai-juin."},
        "kara":      {"debut": 5, "fin": 7, "conseil": "Juin-juillet pour la principale saison."},
        "savanes":   {"debut": 6, "fin": 8, "conseil": "Planter dès les pluies régulières."},
        "duree": 120,
    },
    "sorgho": {
        "maritime":  {"debut": 7, "fin": 9, "conseil": "Culture de saison sèche, planter juillet-septembre."},
        "plateaux":  {"debut": 7, "fin": 9, "conseil": "Résistant à la sécheresse."},
        "centrale":  {"debut": 6, "fin": 8, "conseil": "Idéal en saison sèche."},
        "kara":      {"debut": 6, "fin": 8, "conseil": "Très bien adapté aux régions semi-arides."},
        "savanes":   {"debut": 6, "fin": 8, "conseil": "Culture adaptée à la Savane."},
        "duree": 120,
    },
}
_DEFAULT_CULTURE_PLANTATION = "maïs"


def get_plantation_period(culture: str, region: str) -> Dict:
    """Retourne la période de plantation optimale pour (culture, région)."""
    culture_norm = culture.strip().lower()
    region_norm = _normalize_region(region.strip().lower())

    config = PERIODES_PLANTATION.get(culture_norm, PERIODES_PLANTATION[_DEFAULT_CULTURE_PLANTATION])
    region_config = config.get(region_norm, config.get("maritime", {"debut": 4, "fin": 6, "conseil": "Planter en début de saison des pluies."}))

    mois_debut = region_config["debut"]
    mois_fin = region_config["fin"]
    mois_noms = [_mois_nom(m - 1) for m in range(mois_debut, mois_fin + 1)]
    periode = " – ".join([mois_noms[0], mois_noms[-1]])

    return {
        "culture": culture,
        "region": region,
        "periode_optimale": periode,
        "mois_debut": mois_debut,
        "mois_fin": mois_fin,
        "duree_cycle_jours": config.get("duree", 120),
        "conseils": region_config["conseil"],
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_region(region: str) -> str:
    mapping = {
        "lomé": "maritime", "lome": "maritime", "maritime": "maritime",
        "plateaux": "plateaux",
        "centrale": "centrale",
        "kara": "kara",
        "savanes": "savanes",
    }
    return mapping.get(region.lower(), "maritime")


def _mois_nom(idx: int) -> str:
    """Retourne le nom du mois (idx 0-based)."""
    mois = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]
    return mois[idx % 12]


def _parse_date(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        return date.fromisoformat(str(date_str)[:10])
    except Exception:
        return None
