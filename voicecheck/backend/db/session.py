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
            # Supabase exposes PostgreSQL via pgbouncer in transaction mode.
            # pgbouncer transaction mode cannot reliably route PREPARE and
            # EXECUTE to the same backend — both DuplicatePreparedStatement
            # and InvalidSQLStatementName errors result.
            #
            # Fix: NullPool tells SQLAlchemy not to maintain its own connection
            # pool on top of pgbouncer (pgbouncer IS the pool). Each request
            # gets a dedicated pgbouncer connection, so pgbouncer pins it to
            # one backend for the lifetime of that connection and all protocol
            # messages (PARSE/BIND/EXECUTE/CLOSE) stay on the same backend.
            # statement_cache_size=0 disables asyncpg's client-side LRU so no
            # named statement is reused across connections.
            connect_args["statement_cache_size"] = 0
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
