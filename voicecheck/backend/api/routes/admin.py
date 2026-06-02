from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid

from auth.dependencies import admin_user
from services.email_service import send_admin_reply, send_subscription_confirmed, send_payment_link
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
    # User plan counts in one query using conditional aggregation
    user_row = (await db.execute(
        select(
            func.count(User.id).label("total"),
            func.count(case((User.plan == "starter", 1))).label("starter"),
            func.count(case((User.plan == "pro", 1))).label("pro"),
            func.count(case((User.plan == "free_trial", 1))).label("free_trial"),
        )
    )).one()

    active_subs = await _count(db, select(func.count(Subscription.id)).where(Subscription.status == "active"))
    analyses    = await _count(db, select(func.count(AnalysisResult.id)))

    # Message counts in one query
    msg_row = (await db.execute(
        select(
            func.count(ContactMessage.id).label("total"),
            func.count(case((ContactMessage.status == "pending", 1))).label("pending"),
        )
    )).one()

    return OverviewOut(
        total_users=user_row.total,
        active_subscriptions=active_subs,
        starter_count=user_row.starter,
        pro_count=user_row.pro,
        free_trial_count=user_row.free_trial,
        total_analyses=analyses,
        total_messages=msg_row.total,
        pending_messages=msg_row.pending,
    )

# ── Users ─────────────────────────────────────────────────────────────────────

class UserAdminOut(BaseModel):
    id: str
    email: Optional[str]
    plan: str
    pending_plan: Optional[str] = None
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


class SetPlanRequest(BaseModel):
    plan: str  # "starter" | "pro" | "free_trial" | "cancelled"


class SendPaymentLinkRequest(BaseModel):
    payment_link: str
    plan: str


@router.post("/admin/users/{user_id}/set-plan")
async def admin_set_plan(
    user_id: str,
    body: SetPlanRequest,
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(select(User).where(User.id == user_id))
    user = q.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid = ("starter", "pro", "free_trial", "cancelled")
    if body.plan not in valid:
        raise HTTPException(status_code=400, detail=f"Plan must be one of {valid}")

    prev_plan = user.plan
    user.plan = body.plan
    user.pending_plan = None
    user.payoneer_link = None

    # Create/update subscription record for paid plans
    if body.plan in ("starter", "pro"):
        period_end = datetime.now(timezone.utc) + timedelta(days=31)
        q2 = await db.execute(
            select(Subscription).where(Subscription.user_id == user.id)
            .order_by(Subscription.updated_at.desc())
            .limit(1)
        )
        sub = q2.scalars().first()
        if sub:
            sub.status = "active"
            sub.current_period_end = period_end
        else:
            db.add(Subscription(
                id=str(uuid.uuid4()),
                user_id=user.id,
                payment_token=f"manual-{uuid.uuid4().hex[:8]}",
                status="active",
                current_period_end=period_end,
            ))

    await db.commit()

    if user.email and body.plan in ("starter", "pro") and prev_plan != body.plan:
        send_subscription_confirmed(user.email, body.plan)

    return {"ok": True, "plan": body.plan}


@router.post("/admin/users/{user_id}/send-payment-link")
async def admin_send_payment_link(
    user_id: str,
    body: SendPaymentLinkRequest,
    _: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(select(User).where(User.id == user_id))
    user = q.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.email:
        raise HTTPException(status_code=400, detail="User has no email address.")

    user.payoneer_link = body.payment_link
    await db.commit()

    send_payment_link(
        to=user.email,
        plan=body.plan,
        payment_link=body.payment_link,
    )
    return {"ok": True}

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
    send_admin_reply(msg.email, msg.subject, body.reply_text)
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
    row = (await db.execute(
        select(
            func.count(case((User.plan == "starter", 1))).label("starter"),
            func.count(case((User.plan == "pro", 1))).label("pro"),
        )
    )).one()
    active = (await db.execute(
        select(func.count(Subscription.id)).where(Subscription.status == "active")
    )).scalar() or 0
    mrr = (row.starter * 29.0) + (row.pro * 49.0)
    return RevenueOut(
        starter_count=row.starter,
        pro_count=row.pro,
        estimated_mrr=mrr,
        total_active_subscriptions=active,
    )
