"""
Per-user usage tracking and quota enforcement.

Plan caps live in PLAN_LIMITS. Free trial uses a *cumulative* cap counted on
User.trial_minutes_used. Paid plans use a rolling calendar-month sum across
the UsageMinute table.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import UsageMinute, User
from utils.logger import get_logger

logger = get_logger(__name__)


# ── Plan limits (in minutes) ────────────────────────────────────────────────
# free_trial: TOTAL minutes ever (lifetime), tracked on User.trial_minutes_used
# starter:    minutes per calendar month
# pro:        minutes per calendar month
# cancelled:  no usage allowed
PLAN_LIMITS: dict[str, dict] = {
    "free_trial": {"limit_minutes": 30, "cycle": "lifetime"},
    "starter":    {"limit_minutes": 5 * 60, "cycle": "month"},   # 5h
    "pro":        {"limit_minutes": 25 * 60, "cycle": "month"},  # 25h
    "cancelled":  {"limit_minutes": 0, "cycle": "month"},
}


def _month_start_utc(now: Optional[datetime] = None) -> datetime:
    n = now or datetime.now(timezone.utc)
    return datetime(n.year, n.month, 1, tzinfo=timezone.utc)


async def record_usage(
    user_id: str,
    job_id: str,
    seconds: float,
    db: AsyncSession,
) -> UsageMinute:
    """Insert a UsageMinute row for the user/job."""
    row = UsageMinute(user_id=user_id, job_id=job_id, seconds=float(seconds or 0.0))
    db.add(row)
    await db.commit()
    await db.refresh(row)
    logger.info(
        "usage_recorded",
        user_id=user_id,
        job_id=job_id,
        seconds=row.seconds,
    )
    return row


async def monthly_minutes_used(user_id: str, db: AsyncSession) -> float:
    """Sum minutes used by this user in the current calendar month (UTC)."""
    start = _month_start_utc()
    stmt = select(func.coalesce(func.sum(UsageMinute.seconds), 0.0)).where(
        UsageMinute.user_id == user_id,
        UsageMinute.created_at >= start,
    )
    result = await db.execute(stmt)
    total_seconds = float(result.scalar() or 0.0)
    return total_seconds / 60.0


async def total_minutes_used(user_id: str, db: AsyncSession) -> float:
    """Lifetime usage in minutes."""
    stmt = select(func.coalesce(func.sum(UsageMinute.seconds), 0.0)).where(
        UsageMinute.user_id == user_id,
    )
    result = await db.execute(stmt)
    return float(result.scalar() or 0.0) / 60.0


async def check_quota_or_raise(
    user: User,
    db: AsyncSession,
    expected_seconds: float,
) -> None:
    """
    Verify the user's plan can absorb `expected_seconds` more of audio.
    Raises HTTPException 402 Payment Required if the cap is exceeded.

    For free_trial: uses User.trial_minutes_used (cumulative ledger).
    For starter/pro: uses sum(UsageMinute.seconds) for the current month.
    """
    plan = (user.plan or "free_trial").lower()
    cfg = PLAN_LIMITS.get(plan, PLAN_LIMITS["free_trial"])
    cap_minutes = cfg["limit_minutes"]
    cycle = cfg["cycle"]
    expected_minutes = max(0.0, float(expected_seconds or 0.0) / 60.0)

    if cycle == "lifetime":
        used = float(user.trial_minutes_used or 0)
    else:
        used = await monthly_minutes_used(user.id, db)

    if used + expected_minutes > cap_minutes:
        logger.warning(
            "quota_exceeded",
            user_id=user.id,
            plan=plan,
            used_minutes=used,
            requested_minutes=expected_minutes,
            cap_minutes=cap_minutes,
        )
        raise HTTPException(
            status_code=402,
            detail={
                "error": "quota_exceeded",
                "plan": plan,
                "used_minutes": round(used, 2),
                "cap_minutes": cap_minutes,
                "message": (
                    "Free trial limit reached. Upgrade to Starter or Pro to continue."
                    if plan == "free_trial"
                    else "Monthly usage cap reached. Upgrade your plan or wait for next billing cycle."
                ),
            },
        )
