from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from auth.dependencies import current_user
from db.models import User, Feedback
from db.session import get_db

router = APIRouter()

class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    text: str = Field(..., min_length=10, max_length=1000)
    display_name: Optional[str] = None
    role: Optional[str] = None

class FeedbackOut(BaseModel):
    id: str
    rating: int
    text: str
    display_name: Optional[str]
    role: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

@router.get("/feedback", response_model=list[FeedbackOut])
async def get_feedback(limit: int = 12, db: AsyncSession = Depends(get_db)):
    q = await db.execute(
        select(Feedback)
        .where(Feedback.is_approved == True)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
    )
    return q.scalars().all()

@router.post("/feedback", response_model=FeedbackOut)
async def submit_feedback(
    body: FeedbackRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    fb = Feedback(
        user_id=user.id if user.clerk_user_id != "anonymous-dev-user" else None,
        rating=body.rating,
        text=body.text,
        display_name=body.display_name or (user.email.split("@")[0] if user.email else "Anonymous"),
        role=body.role,
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    return fb
