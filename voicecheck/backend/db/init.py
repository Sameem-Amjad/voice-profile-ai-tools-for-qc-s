"""
Database initialisation. Called from main.py:lifespan on startup.

For MVP we use Base.metadata.create_all to materialise tables. Once we move
to Postgres in production, switch to Alembic migrations (alembic is already
in requirements.txt for that purpose).
"""

from utils.logger import get_logger
from db.session import Base
from db import session as _session
# Importing models registers them on Base.metadata
from db import models  # noqa: F401

logger = get_logger(__name__)


async def init_db() -> None:
    """Create all tables if they don't exist. Resolves engine lazily so test
    setup that swaps the engine still works."""
    engine = _session.engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("db_initialised")
