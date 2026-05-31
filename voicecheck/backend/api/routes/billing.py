"""
Manual-payment billing endpoints.

Flow:
  1. POST /api/billing/request-subscription  — user requests a plan; admin is emailed
  2. DELETE /api/billing/request-subscription — user cancels a pending request
  3. POST /api/billing/cancel                 — cancel an active subscription
  4. GET  /api/billing/me                     — plan + usage summary
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import current_user
from config import settings
from db.models import Subscription, User
from db.session import get_db
from services.usage_service import (
    PLAN_LIMITS,
    FREE_TRIAL_ANALYSES_PER_MONTH,
    monthly_minutes_used,
    monthly_analyses_count,
)
from services.email_service import (
    send_subscription_request_to_admin,
    send_subscription_confirmed,
    send_subscription_cancelled,
)
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

VALID_PLANS = ("starter", "pro")


# ── Schemas ──────────────────────────────────────────────────────────────────

class SubscriptionRequestBody(BaseModel):
    plan: str  # "starter" | "pro"


class BillingMeResponse(BaseModel):
    plan: str
    pending_plan: Optional[str] = None
    status: Optional[str] = None
    current_period_end: Optional[datetime] = None
    monthly_minutes_used: float
    plan_cap_minutes: int
    trial_minutes_used: int
    analyses_this_month: int = 0
    analyses_cap: int = 0
    is_admin: bool = False


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post(
    "/billing/request-subscription",
    summary="Request a plan upgrade — admin will send a payment link",
)
async def request_subscription(
    body: SubscriptionRequestBody,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")
    if user.plan in VALID_PLANS:
        raise HTTPException(status_code=400, detail="You already have an active subscription.")

    user.pending_plan = body.plan
    await db.commit()

    # Email every configured admin
    admin_emails = [e.strip() for e in (settings.ADMIN_EMAILS or "").split(",") if e.strip()]
    for admin_email in admin_emails:
        send_subscription_request_to_admin(
            admin_email=admin_email,
            user_email=user.email or user.clerk_user_id,
            user_id=user.id,
            plan=body.plan,
        )

    logger.info("subscription_requested", user_id=user.id, plan=body.plan)
    return {"ok": True, "pending_plan": body.plan}


@router.delete(
    "/billing/request-subscription",
    summary="Cancel a pending subscription request",
)
async def cancel_subscription_request(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.pending_plan:
        raise HTTPException(status_code=400, detail="No pending request to cancel.")
    user.pending_plan = None
    await db.commit()
    logger.info("subscription_request_cancelled", user_id=user.id)
    return {"ok": True}


@router.post(
    "/billing/cancel",
    summary="Cancel an active subscription",
)
async def cancel_subscription(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail="No active subscription to cancel.")

    q = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.updated_at.desc())
        .limit(1)
    )
    sub = q.scalars().first()
    if sub:
        sub.status = "cancelled"

    user.plan = "cancelled"
    user.payment_token = None
    await db.commit()

    if user.email:
        send_subscription_cancelled(user.email)

    return {"cancelled": True}


@router.get(
    "/billing/me",
    response_model=BillingMeResponse,
    summary="Current user's plan, pending request, and usage",
)
async def billing_me(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    minutes_used = await monthly_minutes_used(user.id, db)
    plan_key = user.plan or "free_trial"
    plan_cfg = PLAN_LIMITS.get(plan_key, PLAN_LIMITS["free_trial"])
    cap = plan_cfg.get("limit_minutes", 0)

    sub_q = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.updated_at.desc())
        .limit(1)
    )
    sub = sub_q.scalars().first()

    analyses_count = (
        await monthly_analyses_count(user.id, db)
        if plan_key == "free_trial"
        else 0
    )

    return BillingMeResponse(
        plan=plan_key,
        pending_plan=user.pending_plan,
        status=sub.status if sub else None,
        current_period_end=sub.current_period_end if sub else None,
        monthly_minutes_used=round(minutes_used, 2),
        plan_cap_minutes=cap,
        trial_minutes_used=int(user.trial_minutes_used or 0),
        analyses_this_month=analyses_count,
        analyses_cap=(
            FREE_TRIAL_ANALYSES_PER_MONTH if plan_key == "free_trial" else 0
        ),
        is_admin=user.is_admin,
    )
