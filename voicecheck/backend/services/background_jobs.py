"""
Background jobs that run inside the FastAPI process on a schedule.
No Celery, no Redis, no new infrastructure — just asyncio tasks.

Jobs:
  1. job_cleanup          — every 5 min  — expire in-memory jobs + delete S3 orphans
  2. quota_warning_emails — every 6 hrs  — email users who've hit 80 %+ of monthly quota
"""

import asyncio
from datetime import datetime, timezone

from config import settings
from db.session import AsyncSessionLocal
from db.models import User
from services.job_service import job_service
from services.usage_service import monthly_minutes_used, PLAN_LIMITS, FREE_TRIAL_ANALYSES_PER_MONTH
from utils.logger import get_logger

logger = get_logger(__name__)


# ── Job 1: cleanup expired jobs + S3 orphans ─────────────────────────────────

async def _cleanup_loop():
    """Every 5 minutes: purge expired in-memory jobs and their S3 objects."""
    while True:
        await asyncio.sleep(300)
        try:
            expired_ids = await job_service.get_expired_job_ids()
            if not expired_ids:
                continue

            if settings.STORAGE_BACKEND == "s3":
                from core.storage.s3 import get_s3_storage
                s3 = get_s3_storage()
                deleted_keys = 0
                for job_id in expired_ids:
                    job = await job_service.get_job(job_id)
                    if job and job.audio_filename:
                        if s3.delete_key(f"uploads/{job_id}/{job.audio_filename}"):
                            deleted_keys += 1
                if deleted_keys:
                    logger.info("s3_orphans_cleaned", count=deleted_keys)

            cleaned = await job_service.cleanup_expired()
            if cleaned:
                logger.info("jobs_cleaned", count=cleaned)

        except Exception as e:
            logger.warning("cleanup_loop_error", error=str(e))


# ── Job 2: quota warning emails ───────────────────────────────────────────────

_WARNING_THRESHOLD = 0.80   # email at 80 % usage


async def _quota_warning_loop():
    """
    Every 6 hours: find users on paid plans who've used >= 80 % of their
    monthly quota and haven't been warned yet this month.

    Uses a simple in-process set to avoid duplicate emails within the same
    server lifetime.  After a restart the set resets — acceptable for MVP,
    worst case a user gets two warning emails per month.
    """
    warned_this_month: set[str] = set()
    last_reset_month: int = datetime.now(timezone.utc).month

    while True:
        await asyncio.sleep(6 * 3600)
        try:
            now = datetime.now(timezone.utc)
            if now.month != last_reset_month:
                warned_this_month.clear()
                last_reset_month = now.month

            async with AsyncSessionLocal() as db:
                from sqlalchemy import select
                result = await db.execute(
                    select(User).where(User.plan.in_(["starter", "pro", "team"]))
                )
                users = result.scalars().all()

            for user in users:
                if user.id in warned_this_month:
                    continue
                if not user.email:
                    continue

                plan_cfg = PLAN_LIMITS.get(user.plan or "free_trial", {})
                cap = plan_cfg.get("limit_minutes", 0)
                if cap <= 0:
                    continue

                async with AsyncSessionLocal() as db:
                    used = await monthly_minutes_used(user.id, db)

                ratio = used / cap
                if ratio >= _WARNING_THRESHOLD:
                    _send_quota_warning(user.email, user.plan, round(used), cap)
                    warned_this_month.add(user.id)
                    logger.info(
                        "quota_warning_sent",
                        user_id=user.id,
                        plan=user.plan,
                        used_minutes=round(used),
                        cap_minutes=cap,
                        ratio=round(ratio, 2),
                    )

        except Exception as e:
            logger.warning("quota_warning_loop_error", error=str(e))


def _send_quota_warning(email: str, plan: str, used: int, cap: int) -> None:
    from services.email_service import _send
    remaining = max(0, cap - used)
    percent = round((used / cap) * 100)
    plan_label = (plan or "").capitalize()
    _send(
        to=email,
        subject=f"SoundProof: you've used {percent}% of your monthly quota",
        html=f"""
<p>Hi,</p>
<p>You're on the <strong>{plan_label}</strong> plan and have used
<strong>{used} of {cap} minutes</strong> ({percent}%) this month.</p>
<p>You have approximately <strong>{remaining} minutes</strong> remaining.</p>
<p>When you run out, new uploads will be paused until the next billing cycle —
or you can <a href="https://voice-profile-two.vercel.app/account">upgrade your plan</a>
for more capacity.</p>
<p>— The SoundProof team</p>
""",
    )


# ── Public entry points ───────────────────────────────────────────────────────

def start_background_jobs() -> list[asyncio.Task]:
    """
    Spawn all background jobs and return their tasks so the caller (lifespan)
    can cancel them on shutdown.
    """
    tasks = [
        asyncio.create_task(_cleanup_loop(),        name="job_cleanup"),
        asyncio.create_task(_quota_warning_loop(),  name="quota_warnings"),
    ]
    logger.info("background_jobs_started", count=len(tasks))
    return tasks
