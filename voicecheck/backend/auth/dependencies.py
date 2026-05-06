"""
FastAPI dependencies that bridge Clerk JWT claims and our DB User row.

In dev/MVP mode (settings.AUTH_REQUIRED=False), `current_user` returns a
synthetic anonymous User so existing endpoints keep working without auth.
When AUTH_REQUIRED=True, a valid Clerk Bearer token is required.
"""

from __future__ import annotations

from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.clerk import verify_clerk_jwt
from config import settings
from db.models import User
from db.session import get_db
from utils.logger import get_logger

logger = get_logger(__name__)

# A stable clerk_user_id we use whenever AUTH_REQUIRED=False so dev calls
# all map to a single synthetic user row.
ANONYMOUS_CLERK_ID = "anonymous-dev-user"
ANONYMOUS_EMAIL = "anonymous@dev.local"


async def get_or_create_user(claims: dict, db: AsyncSession) -> User:
    """
    Read or upsert the User row keyed on clerk_user_id from JWT claims.

    Clerk JWTs use 'sub' for the user_id. Email is best-effort: Clerk
    sometimes embeds it as 'email' or via a custom claim — fall back to
    None if unknown.
    """
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Token missing subject (sub)")

    email = claims.get("email") or claims.get("email_address")

    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(clerk_user_id=clerk_user_id, email=email)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("user_created", clerk_user_id=clerk_user_id)
    elif email and user.email != email:
        user.email = email
        await db.commit()
        await db.refresh(user)
    return user


async def current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Resolve the current User row.

    - AUTH_REQUIRED=True: Bearer JWT is mandatory; verify with Clerk JWKS.
    - AUTH_REQUIRED=False: a single synthetic dev user is returned. If a
      Bearer token IS supplied in dev mode, we still try to verify it so
      tests can exercise the auth path.
    """
    if settings.AUTH_REQUIRED:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Authentication required")
        token = authorization.split(" ", 1)[1].strip()
        claims = verify_clerk_jwt(token)
        return await get_or_create_user(claims, db)

    # Dev/MVP path: optionally honour a token, otherwise use anonymous user
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token:
            try:
                claims = verify_clerk_jwt(token)
                return await get_or_create_user(claims, db)
            except HTTPException:
                # In dev, fall back to anonymous on bad tokens rather than 401
                pass

    return await get_or_create_user(
        {"sub": ANONYMOUS_CLERK_ID, "email": ANONYMOUS_EMAIL}, db
    )


async def admin_user(user: User = Depends(current_user)) -> User:
    """Require the current user to be an admin."""
    admin_emails = [e.strip().lower() for e in (settings.ADMIN_EMAILS or "").split(",") if e.strip()]
    if not (user.is_admin or (user.email and user.email.lower() in admin_emails)):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
