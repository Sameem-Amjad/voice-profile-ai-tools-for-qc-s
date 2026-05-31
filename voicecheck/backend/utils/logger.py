import sys
import logging
import logging.handlers
from pathlib import Path

import structlog

from config import settings

_LOGS_DIR = Path(__file__).parent.parent / "logs"


class _Tee:
    """Write to both original stdout and a rotating log file."""

    def __init__(self, original, file_path: Path):
        self._original = original
        file_path.parent.mkdir(parents=True, exist_ok=True)
        self._file = logging.handlers.RotatingFileHandler(
            file_path, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
        )
        self._file.stream  # trigger open

    def write(self, data: str) -> int:
        self._original.write(data)
        # Strip ANSI colour codes before writing to file
        import re
        clean = re.sub(r"\x1b\[[0-9;]*m", "", data)
        self._file.stream.write(clean)
        return len(data)

    def flush(self):
        self._original.flush()
        self._file.stream.flush()

    def isatty(self) -> bool:
        return False

    # Required for uvicorn / click compatibility
    def fileno(self):
        return self._original.fileno()


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="ISO"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.LOG_FORMAT == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer(colors=True))

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(level=log_level)

    # Tee stdout → logs/app.log so ALL structlog output is captured
    sys.stdout = _Tee(sys.__stdout__, _LOGS_DIR / "app.log")


def get_logger(name: str):
    return structlog.get_logger(name)
