from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from auth.dependencies import current_user
from db.models import User, AnalysisResult
from db.session import get_db

router = APIRouter()

class AnalysisResultOut(BaseModel):
    id: str
    job_id: str
    accuracy_percentage: float
    total_words: int
    correct_words: int
    script_snippet: Optional[str]
    audio_duration: float
    created_at: datetime
    class Config:
        from_attributes = True

class SaveAnalysisRequest(BaseModel):
    job_id: str
    accuracy_percentage: float
    total_words: int
    correct_words: int
    script_snippet: Optional[str] = None
    audio_duration: float = 0.0

@router.get("/history", response_model=list[AnalysisResultOut])
async def get_history(
    limit: int = 20,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == user.id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(limit)
    )
    return q.scalars().all()

@router.post("/history", response_model=AnalysisResultOut)
async def save_analysis(
    body: SaveAnalysisRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    row = AnalysisResult(
        user_id=user.id,
        job_id=body.job_id,
        accuracy_percentage=body.accuracy_percentage,
        total_words=body.total_words,
        correct_words=body.correct_words,
        script_snippet=body.script_snippet,
        audio_duration=body.audio_duration,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row
