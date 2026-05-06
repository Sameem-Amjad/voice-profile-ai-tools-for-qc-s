from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime, timezone

from auth.dependencies import current_user
from db.models import User, AnalysisResult, UsageMinute
from db.session import get_db
from services.usage_service import PLAN_LIMITS

router = APIRouter()

class StatsOut(BaseModel):
    total_analyses: int
    avg_accuracy: float
    best_accuracy: float
    total_minutes_used: float
    this_month_minutes: float
    plan_cap_minutes: int
    plan: str

@router.get("/stats", response_model=StatsOut)
async def get_stats(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    # Total analyses and accuracy stats
    q = await db.execute(
        select(
            func.count(AnalysisResult.id),
            func.avg(AnalysisResult.accuracy_percentage),
            func.max(AnalysisResult.accuracy_percentage),
        ).where(AnalysisResult.user_id == user.id)
    )
    count, avg_acc, best_acc = q.one()

    # Total usage
    total_q = await db.execute(
        select(func.sum(UsageMinute.seconds)).where(UsageMinute.user_id == user.id)
    )
    total_seconds = total_q.scalar() or 0.0

    # This month usage
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_q = await db.execute(
        select(func.sum(UsageMinute.seconds)).where(
            UsageMinute.user_id == user.id,
            UsageMinute.created_at >= month_start,
        )
    )
    month_seconds = month_q.scalar() or 0.0

    plan = user.plan or "free_trial"
    cap = PLAN_LIMITS.get(plan, PLAN_LIMITS["free_trial"])["limit_minutes"]

    return StatsOut(
        total_analyses=count or 0,
        avg_accuracy=round(avg_acc or 0.0, 1),
        best_accuracy=round(best_acc or 0.0, 1),
        total_minutes_used=round(total_seconds / 60, 2),
        this_month_minutes=round(month_seconds / 60, 2),
        plan_cap_minutes=cap,
        plan=plan,
    )
