"""
Public share endpoint — no auth required.

GET /api/share/{token}  → returns a sanitised ComparisonResult by AnalysisResult.id
"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AnalysisResult
from db.session import get_db
from models.schemas import SharedResultResponse, ComparisonResult

router = APIRouter()


@router.get(
    "/share/{token}",
    response_model=SharedResultResponse,
    summary="Fetch a publicly shared analysis result (no auth)",
)
async def get_shared_result(token: str, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(AnalysisResult).where(AnalysisResult.id == token))
    row = q.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Result not found or link expired.")

    result_obj: Optional[ComparisonResult] = None
    if row.result_json:
        try:
            result_obj = ComparisonResult.model_validate_json(row.result_json)
        except Exception:
            pass

    return SharedResultResponse(
        accuracy_percentage=row.accuracy_percentage,
        total_words=row.total_words,
        correct_words=row.correct_words,
        audio_duration=row.audio_duration,
        script_snippet=row.script_snippet,
        result=result_obj,
        created_at=row.created_at.isoformat(),
    )
