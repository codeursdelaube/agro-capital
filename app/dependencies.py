"""
dependencies.py — Dépendances FastAPI partagées entre les routers.
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Injection de session DB dans les endpoints FastAPI.
    La session est automatiquement fermée après la requête.

    Usage dans un endpoint :
        async def mon_endpoint(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        yield session
