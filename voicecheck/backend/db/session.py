"""
SQLAlchemy 2.0 async engine + session factory.

The DB URL is read from settings.DATABASE_URL. Defaults to a local SQLite
file (sqlite+aiosqlite:///./voicecheck.db) for development. Production should
set DATABASE_URL=postgresql+asyncpg://... (Supabase, RDS, etc.).
"""

import uuid
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
            # Supabase uses pgbouncer in transaction mode, which does not
            # support prepared statements. Disable the LRU cache and generate
            # UUID-based statement names so concurrent connections never
            # collide on the per-connection hex counter (__asyncpg_stmt_1e__).
            connect_args["statement_cache_size"] = 0
            connect_args["prepared_statement_name_func"] = (
                lambda: f"__asyncpg_{uuid.uuid4().hex}__"
            )
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
