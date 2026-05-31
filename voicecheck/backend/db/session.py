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
from sqlalchemy.pool import NullPool

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
        if url.startswith("postgresql+asyncpg"):
            connect_args: dict = {}
            if "ssl=" not in url:
                connect_args["ssl"] = "require"
            # Supabase/pgbouncer in transaction mode cannot handle named server-
            # side prepared statements — PARSE and EXECUTE may land on different
            # backends.  Two fixes are required together:
            #
            # 1. prepared_statement_name_func=lambda:"" → asyncpg uses the
            #    PostgreSQL unnamed ("") prepared-statement slot, which is
            #    allocated and freed within the same extended-query sequence.
            #    pgbouncer never sees a PREPARE by name.
            #
            # 2. statement_cache_size=0 → disables asyncpg's client-side LRU
            #    so it doesn't try to reuse named statements across connections.
            #
            # 3. NullPool → no SQLAlchemy-side connection pool on top of
            #    pgbouncer's own pool; every request borrows one pgbouncer
            #    connection and returns it immediately after use.
            connect_args["statement_cache_size"] = 0
            connect_args["prepared_statement_name_func"] = lambda: ""
            kwargs["connect_args"] = connect_args
            kwargs["poolclass"] = NullPool
        else:
            kwargs["pool_pre_ping"] = True
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
