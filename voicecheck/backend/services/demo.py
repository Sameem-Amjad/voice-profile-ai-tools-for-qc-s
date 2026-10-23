"""
Portfolio demo mode (settings.DEMO_MODE). Off by default; production never sets it.

The demo runs on a throwaway SQLite database that is rebuilt from demo/demo_data.json
on every start, so visitors always find the same sample projects, users and inbox.
Because the logins are public and every upload costs an OpenAI call, the demo also:

- caps each upload at DEMO_MAX_AUDIO_SECONDS,
- caps transcriptions and chatbot messages per UTC day across all visitors,
- switches payments off (subscription requests and payment links),
- refuses to change the shared demo accounts' plans, so they keep working for the next visitor.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import delete

from config import settings
from db import models
from utils.logger import get_logger

logger = get_logger(__name__)

DATA_FILE = Path(__file__).resolve().parent.parent / "demo" / "demo_data.json"

# In-memory counters: one process, and the demo restarts often, which is fine.
_daily: dict[str, tuple[str, int]] = {}


def enabled() -> bool:
    return bool(settings.DEMO_MODE)


def _demo_error(status: int, error: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"error": error, "message": message})


def check_upload_duration(seconds: float) -> None:
    if enabled() and seconds and seconds > settings.DEMO_MAX_AUDIO_SECONDS:
        limit = settings.DEMO_MAX_AUDIO_SECONDS
        raise _demo_error(
            413,
            "demo_file_too_long",
            f"In this demo, uploads are limited to {limit // 60} minutes. Try a shorter clip, or open one of the sample projects.",
        )


def consume_daily(kind: str, limit: int) -> None:
    """Count one use of `kind` today; refuse once the demo's daily allowance is spent."""
    if not enabled():
        return
    today = datetime.now(timezone.utc).date().isoformat()
    day, used = _daily.get(kind, (today, 0))
    if day != today:
        used = 0
    if used >= limit:
        raise _demo_error(
            429,
            "demo_daily_limit",
            "The demo's free allowance for today is used up. Explore the sample projects, or try again tomorrow.",
        )
    _daily[kind] = (today, used + 1)


def _shared_ids() -> set[str]:
    return {u["clerk_user_id"] for u in _load().get("users", []) if u.get("shared_login")}


def is_shared_account(user: models.User | None) -> bool:
    return enabled() and user is not None and user.clerk_user_id in _shared_ids()


def refuse_payments() -> None:
    if enabled():
        raise _demo_error(403, "demo_payments_off", "Payments are switched off in this demo. Nothing can be bought or charged.")


def refuse_plan_change(target: models.User) -> None:
    if is_shared_account(target):
        raise _demo_error(403, "demo_shared_account", "The shared demo accounts keep their plan, so they work the same for every visitor.")


# ── Seeding ──────────────────────────────────────────────────────────────────

def _load() -> dict:
    try:
        return json.loads(DATA_FILE.read_text())
    except FileNotFoundError:
        return {}


def _ago(days: float, hour: int = 10) -> datetime:
    d = datetime.now(timezone.utc) - timedelta(days=days)
    return d.replace(hour=hour, minute=(int(days * 37) % 60), second=0, microsecond=0)


async def seed() -> None:
    """Replace every demo row with the contents of demo/demo_data.json."""
    if not enabled():
        return
    data = _load()
    if not data:
        logger.warning("demo_seed_missing", path=str(DATA_FILE))
        return

    from db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        ids = [u["id"] for u in data["users"]]
        for table in (models.AnalysisResult, models.UsageMinute, models.Subscription, models.ContactMessage, models.Feedback):
            await db.execute(delete(table).where(table.user_id.in_(ids)))
        await db.execute(delete(models.User).where(models.User.id.in_(ids)))

        for u in data["users"]:
            db.add(models.User(
                id=u["id"], clerk_user_id=u["clerk_user_id"], email=u["email"], plan=u["plan"],
                is_admin=bool(u.get("is_admin")), trial_minutes_used=0, created_at=_ago(u["joined_days_ago"]),
            ))
            if u["plan"] in ("starter", "pro"):
                db.add(models.Subscription(
                    user_id=u["id"], payment_token=f"demo-{u['id'][:8]}", status="active",
                    current_period_end=_ago(-30 + u["joined_days_ago"] % 30), created_at=_ago(u["joined_days_ago"]),
                ))
            for m in u.get("usage", []):
                db.add(models.UsageMinute(user_id=u["id"], job_id=f"demo-{u['id'][:8]}-{m['days_ago']}", seconds=m["seconds"], created_at=_ago(m["days_ago"])))
        await db.flush()

        for r in data["analyses"]:
            db.add(models.AnalysisResult(
                user_id=r["user_id"], job_id=r["job_id"], accuracy_percentage=r["accuracy_percentage"],
                total_words=r["total_words"], correct_words=r["correct_words"], script_snippet=r["script_snippet"],
                audio_duration=r["audio_duration"], result_json=json.dumps(r["result"]), created_at=_ago(r["days_ago"], r.get("hour", 10)),
            ))
            db.add(models.UsageMinute(user_id=r["user_id"], job_id=r["job_id"], seconds=r["audio_duration"], created_at=_ago(r["days_ago"], r.get("hour", 10))))
        for m in data["messages"]:
            db.add(models.ContactMessage(
                user_id=m.get("user_id"), name=m["name"], email=m["email"], subject=m["subject"], message=m["message"],
                status=m["status"], admin_reply=m.get("admin_reply"), created_at=_ago(m["days_ago"]),
                replied_at=_ago(m["days_ago"] - 1) if m.get("admin_reply") else None,
            ))
        for f in data["feedback"]:
            db.add(models.Feedback(
                user_id=f.get("user_id"), rating=f["rating"], text=f["text"], display_name=f["display_name"],
                role=f.get("role"), is_approved=f["is_approved"], created_at=_ago(f["days_ago"]),
            ))
        await db.commit()
    logger.info("demo_seeded", users=len(data["users"]), analyses=len(data["analyses"]), messages=len(data["messages"]))
