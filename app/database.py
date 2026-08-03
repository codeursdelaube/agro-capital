"""
database.py — Engine SQLAlchemy async + factory de sessions.

Connexion directe TCP à Supabase PostgreSQL via asyncpg.
Lecture seule : aucun INSERT/UPDATE/DELETE ne sera exécuté depuis ce service.
"""
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

# ── Moteur async ───────────────────────────────────────────────────────────────
# pool_size=5 : suffisant pour un service analytique à faible concurrence
# pool_pre_ping=True : détecte les connexions mortes avant utilisation
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,          # Mettre True pour debugger les requêtes SQL
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,   # Renouvelle les connexions toutes les heures
)

# ── Factory de sessions ────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)
