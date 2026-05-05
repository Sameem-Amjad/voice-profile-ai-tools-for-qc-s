"""
Auth-gating tests.

- AUTH_REQUIRED=False (default): /api/upload allows anonymous calls.
- AUTH_REQUIRED=True: /api/upload returns 401 without an Authorization header.
- With a mocked Clerk verifier, posting with a Bearer token creates a User row.
"""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from auth import clerk as clerk_module
from auth import dependencies as deps_module
from config import settings
from db import models
from db.session import AsyncSessionLocal
from main import app


def _fake_wav_bytes() -> bytes:
    # Minimal RIFF/WAVE header with 0 samples — enough to fail audio
    # validation (we only care about the auth gate path here).
    return b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00" \
           b"\x44\xAC\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"


def test_upload_anonymous_allowed_when_auth_not_required():
    """With AUTH_REQUIRED=False, no Authorization header is fine."""
    settings.AUTH_REQUIRED = False
    with TestClient(app) as client:
        files = {"file": ("clip.wav", io.BytesIO(_fake_wav_bytes()), "audio/wav")}
        resp = client.post("/api/upload", files=files)
    # Could be 200 (lucky valid header) or 422 (audio invalid) — but NEVER 401.
    assert resp.status_code != 401, resp.text


def test_upload_requires_auth_when_enabled():
    """With AUTH_REQUIRED=True, missing header yields 401."""
    settings.AUTH_REQUIRED = True
    try:
        with TestClient(app) as client:
            files = {"file": ("clip.wav", io.BytesIO(_fake_wav_bytes()), "audio/wav")}
            resp = client.post("/api/upload", files=files)
        assert resp.status_code == 401
    finally:
        settings.AUTH_REQUIRED = False  # restore for other tests


def test_upload_creates_user_with_mocked_jwt(monkeypatch):
    """A mocked verify_clerk_jwt produces fake claims; a User row is created."""
    settings.AUTH_REQUIRED = True
    fake_claims = {"sub": "clerk_user_test_123", "email": "tester@example.com"}

    def _fake_verify(token: str):
        assert token == "fake.jwt.token"
        return fake_claims

    # Patch in BOTH places (the function is also imported into deps_module)
    monkeypatch.setattr(clerk_module, "verify_clerk_jwt", _fake_verify)
    monkeypatch.setattr(deps_module, "verify_clerk_jwt", _fake_verify)

    try:
        with TestClient(app) as client:
            files = {"file": ("clip.wav", io.BytesIO(_fake_wav_bytes()), "audio/wav")}
            resp = client.post(
                "/api/upload",
                files=files,
                headers={"Authorization": "Bearer fake.jwt.token"},
            )
        # We don't care whether the *audio* validation passes; we only care
        # the auth gate let us through (no 401).
        assert resp.status_code != 401, resp.text

        # Verify the user row was created
        async def _check():
            async with AsyncSessionLocal() as db:
                q = await db.execute(
                    select(models.User).where(
                        models.User.clerk_user_id == "clerk_user_test_123"
                    )
                )
                return q.scalar_one_or_none()

        import asyncio
        user = asyncio.get_event_loop().run_until_complete(_check())
        assert user is not None
        assert user.email == "tester@example.com"
        assert user.plan == "free_trial"
    finally:
        settings.AUTH_REQUIRED = False
