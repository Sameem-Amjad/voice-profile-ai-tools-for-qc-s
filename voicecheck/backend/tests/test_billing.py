"""
Billing/webhook tests.

Covers:
- /api/billing/webhook rejects bad signatures with 400
- A `customer.subscription.created` event upserts a User+Subscription row;
  replaying the same event_id is idempotent (no second handler run)
- /api/billing/me returns the user's plan and usage
"""

from __future__ import annotations

import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from api.routes import billing as billing_module
from auth import dependencies as deps_module
from config import settings
from db import models
from db.session import AsyncSessionLocal
from main import app


# Webhook secret needs SOME value so the signature path runs
settings.STRIPE_WEBHOOK_SECRET = "whsec_test"
settings.STRIPE_PRICE_STARTER = "price_starter_test"
settings.STRIPE_PRICE_PRO = "price_pro_test"


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


async def _make_user(clerk_id: str, *, customer_id: str = None, email: str = "u@x.com") -> str:
    async with AsyncSessionLocal() as db:
        u = models.User(clerk_user_id=clerk_id, email=email, stripe_customer_id=customer_id)
        db.add(u)
        await db.commit()
        await db.refresh(u)
        return u.id


def test_webhook_rejects_bad_signature():
    """No Stripe-Signature header → 400."""
    with TestClient(app) as client:
        resp = client.post("/api/billing/webhook", content=b"{}")
    assert resp.status_code == 400


def test_webhook_creates_subscription_and_is_idempotent(monkeypatch):
    """
    Posting a customer.subscription.created event:
    - upserts a Subscription row
    - sets the User's plan
    Replaying the same event_id is a no-op.
    """
    customer_id = "cus_test_123"
    user_id = _run(_make_user("clerk_billing_user", customer_id=customer_id))

    fake_event = {
        "id": "evt_test_unique_1",
        "type": "customer.subscription.created",
        "data": {
            "object": {
                "id": "sub_test_1",
                "customer": customer_id,
                "status": "active",
                "current_period_end": 1900000000,
                "items": {
                    "data": [
                        {"price": {"id": settings.STRIPE_PRICE_STARTER}},
                    ]
                },
                "metadata": {},
            }
        },
    }

    def _fake_construct(payload, sig, secret):
        assert sig == "t=1,v1=fake"
        return fake_event

    monkeypatch.setattr(billing_module, "_construct_stripe_event", _fake_construct)

    with TestClient(app) as client:
        resp = client.post(
            "/api/billing/webhook",
            content=b"{}",
            headers={"Stripe-Signature": "t=1,v1=fake"},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json().get("received") is True
        assert resp.json().get("duplicate") is not True

        # Replay → idempotent (duplicate=True)
        resp2 = client.post(
            "/api/billing/webhook",
            content=b"{}",
            headers={"Stripe-Signature": "t=1,v1=fake"},
        )
        assert resp2.status_code == 200, resp2.text
        assert resp2.json().get("duplicate") is True

    async def _check():
        async with AsyncSessionLocal() as db:
            sub_q = await db.execute(
                select(models.Subscription).where(
                    models.Subscription.stripe_subscription_id == "sub_test_1"
                )
            )
            subs = sub_q.scalars().all()
            user_q = await db.execute(
                select(models.User).where(models.User.id == user_id)
            )
            user = user_q.scalar_one()
            return subs, user

    subs, user = _run(_check())
    # Exactly one subscription row (idempotency held)
    assert len(subs) == 1
    assert subs[0].status == "active"
    assert user.plan == "starter"


def test_billing_me_returns_plan_and_usage(monkeypatch):
    """GET /api/billing/me returns plan + usage for the current user."""
    # Ensure we hit the dev-anonymous user path for this test
    settings.AUTH_REQUIRED = False

    with TestClient(app) as client:
        resp = client.get("/api/billing/me")
    assert resp.status_code == 200, resp.text

    body = resp.json()
    assert body["plan"] in {"free_trial", "starter", "pro", "cancelled"}
    assert "monthly_minutes_used" in body
    assert "plan_cap_minutes" in body
    assert "trial_minutes_used" in body
    # Free-trial cap is 30 minutes per the brief
    if body["plan"] == "free_trial":
        assert body["plan_cap_minutes"] == 30
