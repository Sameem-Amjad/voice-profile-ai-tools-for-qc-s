"""
Stripe billing endpoints.

- POST /api/billing/checkout-session  → create a Checkout Session
- POST /api/billing/portal-session    → open the Customer Portal
- POST /api/billing/webhook           → Stripe webhook receiver (idempotent)
- GET  /api/billing/me                → user plan + monthly usage summary
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import current_user
from config import settings
from db.models import ProcessedStripeEvent, Subscription, User
from db.session import get_db
from services.usage_service import PLAN_LIMITS, monthly_minutes_used
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Configure Stripe SDK once at import time
stripe.api_key = settings.STRIPE_SECRET_KEY


# ── Schemas ─────────────────────────────────────────────────────────────────

class CheckoutSessionRequest(BaseModel):
    plan: Literal["starter", "pro"]
    success_url: str = Field(..., min_length=1)
    cancel_url: str = Field(..., min_length=1)


class CheckoutSessionResponse(BaseModel):
    url: str


class PortalSessionRequest(BaseModel):
    return_url: str = Field(..., min_length=1)


class PortalSessionResponse(BaseModel):
    url: str


class BillingMeResponse(BaseModel):
    plan: str
    current_period_end: Optional[datetime] = None
    monthly_minutes_used: float
    plan_cap_minutes: int
    trial_minutes_used: int
    is_admin: bool = False


# ── Helpers ─────────────────────────────────────────────────────────────────

def _price_id_for_plan(plan: str) -> str:
    if plan == "starter":
        pid = settings.STRIPE_PRICE_STARTER
    elif plan == "pro":
        pid = settings.STRIPE_PRICE_PRO
    else:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {plan}")
    if not pid:
        raise HTTPException(
            status_code=500,
            detail=f"Stripe price ID for plan '{plan}' is not configured.",
        )
    return pid


async def _ensure_stripe_customer(user: User, db: AsyncSession) -> str:
    """Return the user's Stripe customer ID, creating one if needed."""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email or None,
        metadata={"user_id": user.id, "clerk_user_id": user.clerk_user_id},
    )
    user.stripe_customer_id = customer["id"]
    await db.commit()
    await db.refresh(user)
    return user.stripe_customer_id


def _plan_from_price_id(price_id: Optional[str]) -> Optional[str]:
    if not price_id:
        return None
    if price_id == settings.STRIPE_PRICE_STARTER:
        return "starter"
    if price_id == settings.STRIPE_PRICE_PRO:
        return "pro"
    return None


# ── Routes ──────────────────────────────────────────────────────────────────

@router.post(
    "/billing/checkout-session",
    response_model=CheckoutSessionResponse,
    summary="Create a Stripe Checkout Session for a subscription plan",
)
async def create_checkout_session(
    body: CheckoutSessionRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured.")

    price_id = _price_id_for_plan(body.plan)
    customer_id = await _ensure_stripe_customer(user, db)

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=body.success_url,
            cancel_url=body.cancel_url,
            allow_promotion_codes=True,
            metadata={"user_id": user.id, "plan": body.plan},
        )
    except stripe.error.StripeError as e:
        logger.error("stripe_checkout_failed", user_id=user.id, error=str(e))
        raise HTTPException(status_code=502, detail="Stripe checkout creation failed")

    return CheckoutSessionResponse(url=session["url"])


@router.post(
    "/billing/portal-session",
    response_model=PortalSessionResponse,
    summary="Open the Stripe Customer Portal for the current user",
)
async def create_portal_session(
    body: PortalSessionRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured.")

    customer_id = await _ensure_stripe_customer(user, db)
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=body.return_url,
        )
    except stripe.error.StripeError as e:
        logger.error("stripe_portal_failed", user_id=user.id, error=str(e))
        raise HTTPException(status_code=502, detail="Stripe portal session failed")

    return PortalSessionResponse(url=session["url"])


@router.get(
    "/billing/me",
    response_model=BillingMeResponse,
    summary="Current user's plan, period end, and usage",
)
async def billing_me(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    minutes_used = await monthly_minutes_used(user.id, db)
    cap = PLAN_LIMITS.get(user.plan or "free_trial", PLAN_LIMITS["free_trial"])["limit_minutes"]

    # Find the most recent active subscription, if any
    sub_q = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.updated_at.desc())
    )
    sub = sub_q.scalars().first()

    return BillingMeResponse(
        plan=user.plan or "free_trial",
        current_period_end=sub.current_period_end if sub else None,
        monthly_minutes_used=round(minutes_used, 2),
        plan_cap_minutes=cap,
        trial_minutes_used=int(user.trial_minutes_used or 0),
        is_admin=user.is_admin,
    )


# ── Webhook ─────────────────────────────────────────────────────────────────

# Wrapped so tests can monkeypatch the verification step
def _construct_stripe_event(payload: bytes, signature: str, secret: str):
    return stripe.Webhook.construct_event(payload, signature, secret)


async def _user_for_customer(customer_id: str, db: AsyncSession) -> Optional[User]:
    if not customer_id:
        return None
    q = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    return q.scalar_one_or_none()


def _epoch_to_dt(epoch: Optional[int]) -> Optional[datetime]:
    if not epoch:
        return None
    return datetime.fromtimestamp(int(epoch), tz=timezone.utc)


async def _handle_subscription_event(event: dict, db: AsyncSession) -> None:
    obj = event["data"]["object"]
    customer_id = obj.get("customer")
    sub_id = obj.get("id")
    status = obj.get("status", "unknown")
    period_end = _epoch_to_dt(obj.get("current_period_end"))

    # Resolve plan from the first item's price
    items = (obj.get("items") or {}).get("data") or []
    price_id = None
    if items:
        price = items[0].get("price") or {}
        price_id = price.get("id")
    plan_name = _plan_from_price_id(price_id) or "starter"

    user = await _user_for_customer(customer_id, db)
    if user is None:
        # Some webhooks (e.g. created) may arrive before checkout completes;
        # try checkout metadata via subscription metadata if present
        meta_user_id = (obj.get("metadata") or {}).get("user_id")
        if meta_user_id:
            q = await db.execute(select(User).where(User.id == meta_user_id))
            user = q.scalar_one_or_none()
            if user is not None and not user.stripe_customer_id:
                user.stripe_customer_id = customer_id

    if user is None:
        logger.warning(
            "subscription_event_user_not_found",
            customer_id=customer_id,
            subscription_id=sub_id,
        )
        return

    # Update / insert Subscription row
    q = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == sub_id)
    )
    sub_row = q.scalar_one_or_none()

    if event["type"] == "customer.subscription.deleted":
        if sub_row is not None:
            sub_row.status = "canceled"
            sub_row.current_period_end = period_end or sub_row.current_period_end
        user.plan = "cancelled"
    else:
        if sub_row is None:
            sub_row = Subscription(
                user_id=user.id,
                stripe_subscription_id=sub_id,
                status=status,
                current_period_end=period_end,
            )
            db.add(sub_row)
        else:
            sub_row.status = status
            sub_row.current_period_end = period_end
        # Map active/trialing to the resolved plan; otherwise mark cancelled
        if status in {"active", "trialing", "past_due"}:
            user.plan = plan_name
        elif status in {"canceled", "incomplete_expired", "unpaid"}:
            user.plan = "cancelled"

    await db.commit()


async def _handle_invoice_payment_failed(event: dict, db: AsyncSession) -> None:
    obj = event["data"]["object"]
    customer_id = obj.get("customer")
    user = await _user_for_customer(customer_id, db)
    if user is None:
        return
    # Naive grace handling: if attempt_count is high, downgrade to cancelled
    attempt_count = int(obj.get("attempt_count") or 0)
    logger.warning(
        "invoice_payment_failed",
        user_id=user.id,
        attempt_count=attempt_count,
    )
    if attempt_count >= 3:
        user.plan = "cancelled"
        await db.commit()


@router.post(
    "/billing/webhook",
    summary="Stripe webhook receiver (no auth — verified via signature)",
)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
):
    payload = await request.body()
    secret = settings.STRIPE_WEBHOOK_SECRET
    if not secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        event = _construct_stripe_event(payload, stripe_signature, secret)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.warning("webhook_signature_invalid", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event.get("id")
    event_type = event.get("type", "unknown")
    if not event_id:
        raise HTTPException(status_code=400, detail="Event missing id")

    # Idempotency: insert event_id FIRST. If it already exists, drop the work.
    db.add(ProcessedStripeEvent(id=event_id, event_type=event_type))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        logger.info("webhook_duplicate_dropped", event_id=event_id, event_type=event_type)
        return {"received": True, "duplicate": True}

    try:
        if event_type in {
            "customer.subscription.created",
            "customer.subscription.updated",
            "customer.subscription.deleted",
        }:
            await _handle_subscription_event(event, db)
        elif event_type == "invoice.payment_succeeded":
            logger.info("invoice_payment_succeeded", event_id=event_id)
        elif event_type == "invoice.payment_failed":
            await _handle_invoice_payment_failed(event, db)
        else:
            logger.info("webhook_unhandled_event", event_type=event_type)
    except Exception as e:
        # We've already recorded the event_id — log and move on (Stripe will
        # NOT retry, but failure mode is at least visible).
        logger.error(
            "webhook_handler_error",
            event_id=event_id,
            event_type=event_type,
            error=str(e),
        )

    return {"received": True}
