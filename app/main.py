"""
main.py — Point d'entrée de l'application FastAPI Agro-Capital.

Lance le serveur avec : uvicorn app.main:app --reload
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.market_radar.router import router as market_radar_router
from app.agro_pilot.router import router as agro_pilot_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Application FastAPI ───────────────────────────────────────────────────────
app = FastAPI(
    title="Agro-Capital — Backend IA",
    description=(
        "Service FastAPI dédié à l'intelligence analytique d'Agro-Capital.\n\n"
        "**Modules :**\n"
        "- **Market Radar** : Prédiction de prix agricoles à J+15 (Prophet + sklearn)\n"
        "- **Agro-Pilot** : Assistant IA personnalisé pour l'agriculteur togolais (Gemini 1.5 Flash)\n\n"
        "Ce service est en **lecture seule** sur la base de données Supabase. "
        "Toute logique CRUD (comptes, commandes, paiements) est gérée par le service Next.js."
    ),
    version="1.0.0",
    contact={
        "name": "Agro-Capital — Djanta 2026",
    },
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(market_radar_router)
app.include_router(agro_pilot_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Système"], summary="Vérification de l'état du service")
async def health_check():
    """Endpoint de santé — retourne le statut du service."""
    return {
        "status": "ok",
        "service": "agro-capital-fastapi",
        "version": "1.0.0",
        "modules": ["market-radar", "agro-pilot"],
    }


@app.get("/", tags=["Système"], include_in_schema=False)
async def root():
    return {"message": "Agro-Capital FastAPI — Consultez /docs pour la documentation."}


logger.info("Agro-Capital FastAPI démarré. CORS autorisé pour : %s", settings.allowed_origins_list)
