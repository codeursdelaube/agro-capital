"""
agro_pilot/context_builder.py — Construit le contexte complet d'un agriculteur depuis la DB.

Toutes les requêtes sont en LECTURE SEULE (SELECT uniquement).
Le contexte est mis en cache 5 minutes (TTL court pour rester frais).

NOTE : Les noms de tables/colonnes correspondent au brief. À ajuster si le
schéma Prisma réel utilise des noms différents (ex. camelCase côté Prisma
peut devenir snake_case en Postgres — à vérifier sur le schéma.prisma).
"""
from __future__ import annotations

import logging
from typing import Dict, Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache import store as cache_store

logger = logging.getLogger(__name__)


async def build_farmer_context(user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Récupère et structure le contexte complet de l'agriculteur.

    Retourne un dict avec :
    - user : infos de base (nom, région, téléphone)
    - stocks : stocks actifs
    - ventes_recentes : commandes livrées (90 derniers jours)
    - annonces_recolte : préventes actives
    - resume_stats : stats calculées (chiffre d'affaires, kg vendus, culture principale)
    """
    # ── Cache court (5 min) ───────────────────────────────────────────────────
    cached = cache_store.get_context(user_id)
    if cached:
        return cached

    context: Dict[str, Any] = {
        "user": {},
        "stocks": [],
        "ventes_recentes": [],
        "annonces_recolte": [],
        "resume_stats": {},
    }

    # ── 1. Infos utilisateur ──────────────────────────────────────────────────
    try:
        res = await db.execute(
            text("""
                SELECT id, full_name, phone, role, location, created_at
                FROM users
                WHERE id = :user_id
                LIMIT 1
            """),
            {"user_id": user_id},
        )
        row = res.fetchone()
        if row:
            context["user"] = {
                "id": str(row.id),
                "nom": row.full_name or "Agriculteur",
                "telephone": row.phone,
                "role": row.role,
                "region": row.location or "Non renseignée",
            }
    except Exception as exc:
        logger.warning("Impossible de charger l'utilisateur %s: %s", user_id, exc)

    # Si l'utilisateur n'existe pas, retourner le contexte vide
    if not context["user"]:
        return context

    # ── 2. Stocks actifs ──────────────────────────────────────────────────────
    try:
        res = await db.execute(
            text("""
                SELECT id, culture, quantite_kg, valeur_estimee, statut, date_declaration
                FROM stocks
                WHERE user_id = :user_id
                  AND statut IN ('ACTIF', 'DISPONIBLE')
                ORDER BY date_declaration DESC
                LIMIT 20
            """),
            {"user_id": user_id},
        )
        context["stocks"] = [
            {
                "id": str(r.id),
                "culture": r.culture,
                "quantite_kg": float(r.quantite_kg or 0),
                "valeur_estimee": float(r.valeur_estimee or 0),
                "statut": r.statut,
                "date": str(r.date_declaration),
            }
            for r in res.fetchall()
        ]
    except Exception as exc:
        logger.warning("Impossible de charger les stocks de %s: %s", user_id, exc)

    # ── 3. Ventes récentes (90 jours) ─────────────────────────────────────────
    try:
        res = await db.execute(
            text("""
                SELECT
                    c.id,
                    p.culture,
                    c.quantite,
                    c.montant_total,
                    c.statut,
                    c.date
                FROM commandes c
                JOIN produits p ON c.produit_id = p.id
                WHERE c.vendeur_id = :user_id
                  AND c.date >= NOW() - INTERVAL '90 days'
                ORDER BY c.date DESC
                LIMIT 50
            """),
            {"user_id": user_id},
        )
        context["ventes_recentes"] = [
            {
                "id": str(r.id),
                "culture": r.culture,
                "quantite": float(r.quantite or 0),
                "montant_total": float(r.montant_total or 0),
                "statut": r.statut,
                "date": str(r.date),
            }
            for r in res.fetchall()
        ]
    except Exception as exc:
        logger.warning("Impossible de charger les ventes de %s: %s", user_id, exc)

    # ── 4. Annonces de récolte actives ────────────────────────────────────────
    try:
        res = await db.execute(
            text("""
                SELECT id, culture, quantite_estimee, date_recolte_prevue, statut
                FROM annonces_recolte
                WHERE agriculteur_id = :user_id
                  AND statut IN ('ACTIF', 'EN_COURS')
                ORDER BY date_recolte_prevue ASC
                LIMIT 10
            """),
            {"user_id": user_id},
        )
        context["annonces_recolte"] = [
            {
                "id": str(r.id),
                "culture": r.culture,
                "quantite_estimee": float(r.quantite_estimee or 0),
                "date_recolte_prevue": str(r.date_recolte_prevue),
                "statut": r.statut,
            }
            for r in res.fetchall()
        ]
    except Exception as exc:
        logger.warning("Impossible de charger les annonces de %s: %s", user_id, exc)

    # ── 5. Calcul des stats résumées ──────────────────────────────────────────
    context["resume_stats"] = _compute_stats(context)

    # ── Cache ─────────────────────────────────────────────────────────────────
    cache_store.set_context(user_id, context)
    return context


def _compute_stats(context: Dict) -> Dict:
    """Calcule les statistiques agrégées depuis le contexte."""
    ventes = context["ventes_recentes"]
    stocks = context["stocks"]

    # Chiffre d'affaires 90 jours
    ca_90j = sum(
        v["montant_total"] for v in ventes
        if str(v.get("statut", "")).upper() in ("LIVREE", "COMPLETEE", "LIVRE", "PAYEE", "VALIDE")
    )

    # Volume vendu
    kg_vendus = sum(
        v["quantite"] for v in ventes
        if str(v.get("statut", "")).upper() in ("LIVREE", "COMPLETEE", "LIVRE", "PAYEE", "VALIDE")
    )

    # Culture principale (la plus vendue)
    cultures_count: Dict[str, float] = {}
    for v in ventes:
        culture_name = v.get("culture")
        if culture_name:
            cultures_count[culture_name] = cultures_count.get(culture_name, 0) + v.get("quantite", 0)
    culture_principale = max(cultures_count, key=cultures_count.get) if cultures_count else None

    # Stock total
    stock_total_kg = sum(s.get("quantite_kg", 0) for s in stocks)

    return {
        "ca_90j_fcfa": round(ca_90j, 0),
        "kg_vendus_90j": round(kg_vendus, 1),
        "culture_principale": culture_principale,
        "stock_total_kg": round(stock_total_kg, 1),
        "nb_cultures_en_stock": len({s["culture"] for s in stocks if s.get("culture")}),
    }


def format_context_for_llm(context: Dict) -> str:
    """
    Sérialise le contexte agriculteur en texte lisible par le LLM.
    Optimisé pour être court (important pour les quotas Gemini Flash).
    """
    u = context.get("user", {})
    stats = context.get("resume_stats", {})
    stocks = context.get("stocks", [])
    annonces = context.get("annonces_recolte", [])

    lines = [
        f"AGRICULTEUR : {u.get('nom') or 'Inconnu'}",
        f"RÉGION : {u.get('region') or 'Non renseignée'}",
        f"TÉLÉPHONE : {u.get('telephone') or 'Non renseigné'}",
        "",
        "=== STOCKS ACTIFS ===",
    ]

    if stocks:
        for s in stocks[:5]:  # Max 5 stocks pour rester court
            lines.append(
                f"  - {s.get('culture', 'Culture')} : {s.get('quantite_kg', 0)} kg "
                f"(valeur estimée : {s.get('valeur_estimee', 0)} FCFA)"
            )
    else:
        lines.append("  Aucun stock déclaré.")

    lines += [
        "",
        "=== ACTIVITÉ COMMERCIALE (90 derniers jours) ===",
        f"  Chiffre d'affaires : {stats.get('ca_90j_fcfa', 0):,.0f} FCFA",
        f"  Volume vendu : {stats.get('kg_vendus_90j', 0)} kg",
        f"  Culture principale : {stats.get('culture_principale') or 'Non déterminée'}",
        "",
        "=== PRÉVENTES EN COURS ===",
    ]

    if annonces:
        for a in annonces[:3]:
            lines.append(
                f"  - {a.get('culture', 'Culture')} : {a.get('quantite_estimee', 0)} kg prévus le {a.get('date_recolte_prevue', 'date inconnue')}"
            )
    else:
        lines.append("  Aucune prévente active.")

    return "\n".join(lines)
