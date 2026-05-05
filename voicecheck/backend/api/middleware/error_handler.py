"""
Error handler registration.

`main.py` registers its own global `Exception` handler inline. This module is an
optional helper that bundles two handlers together:

    1. Generic `Exception`         → 500 JSON, never leaks stack traces
    2. `RequestValidationError`    → 422 JSON, surfaces pydantic field errors

It is provided for future entrypoints / alternate apps that want a one-liner.
`main.py` does not need to be changed to use this — both behaviours are
equivalent.

Usage:
    from api.middleware.error_handler import register_error_handlers
    register_error_handlers(app)
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from utils.logger import get_logger

logger = get_logger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    """
    Register global exception handlers on the given FastAPI app.

    Both handlers log via the structured logger so failures are easy to
    correlate with request paths in aggregated logs.
    """

    @app.exception_handler(Exception)
    async def _generic_exception_handler(request: Request, exc: Exception):
        """Catch-all — turns unhandled exceptions into a sanitized 500."""
        logger.error(
            "unhandled_exception",
            path=request.url.path,
            method=request.method,
            error=str(exc),
            error_type=type(exc).__name__,
        )
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(exc)},
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        """Pydantic / FastAPI request validation failures → 422 with details."""
        logger.warning(
            "request_validation_error",
            path=request.url.path,
            method=request.method,
            errors=exc.errors(),
        )
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation error",
                "detail": exc.errors(),
            },
        )
