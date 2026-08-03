"""
agro_pilot/financement.py — Génération de dossiers de financement via LLM.

Utilise Gemini pour générer un texte de dossier personnalisé.
Les documents requis et conseils de base sont codifiés en règles
(fallback si Gemini indisponible).
"""
from __future__ import annotations

from typing import Dict, List, Any

from app.agro_pilot import llm_client
from app.agro_pilot.context_builder import format_context_for_llm

# ── Documents requis par type de demande ─────────────────────────────────────

DOCUMENTS_REQUIS: Dict[str, List[str]] = {
    "pret_agricole": [
        "Pièce d'identité nationale (carte d'identité ou passeport)",
        "Justificatif de domicile (facture eau ou électricité de moins de 3 mois)",
        "Attestation de terre ou titre foncier",
        "Relevé de compte bancaire ou Mobile Money (3 derniers mois si disponible)",
        "Plan de culture ou plan d'affaires simplifié",
        "Photos de l'exploitation agricole",
        "Attestation de membre d'une coopérative (si applicable)",
        "Devis des équipements ou intrants à financer",
    ],
    "subvention": [
        "Pièce d'identité nationale",
        "Justificatif de domicile",
        "Attestation de producteur agricole (délivrée par la mairie ou la DRAEP locale)",
        "Preuve d'activité agricole (photos, factures de vente, livret de production)",
        "Plan de culture pour la saison concernée",
        "Formulaire de demande officiel (à retirer à la DRAEP de votre région)",
        "Attestation de groupement/coopérative (si demande collective)",
    ],
    "microfinance": [
        "Pièce d'identité nationale",
        "Justificatif de domicile",
        "Numéro de compte Mobile Money actif",
        "Description de l'activité agricole (1 page suffisante)",
        "Estimation des revenus mensuels",
        "Garant local (selon l'institution de microfinance)",
    ],
}

CONSEILS_BASE: Dict[str, str] = {
    "pret_agricole": (
        "Pour maximiser vos chances : rédigez un plan d'affaires simple mais précis (quoi cultiver, "
        "combien, pour quel marché). Montrez votre historique de ventes si possible. "
        "Présentez-vous à la banque agricole (BTD - Banque Togolaise de Développement) "
        "ou à votre coopérative locale."
    ),
    "subvention": (
        "Les subventions agricoles au Togo sont gérées par le MAEH (Ministère de l'Agriculture). "
        "Renseignez-vous à la Direction Régionale de l'Agriculture et de l'Élevage (DRAEP) "
        "de votre région. Constituez votre dossier en début d'année budgétaire (jan-mars)."
    ),
    "microfinance": (
        "Les institutions de microfinance comme FUCEC-Togo, TIMPAC ou WAGES peuvent vous aider. "
        "Commencez par un petit montant pour construire votre historique de crédit. "
        "Le Mobile Money (Flooz, T-Money) est souvent accepté comme garantie partielle."
    ),
}

PROMPT_DOSSIER = """Tu dois rédiger un texte d'aide pour aider un agriculteur togolais à constituer
son dossier de {type_demande_label}.

Le texte doit :
1. Introduire le type de financement en 2-3 phrases simples
2. Expliquer comment présenter l'exploitation de cet agriculteur spécifique de manière convaincante
3. Donner 3-4 conseils pratiques et locaux (mentionner des institutions togolaises réelles)
4. Conclure avec les prochaines étapes concrètes

IMPORTANT : Base-toi sur les données réelles de l'agriculteur (région, cultures, stocks, CA).
Rédige en français simple, adapté à un agriculteur ayant peu de temps.
Longueur cible : 300-400 mots maximum."""

TYPE_LABELS = {
    "pret_agricole": "prêt agricole",
    "subvention": "subvention agricole",
    "microfinance": "microcrédit agricole",
}


async def generer_dossier(
    user_id: str,
    type_demande: str,
    context: Dict[str, Any],
) -> Dict:
    """
    Génère un dossier de financement personnalisé.

    Args:
        user_id: UUID de l'agriculteur
        type_demande: 'pret_agricole' | 'subvention' | 'microfinance'
        context: Contexte agriculteur (du context_builder)

    Returns:
        Dict avec texte_dossier, documents_requis, conseils_redaction
    """
    type_demande_norm = type_demande.lower().strip()
    if type_demande_norm not in DOCUMENTS_REQUIS:
        type_demande_norm = "pret_agricole"  # Fallback par défaut

    label = TYPE_LABELS.get(type_demande_norm, type_demande_norm)
    contexte_texte = format_context_for_llm(context)

    # Génération LLM
    prompt = PROMPT_DOSSIER.format(type_demande_label=label)
    texte_dossier = await llm_client.generate_text(
        task_description=prompt,
        context=contexte_texte,
        max_tokens=800,
    )

    return {
        "type_demande": type_demande_norm,
        "texte_dossier": texte_dossier,
        "documents_requis": DOCUMENTS_REQUIS[type_demande_norm],
        "conseils_redaction": CONSEILS_BASE[type_demande_norm],
    }
