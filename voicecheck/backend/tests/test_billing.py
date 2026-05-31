"""
bSecure billing / callback tests.

Covers:
- POST /api/billing/callback activates a subscription when status == "placed"
- Replaying the same order_ref is idempotent
- GET /api/billing/me returns the user's plan and usage
"""

from __future__ import annotations

import asyncio
import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from config import settings
from db import models
from db.session import AsyncSessionLocal
from main import app

# Use sandbox so no real network calls are needed
settings.BSECURE_SANDBOX = True
settings.BSECURE_CLIENT_ID = "test_client_id"
settings.BSECURE_CLIENT_SECRET = "test_client_secret"
settings.BSECURE_STORE_SLUG = "test-store"
settings.BSECURE_STARTER_AMOUNT = "2000"
settings.BSECURE_PRO_AMOUNT = "4000"
settings.BSECURE_CALLBACK_URL = "http://localhost:8000/api/billing/callback"


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


async def _make_user(clerk_id: str, *, email: str = "u@x.com") -> str:
    async with AsyncSessionLocal() as db:
        u = models.User(clerk_user_id=clerk_id, email=email)
        db.add(u)
        await db.commit()
        await db.refresh(u)
        return u.id


def _seed_pending_checkout(user_id: str, plan: str = "starter") -> str:
    """Pre-populate the in-memory checkout dict so the callback handler can resolve the order."""
    import time
    from api.routes.billing import _pending_checkouts
    order_id = uuid.uuid4().hex
    _pending_checkouts[order_id] = {
        "user_id": user_id,
        "plan": plan,
        "created_at": time.time(),
    }
    return order_id


def test_callback_creates_subscription_and_is_idempotent():
    """
    Posting a success callback (status=placed):
    - sets User.plan to 'starter'
    - upserts a Subscription row
    Replaying the same order_ref is a no-op.
    """
    user_id = _run(_make_user("clerk_bs_user_1"))
    order_id = _seed_pending_checkout(user_id, plan="starter")
    order_ref = f"BSC-{uuid.uuid4().hex[:8].upper()}"

    payload = {
        "order_ref": order_ref,
        "order_id": order_id,
        "status": "placed",
    }

    with TestClient(app) as client:
        resp = client.post("/api/billing/callback", data=payload)
        assert resp.status_code == 200, resp.text
        assert resp.json().get("received") is True
        assert resp.json().get("duplicate") is not True

        # Replay → idempotent
        resp2 = client.post("/api/billing/callback", data=payload)
        assert resp2.status_code == 200, resp2.text
        assert resp2.json().get("duplicate") is True

    async def _check():
        async with AsyncSessionLocal() as db:
            sub_q = await db.execute(
                select(models.Subscription).where(
                    models.Subscription.payment_token == order_ref
                )
            )
            subs = sub_q.scalars().all()
            user_q = await db.execute(
                select(models.User).where(models.User.id == user_id)
            )
            user = user_q.scalar_one()
            return subs, user

    subs, user = _run(_check())
    assert len(subs) == 1
    assert subs[0].status == "active"
    assert user.plan == "starter"


def test_callback_failed_payment_does_not_activate():
    """A failed callback (status != placed) must not activate the plan."""
    user_id = _run(_make_user("clerk_bs_user_2"))
    order_id = _seed_pending_checkout(user_id, plan="starter")

    payload = {
        "order_ref": f"BSC-{uuid.uuid4().hex[:8].upper()}",
        "order_id": order_id,
        "status": "failed",
    }

    with TestClient(app) as client:
        resp = client.post("/api/billing/callback", data=payload)
    assert resp.status_code == 200, resp.text

    async def _check():
        async with AsyncSessionLocal() as db:
            q = await db.execute(select(models.User).where(models.User.id == user_id))
            return q.scalar_one()

    user = _run(_check())
    assert user.plan == "free_trial"  # must remain unchanged


def test_billing_me_returns_plan_and_usage():
    """GET /api/billing/me returns plan + usage for the current user."""
    settings.AUTH_REQUIRED = False

    with TestClient(app) as client:
        resp = client.get("/api/billing/me")
    assert resp.status_code == 200, resp.text

    body = resp.json()
    assert body["plan"] in {"free_trial", "starter", "pro", "cancelled"}
    assert "monthly_minutes_used" in body
    assert "plan_cap_minutes" in body
    assert "trial_minutes_used" in body
    if body["plan"] == "free_trial":
        assert body["plan_cap_minutes"] == 30
