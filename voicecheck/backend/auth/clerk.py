"""
Server-side Clerk JWT verification.

Per the brief: NO Clerk SDK round-trips. We verify tokens locally against
Clerk's JWKS, with a 1-hour in-memory cache.
"""

from __future__ import annotations

import time
from typing import Any, Optional

import httpx
from fastapi import Header, HTTPException, status
from jose import jwt
from jose.exceptions import JWTError

from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# JWKS cache: (jwks_dict, expires_at_unix_seconds)
_JWKS_CACHE_TTL = 3600  # 1 hour
_jwks_cache: dict[str, Any] = {"keys": None, "expires_at": 0.0}


def _resolved_jwks_url() -> str:
    if settings.CLERK_JWKS_URL:
        return settings.CLERK_JWKS_URL
    if settings.CLERK_ISSUER:
        return settings.CLERK_ISSUER.rstrip("/") + "/.well-known/jwks.json"
    # Sensible default — Clerk's global JWKS endpoint
    return "https://api.clerk.com/v1/jwks"


def _fetch_jwks() -> dict:
    """Fetch JWKS from Clerk; cache for _JWKS_CACHE_TTL seconds."""
    now = time.time()
    if _jwks_cache["keys"] is not None and now < _jwks_cache["expires_at"]:
        return _jwks_cache["keys"]

    url = _resolved_jwks_url()
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            jwks = resp.json()
    except Exception as e:
        logger.error("jwks_fetch_failed", url=url, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify token (auth provider unreachable)",
        )

    _jwks_cache["keys"] = jwks
    _jwks_cache["expires_at"] = now + _JWKS_CACHE_TTL
    logger.info("jwks_refreshed", url=url, key_count=len(jwks.get("keys", [])))
    return jwks


def _key_for_kid(jwks: dict, kid: str) -> Optional[dict]:
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            return k
    return None


def verify_clerk_jwt(token: str) -> dict:
    """
    Verify a Clerk-issued JWT and return its decoded claims.

    Raises HTTPException(401) on any verification failure.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Malformed token: {e}")

    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Token missing 'kid' header")

    jwks = _fetch_jwks()
    key = _key_for_kid(jwks, kid)
    if key is None:
        # Possibly a key rotation — bust cache and try once more.
        _jwks_cache["expires_at"] = 0.0
        jwks = _fetch_jwks()
        key = _key_for_kid(jwks, kid)
        if key is None:
            raise HTTPException(status_code=401, detail="Unknown token signing key")

    issuer = settings.CLERK_ISSUER or None
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=[unverified_header.get("alg", "RS256")],
            issuer=issuer,
            options={
                # Clerk uses 'azp' rather than 'aud' for many tokens; don't
                # require aud unless the deployment configures it.
                "verify_aud": False,
                "verify_iss": bool(issuer),
            },
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    return claims


async def get_current_user_claims(
    authorization: Optional[str] = Header(None),
) -> dict:
    """
    FastAPI dependency: extracts a Bearer token from the Authorization header
    and verifies it via Clerk JWKS.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token")

    return verify_clerk_jwt(token)


def fetch_clerk_email(clerk_user_id: str) -> Optional[str]:
    """
    Fetch the primary email for a Clerk user via the Clerk Backend API.

    Requires CLERK_SECRET_KEY to be set. Returns None silently on any failure
    so callers can treat email as optional.
    """
    secret = settings.CLERK_SECRET_KEY
    if not secret or not clerk_user_id or clerk_user_id == "anonymous-dev-user":
        return None

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(
                f"https://api.clerk.com/v1/users/{clerk_user_id}",
                headers={"Authorization": f"Bearer {secret}"},
            )
            if resp.status_code != 200:
                return None
            data = resp.json()

        primary_id = data.get("primary_email_address_id")
        for addr in data.get("email_addresses", []):
            if addr.get("id") == primary_id:
                return addr.get("email_address")
        # Fallback: first email address
        addrs = data.get("email_addresses", [])
        if addrs:
            return addrs[0].get("email_address")
    except Exception as e:
        logger.warning("clerk_email_fetch_failed", clerk_user_id=clerk_user_id, error=str(e))

    return None
