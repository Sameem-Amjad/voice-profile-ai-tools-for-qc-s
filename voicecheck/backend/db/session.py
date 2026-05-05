"""
SQLAlchemy 2.0 async engine + session factory.

The DB URL is read from settings.DATABASE_URL. Defaults to a local SQLite
file (sqlite+aiosqlite:///./voicecheck.db) for development. Production should
set DATABASE_URL=postgresql+asyncpg://... (Supabase, RDS, etc.).
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from config import settings


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def _make_engine():
    """Build the async engine with sensible defaults per backend."""
    url = settings.DATABASE_URL
    # SQLite has no real connection pooling; use defaults. Postgres benefits
    # from pool_pre_ping to recover from stale conns.
    kwargs: dict = {"future": True}
    if not url.startswith("sqlite"):
        kwargs["pool_pre_ping"] = True
        # Managed Postgres (Supabase, RDS) requires SSL. asyncpg doesn't
        # accept the libpq-style ?sslmode= URL param, so pass it via
        # connect_args. Skip when the URL already specifies ssl=.
        if url.startswith("postgresql+asyncpg") and "ssl=" not in url:
            kwargs["connect_args"] = {"ssl": "require"}
    return create_async_engine(url, **kwargs)


engine = _make_engine()

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields an AsyncSession and closes it after use."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
