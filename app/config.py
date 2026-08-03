"""
config.py — Paramètres de l'application chargés depuis les variables d'environnement.
Utilise pydantic-settings pour la validation et le typage.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Base de données ────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── LLM ───────────────────────────────────────────────────────────────────
    GEMINI_API_KEY: str

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # ── Cache ─────────────────────────────────────────────────────────────────
    PREDICTION_CACHE_TTL: int = 1800  # secondes

    @property
    def allowed_origins_list(self) -> List[str]:
        """Convertit la chaîne CSV en liste pour FastAPI CORSMiddleware."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


# Instance unique partagée dans toute l'application
settings = Settings()
