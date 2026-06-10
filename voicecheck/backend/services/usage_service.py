"""
Per-user usage tracking and quota enforcement.

Plan caps:
  free_trial  – 3 analyses per month (analysis-count based, not minutes)
                Files capped at 5 min each to protect API costs.
  starter     – 180 min per calendar month, files up to 10 min each
  pro         – 600 min per calendar month, files up to 15 min each
  team        – 2400 min per calendar month
  cancelled   – no usage allowed
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AnalysisResult, UsageMinute, User
from utils.logger import get_logger

logger = get_logger(__name__)

FREE_TRIAL_ANALYSES_PER_MONTH = 3
FREE_TRIAL_MAX_TRANSCRIPTIONS = 3         # max transcriptions per month for free users
FREE_TRIAL_MAX_FILE_MINUTES = 5           # max per-file duration for free users (5 min)

PLAN_LIMITS: dict[str, dict] = {
    "free_trial": {"limit_analyses": FREE_TRIAL_ANALYSES_PER_MONTH, "cycle": "month"},
    "starter":    {"limit_minutes": 180,  "cycle": "month", "max_file_minutes": 10},
    "pro":        {"limit_minutes": 600,  "cycle": "month", "max_file_minutes": 15},
    "team":       {"limit_minutes": 2400, "cycle": "month"},
    "cancelled":  {"limit_minutes": 0,    "cycle": "month"},
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
    row = UsageMinute(user_id=user_id, job_id=job_id, seconds=float(seconds or 0.0))
    db.add(row)
    await db.commit()
    await db.refresh(row)
    logger.info("usage_recorded", user_id=user_id, job_id=job_id, seconds=row.seconds)
    return row


async def monthly_minutes_used(user_id: str, db: AsyncSession) -> float:
    start = _month_start_utc()
    stmt = select(func.coalesce(func.sum(UsageMinute.seconds), 0.0)).where(
        UsageMinute.user_id == user_id,
        UsageMinute.created_at >= start,
    )
    result = await db.execute(stmt)
    return float(result.scalar() or 0.0) / 60.0


async def total_minutes_used(user_id: str, db: AsyncSession) -> float:
    stmt = select(func.coalesce(func.sum(UsageMinute.seconds), 0.0)).where(
        UsageMinute.user_id == user_id,
    )
    result = await db.execute(stmt)
    return float(result.scalar() or 0.0) / 60.0


async def monthly_analyses_count(user_id: str, db: AsyncSession) -> int:
    start = _month_start_utc()
    stmt = select(func.count(AnalysisResult.id)).where(
        AnalysisResult.user_id == user_id,
        AnalysisResult.created_at >= start,
    )
    result = await db.execute(stmt)
    return int(result.scalar() or 0)


async def monthly_transcription_count(user_id: str, db: AsyncSession) -> int:
    """Count transcriptions (UsageMinute rows) completed this calendar month."""
    start = _month_start_utc()
    stmt = select(func.count(UsageMinute.id)).where(
        UsageMinute.user_id == user_id,
        UsageMinute.created_at >= start,
    )
    result = await db.execute(stmt)
    return int(result.scalar() or 0)


async def check_transcription_quota_or_raise(user: User, db: AsyncSession) -> None:
    """Gate for free_trial: max FREE_TRIAL_MAX_TRANSCRIPTIONS per month."""
    plan = (user.plan or "free_trial").lower()
    if plan != "free_trial":
        return

    count = await monthly_transcription_count(user.id, db)
    if count >= FREE_TRIAL_MAX_TRANSCRIPTIONS:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "quota_exceeded",
                "plan": plan,
                "transcriptions_used": count,
                "transcriptions_cap": FREE_TRIAL_MAX_TRANSCRIPTIONS,
                "message": f"You've used all {FREE_TRIAL_MAX_TRANSCRIPTIONS} free analyses this month. Upgrade to continue.",
            },
        )


async def check_quota_or_raise(
    user: User,
    db: AsyncSession,
    expected_seconds: float,
) -> None:
    plan = (user.plan or "free_trial").lower()
    expected_minutes = max(0.0, float(expected_seconds or 0.0) / 60.0)

    if plan == "free_trial":
        # Per-file duration cap to protect API costs
        if expected_minutes > FREE_TRIAL_MAX_FILE_MINUTES:
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "file_too_long",
                    "plan": plan,
                    "max_minutes": FREE_TRIAL_MAX_FILE_MINUTES,
                    "message": f"Free plan supports files up to {FREE_TRIAL_MAX_FILE_MINUTES} minutes. Upgrade to Starter or Pro for longer files.",
                },
            )
        return

    if plan == "cancelled":
        raise HTTPException(
            status_code=402,
            detail={
                "error": "quota_exceeded",
                "plan": plan,
                "message": "Your subscription has been cancelled. Resubscribe to continue.",
            },
        )

    cfg = PLAN_LIMITS.get(plan, PLAN_LIMITS["starter"])

    # Per-file duration cap for paid plans
    max_file = cfg.get("max_file_minutes")
    if max_file and expected_minutes > max_file:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "file_too_long",
                "plan": plan,
                "max_minutes": max_file,
                "message": f"Your {plan.capitalize()} plan supports files up to {max_file} minutes. Upgrade to a higher plan for longer files.",
            },
        )

    cap_minutes = cfg["limit_minutes"]
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
                "message": "Monthly usage cap reached. Upgrade your plan or wait for next billing cycle.",
            },
        )


async def check_analysis_quota_or_raise(user: User, db: AsyncSession) -> None:
    """Gate for free_trial: max FREE_TRIAL_ANALYSES_PER_MONTH analyses per month."""
    plan = (user.plan or "free_trial").lower()
    if plan != "free_trial":
        return

    count = await monthly_analyses_count(user.id, db)
    if count >= FREE_TRIAL_ANALYSES_PER_MONTH:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "quota_exceeded",
                "plan": plan,
                "analyses_used": count,
                "analyses_cap": FREE_TRIAL_ANALYSES_PER_MONTH,
                "message": f"You've used your {FREE_TRIAL_ANALYSES_PER_MONTH} free analyses this month. Upgrade to continue.",
            },
        )
