"""
Shared test fixtures.

We override the DB URL to a temp file-based SQLite (deleted at teardown) so
all connections see the same schema, then create tables once per session.
"""

from __future__ import annotations

import asyncio
import os
import tempfile

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Use a tmp file for SQLite — guarantees a single shared DB across all
# AsyncSession connections within the test process.
_DB_FD, _DB_PATH = tempfile.mkstemp(prefix="voicecheck_test_", suffix=".db")
os.close(_DB_FD)
_TEST_DB_URL = f"sqlite+aiosqlite:///{_DB_PATH}"
os.environ["DATABASE_URL"] = _TEST_DB_URL

from config import settings  # noqa: E402
settings.DATABASE_URL = _TEST_DB_URL

from db import session as db_session  # noqa: E402
from db.session import Base  # noqa: E402
from db import models  # noqa: F401,E402


@pytest.fixture(scope="session", autouse=True)
def _setup_test_db():
    """Build a fresh engine pointing at our temp file and create all tables."""
    engine = create_async_engine(settings.DATABASE_URL, future=True)
    db_session.engine = engine
    db_session.AsyncSessionLocal = async_sessionmaker(
        bind=engine, expire_on_commit=False, autoflush=False
    )

    async def _create_all():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.get_event_loop().run_until_complete(_create_all())
    yield
    asyncio.get_event_loop().run_until_complete(engine.dispose())
    try:
        os.unlink(_DB_PATH)
    except OSError:
        pass
