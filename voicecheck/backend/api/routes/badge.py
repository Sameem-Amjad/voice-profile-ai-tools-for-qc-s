"""
Score badge endpoint — returns an SVG badge voice actors can embed on portfolios.

GET /api/badge/{user_id}  → SVG, no auth required (public)
"""

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AnalysisResult
from db.session import get_db

router = APIRouter()


def _badge_svg(avg_pct: float | None, count: int) -> str:
    score = f"{avg_pct:.1f}%" if avg_pct is not None else "—"
    color = (
        "#22c55e" if avg_pct is not None and avg_pct >= 90
        else "#eab308" if avg_pct is not None and avg_pct >= 70
        else "#ef4444" if avg_pct is not None
        else "#94a3b8"
    )
    label = "SoundProof score"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="200" height="28">
  <linearGradient id="bg" x2="0" y2="100%">
    <stop offset="0" stop-color="#1e293b" stop-opacity=".9"/>
    <stop offset="1" stop-color="#1e293b" stop-opacity="1"/>
  </linearGradient>
  <rect rx="4" width="200" height="28" fill="url(#bg)"/>
  <rect rx="4" x="136" width="64" height="28" fill="{color}"/>
  <text x="8" y="19" font-family="DejaVu Sans,Verdana,Geneva,sans-serif"
        font-size="11" fill="#e2e8f0">{label}</text>
  <text x="168" y="19" font-family="DejaVu Sans,Verdana,Geneva,sans-serif"
        font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">{score}</text>
</svg>"""


@router.get(
    "/badge/{user_id}",
    summary="SVG accuracy badge for a user's portfolio (no auth)",
    response_class=Response,
)
async def get_score_badge(user_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(func.avg(AnalysisResult.accuracy_percentage), func.count(AnalysisResult.id)).where(
        AnalysisResult.user_id == user_id
    )
    result = await db.execute(stmt)
    row = result.one()
    avg_pct, count = row[0], row[1]

    svg = _badge_svg(float(avg_pct) if avg_pct is not None else None, count)
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={"Cache-Control": "max-age=3600", "Access-Control-Allow-Origin": "*"},
    )
