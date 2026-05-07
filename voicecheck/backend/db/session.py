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
    # Auto-upgrade plain "postgresql://" to "postgresql+asyncpg://" so users can
    # paste a Supabase connection string verbatim.
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    kwargs: dict = {"future": True}
    if not url.startswith("sqlite"):
        kwargs["pool_pre_ping"] = True
        if url.startswith("postgresql+asyncpg"):
            connect_args: dict = {}
            if "ssl=" not in url:
                connect_args["ssl"] = "require"
            # Supabase Transaction Pooler (pgbouncer in transaction mode) does
            # not support prepared statements. Disable asyncpg's statement cache
            # unconditionally for all PostgreSQL connections — safe to do even
            # without pgbouncer (minor perf trade-off, avoids the port-check
            # brittle conditional that was silently not matching on Render).
            connect_args["statement_cache_size"] = 0
            connect_args["prepared_statement_cache_size"] = 0
            kwargs["connect_args"] = connect_args
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
