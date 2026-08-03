"""
cache/store.py — Cache TTL in-memory partagé pour les prédictions de prix.

Évite de recalculer Prophet à chaque requête pour la même (culture, région).
Thread-safe via threading.Lock.
"""
import threading
from cachetools import TTLCache

from app.config import settings

_lock = threading.Lock()

# Cache principal pour les prédictions Market Radar
# Clé : (culture_normalisée, region_normalisée)
# Valeur : dict sérialisable JSON
_prediction_cache: TTLCache = TTLCache(
    maxsize=500,
    ttl=settings.PREDICTION_CACHE_TTL,
)

# Cache pour le score de vente
_score_cache: TTLCache = TTLCache(
    maxsize=500,
    ttl=settings.PREDICTION_CACHE_TTL,
)

# Cache pour le contexte agriculteur (TTL plus court : 5 min)
_context_cache: TTLCache = TTLCache(
    maxsize=200,
    ttl=300,
)


def _normalize(s: str) -> str:
    """Normalise une chaîne pour la clé de cache (minuscules, sans accents basiques)."""
    return s.strip().lower().replace(" ", "_")


def get_prediction(culture: str, region: str) -> dict | None:
    with _lock:
        return _prediction_cache.get((_normalize(culture), _normalize(region)))


def set_prediction(culture: str, region: str, value: dict) -> None:
    with _lock:
        _prediction_cache[(_normalize(culture), _normalize(region))] = value


def get_score(culture: str, region: str) -> dict | None:
    with _lock:
        return _score_cache.get((_normalize(culture), _normalize(region)))


def set_score(culture: str, region: str, value: dict) -> None:
    with _lock:
        _score_cache[(_normalize(culture), _normalize(region))] = value


def get_context(user_id: str) -> dict | None:
    with _lock:
        return _context_cache.get(user_id)


def set_context(user_id: str, value: dict) -> None:
    with _lock:
        _context_cache[user_id] = value
