"""
agro_pilot/service.py — Orchestrateur de tous les endpoints Agro-Pilot.

Chaque fonction :
1. Charge le contexte de l'agriculteur depuis la DB (via context_builder)
2. Exécute la logique analytique (règles + LLM)
3. Retourne la réponse structurée

Lecture seule : aucun INSERT/UPDATE/DELETE.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.agro_pilot import context_builder, llm_client, risk_analyzer, financement
from app.agro_pilot.context_builder import format_context_for_llm
from app.agro_pilot.risk_analyzer import get_plantation_period
from app.market_radar import service as market_service
from app.schemas.agro_pilot import (
    ChatResponse,
    RecommandationCultureResponse,
    CultureRecommandee,
    MeilleurMomentVenteResponse,
    PeriodePlantationResponse,
    AnalyseRisqueResponse,
    DossierFinancementResponse,
)

logger = logging.getLogger(__name__)

# ── Cultures et leurs scores de rentabilité par défaut (sur 10) ───────────────
# Basé sur les prix togolais et la demande marché
RENTABILITE_CULTURES = {
    "igname":    9.0,
    "haricot":   8.5,
    "arachide":  8.0,
    "piment":    7.5,
    "tomate":    7.0,
    "gombo":     7.0,
    "maïs":      6.5,
    "manioc":    6.0,
    "sorgho":    5.5,
    "mil":       5.0,
    "coton":     5.0,
}

SAISON_OPTIMALE = {
    "igname": "Janvier – Avril",
    "haricot": "Octobre – Décembre",
    "arachide": "Avril – Juin",
    "piment": "Mars – Juin",
    "tomate": "Novembre – Février",
    "gombo": "Mars – Août",
    "maïs": "Avril – Juillet",
    "manioc": "Toute l'année",
    "sorgho": "Juin – Septembre",
    "mil": "Juin – Septembre",
    "coton": "Mai – Août",
}


async def chat(user_id: str, message: str, db: AsyncSession) -> ChatResponse:
    """
    Réponse conversationnelle d'Agro-Pilot.
    Charge automatiquement le contexte de l'agriculteur avant de répondre.
    """
    ctx = await context_builder.build_farmer_context(user_id, db)
    contexte_texte = format_context_for_llm(ctx)
    reponse = await llm_client.ask_gemini(message, farmer_context=contexte_texte)
    return ChatResponse(reponse=reponse, contexte_utilise=bool(ctx.get("user")))


async def recommandation_culture(
    user_id: str,
    db: AsyncSession,
) -> RecommandationCultureResponse:
    """
    Recommande les meilleures cultures à planter pour l'année.

    Stratégie :
    1. Vérifie si une recommandation récente existe en DB (< 7 jours)
    2. Si oui, la retourne (source = "cache_db")
    3. Sinon, calcule à la demande (source = "calcul_frais")
       Le calcul n'est PAS persisté — c'est Next.js qui peut le faire si souhaité.
    """
    # ── 1. Vérification en DB ─────────────────────────────────────────────────
    try:
        res = await db.execute(
            text("""
                SELECT culture_recommandee, raison, saison, date_generation
                FROM recommandations_culture
                WHERE agriculteur_id = :user_id
                  AND date_generation >= NOW() - INTERVAL '7 days'
                ORDER BY date_generation DESC
                LIMIT 5
            """),
            {"user_id": user_id},
        )
        rows = res.fetchall()

        if rows:
            cultures = [
                CultureRecommandee(
                    culture=r.culture_recommandee,
                    score_rentabilite=RENTABILITE_CULTURES.get(r.culture_recommandee.lower(), 6.0),
                    raison=r.raison or "Recommandation basée sur les données de marché",
                    saison_optimale=r.saison or SAISON_OPTIMALE.get(r.culture_recommandee.lower(), "Voir Market Radar"),
                )
                for r in rows
            ]
            return RecommandationCultureResponse(
                user_id=user_id,
                cultures=cultures,
                source="cache_db",
                date_calcul=str(rows[0].date_generation)[:10],
            )
    except Exception as exc:
        logger.warning("Impossible de lire recommandations_culture: %s", exc)

    # ── 2. Calcul à la demande ────────────────────────────────────────────────
    ctx = await context_builder.build_farmer_context(user_id, db)
    region = ctx.get("user", {}).get("region", "Maritime")

    # Cultures déjà cultivées (pour suggestions de diversification)
    cultures_actuelles = {
        s["culture"].lower() for s in ctx.get("stocks", [])
    }
    culture_principale = ctx.get("resume_stats", {}).get("culture_principale", "")

    # Sélection des 3 meilleures cultures avec score ajusté
    recommandations: List[CultureRecommandee] = []
    for culture, score_base in sorted(RENTABILITE_CULTURES.items(), key=lambda x: x[1], reverse=True):
        # Bonus de diversification
        score = score_base
        if culture.lower() not in cultures_actuelles:
            score += 0.5  # Bonus diversification
        if culture.lower() == (culture_principale or "").lower():
            score -= 0.3  # Légère pénalité si déjà la principale

        raison = _build_raison(culture, region, score_base)

        recommandations.append(
            CultureRecommandee(
                culture=culture,
                score_rentabilite=round(min(10, score), 1),
                raison=raison,
                saison_optimale=SAISON_OPTIMALE.get(culture, "Avril – Juin"),
            )
        )
        if len(recommandations) >= 4:
            break

    return RecommandationCultureResponse(
        user_id=user_id,
        cultures=recommandations,
        source="calcul_frais",
        date_calcul=str(date.today()),
    )


async def meilleur_moment_vente(
    user_id: str,
    stock_id: str,
    db: AsyncSession,
) -> MeilleurMomentVenteResponse:
    """
    Détermine le moment optimal pour vendre un stock donné.
    Combine la prédiction de prix J+15 avec les données du stock.
    """
    ctx = await context_builder.build_farmer_context(user_id, db)
    region = ctx.get("user", {}).get("region", "Maritime")

    # Trouver le stock par ID
    stock = next((s for s in ctx.get("stocks", []) if s["id"] == stock_id), None)
    if not stock:
        # Fallback : chercher directement en DB
        try:
            res = await db.execute(
                text("SELECT id, culture, quantite_kg, valeur_estimee FROM stocks WHERE id = :sid LIMIT 1"),
                {"sid": stock_id},
            )
            row = res.fetchone()
            if row:
                stock = {
                    "id": str(row.id),
                    "culture": row.culture,
                    "quantite_kg": float(row.quantite_kg or 0),
                    "valeur_estimee": float(row.valeur_estimee or 0),
                }
        except Exception:
            pass

    if not stock:
        # Stock introuvable : réponse générique
        return MeilleurMomentVenteResponse(
            culture="Inconnu",
            stock_kg=0,
            valeur_estimee_fcfa=0,
            date_optimale=str(date.today()),
            delai_jours=0,
            prix_estime_fcfa=0,
            variation_esperee_pct=0,
            justification="Stock introuvable. Vérifiez l'identifiant du stock.",
        )

    culture = stock["culture"]

    # Prédiction de prix
    pred = await market_service.get_prediction(culture, region, db)

    # Calcul du moment optimal
    if pred.tendance == "hausse" and pred.confiance >= 0.65:
        delai = 12  # Attendre ~2 semaines
        prix_estime = pred.prix_prevu_j15
        justification = (
            f"Le prix du {culture} devrait augmenter de {pred.prix_actuel:.0f} à "
            f"{pred.prix_prevu_j15:.0f} FCFA/kg dans 15 jours. "
            f"Attendre pour maximiser les revenus (confiance : {pred.confiance:.0%})."
        )
    elif pred.tendance == "baisse" and pred.confiance >= 0.65:
        delai = 2  # Vendre rapidement
        prix_estime = pred.prix_actuel
        justification = (
            f"Le prix du {culture} risque de baisser ({pred.tendance}). "
            f"Vendre dans les 2-3 prochains jours pour préserver la valeur de votre stock."
        )
    else:
        delai = 5  # Neutre
        prix_estime = (pred.prix_actuel + pred.prix_prevu_j15) / 2
        justification = (
            f"Le marché du {culture} est relativement stable. "
            "Vendez selon vos besoins de trésorerie — pas d'urgence particulière."
        )

    date_optimale = date.today() + timedelta(days=delai)
    valeur_estimee_future = prix_estime * stock["quantite_kg"]
    variation_pct = ((prix_estime - pred.prix_actuel) / pred.prix_actuel * 100) if pred.prix_actuel else 0

    return MeilleurMomentVenteResponse(
        culture=culture,
        stock_kg=stock["quantite_kg"],
        valeur_estimee_fcfa=round(valeur_estimee_future, 0),
        date_optimale=str(date_optimale),
        delai_jours=delai,
        prix_estime_fcfa=round(prix_estime, 0),
        variation_esperee_pct=round(variation_pct, 1),
        justification=justification,
    )


async def periode_plantation(
    culture: str,
    region: str,
) -> PeriodePlantationResponse:
    """
    Retourne la période de plantation optimale.
    Logique purement déterministe (tableau saisonnier) — pas de DB ni LLM nécessaire.
    """
    data = get_plantation_period(culture, region)
    return PeriodePlantationResponse(**data)


async def analyse_risque(
    user_id: str,
    db: AsyncSession,
) -> AnalyseRisqueResponse:
    """Analyse les risques marché et climatiques pour un agriculteur."""
    ctx = await context_builder.build_farmer_context(user_id, db)
    result = risk_analyzer.analyze_risk(ctx)
    return AnalyseRisqueResponse(user_id=user_id, **result)


async def dossier_financement(
    user_id: str,
    type_demande: str,
    db: AsyncSession,
) -> DossierFinancementResponse:
    """Génère un dossier de financement personnalisé."""
    ctx = await context_builder.build_farmer_context(user_id, db)
    data = await financement.generer_dossier(user_id, type_demande, ctx)
    return DossierFinancementResponse(**data)


# ── Helper privé ──────────────────────────────────────────────────────────────

def _build_raison(culture: str, region: str, score: float) -> str:
    """Génère une explication courte pour la recommandation de culture."""
    raisons = {
        "igname": f"Culture à forte valeur ajoutée ({score:.1f}/10). Demande croissante dans la région {region}.",
        "haricot": f"Excellente rentabilité ({score:.1f}/10). Cycle court (90 jours) permettant plusieurs récoltes/an.",
        "arachide": f"Marché stable et bien rémunéré ({score:.1f}/10). Améliore aussi la fertilité du sol.",
        "piment": f"Prix élevé sur les marchés ({score:.1f}/10). Forte demande locale et régionale.",
        "tomate": f"Rentabilité élevée en saison sèche ({score:.1f}/10). Demande toute l'année.",
        "gombo": f"Culture résistante et bien valorisée ({score:.1f}/10). Bonne demande sur les marchés locaux.",
        "maïs": f"Culture de base avec marché assuré ({score:.1f}/10). Facile à stocker et à vendre.",
        "manioc": f"Très résistant à la sécheresse ({score:.1f}/10). Demande alimentaire constante.",
        "sorgho": f"Adapté aux régions semi-arides ({score:.1f}/10). Marché stable pour l'alimentation et le bétail.",
        "mil": f"Culture résiliente ({score:.1f}/10). Peu de concurrence sur les marchés locaux.",
        "coton": f"Prix fixé par filière ({score:.1f}/10). Sécurité de revenu si vous avez un accord coopérative.",
    }
    return raisons.get(culture.lower(), f"Bonne culture pour la région {region} ({score:.1f}/10).")
