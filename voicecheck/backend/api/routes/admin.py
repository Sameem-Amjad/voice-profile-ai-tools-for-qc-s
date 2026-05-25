from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timezone

from auth.dependencies import admin_user
from db.models import User, AnalysisResult, ContactMessage, Feedback, UsageMinute, Subscription
from db.session import get_db

router = APIRouter()

# ── Overview ─────────────────────────────────────────────────────────────────

class OverviewOut(BaseModel):
    total_users: int
    active_subscriptions: int
    starter_count: int
    pro_count: int
    free_trial_count: int
    total_analyses: int
    total_messages: int
    pending_messages: int

async def _count(db, stmt) -> int:
    try:
        return (await db.execute(stmt)).scalar() or 0
    except Exception:
        return 0

@router.get("/admin/overview", response_model=OverviewOut)
async def admin_overview(
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    total_users  = await _count(db, select(func.count(User.id)))
    active_subs  = await _count(db, select(func.count(Subscription.id)).where(Subscription.status == "active"))
    starter      = await _count(db, select(func.count(User.id)).where(User.plan == "starter"))
    pro          = await _count(db, select(func.count(User.id)).where(User.plan == "pro"))
    free         = await _count(db, select(func.count(User.id)).where(User.plan == "free_trial"))
    analyses     = await _count(db, select(func.count(AnalysisResult.id)))
    messages     = await _count(db, select(func.count(ContactMessage.id)))
    pending      = await _count(db, select(func.count(ContactMessage.id)).where(ContactMessage.status == "pending"))

    return OverviewOut(
        total_users=total_users,
        active_subscriptions=active_subs,
        starter_count=starter,
        pro_count=pro,
        free_trial_count=free,
        total_analyses=analyses,
        total_messages=messages,
        pending_messages=pending,
    )

# ── Users ─────────────────────────────────────────────────────────────────────

class UserAdminOut(BaseModel):
    id: str
    email: Optional[str]
    plan: str
    trial_minutes_used: int
    is_admin: bool
    created_at: datetime
    class Config:
        from_attributes = True

@router.get("/admin/users", response_model=list[UserAdminOut])
async def admin_users(
    limit: int = 50,
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(select(User).order_by(User.created_at.desc()).limit(limit))
    return q.scalars().all()

# ── Messages ──────────────────────────────────────────────────────────────────

class MessageAdminOut(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    status: str
    admin_reply: Optional[str]
    created_at: datetime
    replied_at: Optional[datetime]
    class Config:
        from_attributes = True

class ReplyRequest(BaseModel):
    reply_text: str

@router.get("/admin/messages", response_model=list[MessageAdminOut])
async def admin_messages(
    status: Optional[str] = None,
    limit: int = 50,
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(limit)
    if status:
        q = q.where(ContactMessage.status == status)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/admin/messages/{message_id}/reply")
async def reply_to_message(
    message_id: str,
    body: ReplyRequest,
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(select(ContactMessage).where(ContactMessage.id == message_id))
    msg = q.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.admin_reply = body.reply_text
    msg.status = "replied"
    msg.replied_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}

# ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackAdminOut(BaseModel):
    id: str
    rating: int
    text: str
    display_name: Optional[str]
    role: Optional[str]
    is_approved: bool
    created_at: datetime
    class Config:
        from_attributes = True

class FeedbackApproveRequest(BaseModel):
    is_approved: bool

@router.get("/admin/feedback", response_model=list[FeedbackAdminOut])
async def admin_feedback(
    limit: int = 50,
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(select(Feedback).order_by(Feedback.created_at.desc()).limit(limit))
    return q.scalars().all()

@router.patch("/admin/feedback/{feedback_id}")
async def update_feedback(
    feedback_id: str,
    body: FeedbackApproveRequest,
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    fb = q.scalar_one_or_none()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.is_approved = body.is_approved
    await db.commit()
    return {"ok": True}

# ── Revenue ───────────────────────────────────────────────────────────────────

class RevenueOut(BaseModel):
    starter_count: int
    pro_count: int
    estimated_mrr: float
    total_active_subscriptions: int

@router.get("/admin/revenue", response_model=RevenueOut)
async def admin_revenue(
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    starter = (await db.execute(select(func.count(User.id)).where(User.plan == "starter"))).scalar() or 0
    pro = (await db.execute(select(func.count(User.id)).where(User.plan == "pro"))).scalar() or 0
    active = (await db.execute(
        select(func.count(Subscription.id)).where(Subscription.status == "active")
    )).scalar() or 0
    mrr = (starter * 29.0) + (pro * 49.0)
    return RevenueOut(
        starter_count=starter,
        pro_count=pro,
        estimated_mrr=mrr,
        total_active_subscriptions=active,
    )
