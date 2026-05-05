"""
CORS middleware helper.

`main.py` already wires up `CORSMiddleware` directly via `app.add_middleware(...)`,
but this helper exists so future entrypoints (tests, alternate ASGI apps, scripts
that mount the app under a different prefix) can apply the same CORS policy in
one line — without re-deriving the configuration from `settings`.

Usage:
    from api.middleware.cors import add_cors_middleware
    add_cors_middleware(app)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings


def add_cors_middleware(app: FastAPI) -> None:
    """
    Attach the standard CORS middleware to the given FastAPI app.

    Pulls allowed origins from `settings.CORS_ORIGINS`. Credentials are allowed
    so the frontend can send cookies / auth headers if needed later.
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
