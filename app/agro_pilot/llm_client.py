"""
agro_pilot/llm_client.py — Wrapper autour de Google Gemini 1.5 Flash.

Utilise google-genai (nouveau SDK officiel Google, remplace google-generativeai).
Les appels LLM sont synchrones → exécutés via asyncio.to_thread() pour ne pas
bloquer la boucle d'événements FastAPI.

Quota gratuit : 15 requêtes/minute, 1 million tokens/jour.
En cas de dépassement, un fallback basé sur des règles est déclenché.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

# — Client singleton ————————————————————————————
_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    """Lazy-initialise le client Gemini (singleton)."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

# — System prompt de base ————————————————————————————
_SYSTEM_PROMPT = """Tu es Agro-Pilot, l'assistant intelligent d'Agro-Capital, une plateforme
pour les agriculteurs togolais.

RÔLE : Tu conseilles les agriculteurs togolais sur la base de leurs données réelles
(stocks, ventes, prix du marché). Tu réponds TOUJOURS en français.

RÈGLES ABSOLUES :
- Tu t'appuies UNIQUEMENT sur le contexte de l'agriculteur fourni ci-dessous
- Tu ne demandes JAMAIS des informations déjà présentes dans le contexte
- Tes réponses sont courtes, pratiques et adaptées au contexte togolais
- Tu utilises des unités locales (FCFA, kg)
- Si tu n'as pas assez d'informations, tu le dis honnêtement
- Tu n'inventes jamais de données

CONTEXTE DE L'AGRICULTEUR :
{contexte}
"""

# — System prompt : diagnostic phytosanitaire par image ————————————
_SYSTEM_PROMPT_DISEASE = """Tu es un expert agronome togolais spécialisé dans le diagnostic phytosanitaire par image.

RÔLE : Analyser la photo d'une plante envoyée par un agriculteur et identifier les maladies possibles.

RÈGLES ABSOLUES :
- Identifie d'abord la culture si possible (maïs, manioc, cacao, café, tomate, etc.)
- Énumère UNIQUEMENT les maladies dont les symptômes visibles sur la photo sont cohérents
- Pour chaque maladie suspectée, indique : nom, niveau de confiance, symptômes observés qui la justifient
- Si l'image est floue, mal cadrée ou ne montre pas de plante, dis-le clairement au lieu d'inventer un diagnostic
- Priorise les maladies courantes au Togo et en Afrique de l'Ouest
- Réponds TOUJOURS en français
- Termine par une recommandation pratique et accessible (traitement local, action immédiate)
- Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, selon ce schéma :

{
  "culture_identifiee": "string ou null",
  "etat_general": "sain | attention | maladie_probable",
  "maladies_possibles": [
    {
      "nom": "string",
      "confiance": "faible | moyenne | élevée",
      "symptomes_observes": ["string", ...],
      "recommandation": "string"
    }
  ],
  "conseil_general": "string"
}
"""

_GENERATION_CONFIG = types.GenerateContentConfig(
    temperature=0.4,
    top_p=0.90,
    max_output_tokens=1024,
)

_GENERATION_CONFIG_LONG = types.GenerateContentConfig(
    temperature=0.3,
    max_output_tokens=1500,
)


def _call_gemini_sync(prompt: str, system_context: str = "") -> str:
    """Appel synchrone à Gemini — à exécuter dans un thread."""
    try:
        client = _get_client()
        full_prompt = (
            _SYSTEM_PROMPT.format(contexte=system_context)
            + "\n\nQUESTION : "
            + prompt
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
            config=_GENERATION_CONFIG,
        )
        return response.text.strip()
    except Exception as exc:
        logger.error("Erreur Gemini: %s", exc)
        raise


async def ask_gemini(prompt: str, farmer_context: str = "") -> str:
    """
    Envoie un prompt à Gemini Flash de manière asynchrone.

    Args:
        prompt: La question ou tâche à traiter
        farmer_context: Contexte textuel de l'agriculteur (généré par context_builder)

    Returns:
        Réponse textuelle de Gemini, ou message de fallback en cas d'erreur
    """
    try:
        return await asyncio.to_thread(_call_gemini_sync, prompt, farmer_context)
    except Exception as exc:
        logger.error("Gemini indisponible, fallback activé: %s", exc)
        return _fallback_response(prompt)


def _fallback_response(prompt: str) -> str:
    """
    Réponse de secours si Gemini est indisponible (quota dépassé, erreur réseau).
    """
    prompt_lower = prompt.lower()

    if any(kw in prompt_lower for kw in ["vendre", "prix", "marché"]):
        return (
            "Je ne peux pas accéder au service d'analyse en ce moment. "
            "Consultez le module Market Radar pour les prix actuels et les prévisions."
        )
    elif any(kw in prompt_lower for kw in ["planter", "plantation", "cultiver", "culture"]):
        return (
            "Je ne peux pas générer une analyse personnalisée actuellement. "
            "En règle générale, au Togo, la saison des pluies (avril-juin et septembre-octobre) "
            "est idéale pour la plupart des cultures vivrières."
        )
    elif any(kw in prompt_lower for kw in ["prêt", "financement", "subvention", "crédit"]):
        return (
            "Pour un dossier de financement, contactez le FNFI (Fonds National de la Finance Inclusive) "
            "ou votre coopérative locale. "
            "Utilisez l'endpoint /agro-pilot/dossier-financement pour générer votre dossier."
        )

    return (
        "Le service d'intelligence artificielle est temporairement indisponible. "
        "Veuillez réessayer dans quelques minutes."
    )


async def generate_text(task_description: str, context: str, max_tokens: int = 1500) -> str:
    """
    Génère un texte long (ex. dossier de financement) via Gemini.
    """
    def _call() -> str:
        try:
            client = _get_client()
            full_prompt = (
                f"Contexte agriculteur :\n{context}\n\n"
                f"Tâche : {task_description}"
            )
            config = types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=max_tokens,
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=full_prompt,
                config=config,
            )
            return response.text.strip()
        except Exception as exc:
            logger.error("Erreur generate_text: %s", exc)
            raise

    try:
        return await asyncio.to_thread(_call)
    except Exception:
        return "Génération du texte indisponible. Veuillez réessayer."


# — Diagnostic phytosanitaire par image ————————————————————————
async def diagnose_plant_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Envoie une photo de plante à Gemini Vision pour diagnostic de maladies.

    Note : utilise gemini-2.5-flash (multimodal) plutôt que gemini-1.5-flash,
    ce dernier étant retiré par Google (404 sur generateContent).

    Args:
        image_bytes: contenu brut de l'image (jpg/png)
        mime_type: type MIME de l'image (ex: "image/jpeg")

    Returns:
        dict structuré avec les maladies possibles détectées
    """
    def _call() -> dict:
        client = _get_client()
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image_part, _SYSTEM_PROMPT_DISEASE],
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=800,
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text.strip())

    try:
        return await asyncio.to_thread(_call)
    except Exception as exc:
        logger.error("Erreur diagnose_plant_image: %s", exc)
        return {
            "culture_identifiee": None,
            "etat_general": "inconnu",
            "maladies_possibles": [],
            "conseil_general": "Diagnostic indisponible pour le moment. Réessayez avec une photo nette, prise en pleine lumière.",
        }