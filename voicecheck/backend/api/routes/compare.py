from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Optional
from models.schemas import CompareRequest, CompareResponse, CompareTakesRequest, CompareTakesResponse, TakeResult, JobStatus
from services.job_service import job_service
from core.alignment.engine import alignment_engine
from auth.dependencies import current_user
from db.models import User, AnalysisResult
from db.session import get_db, AsyncSessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
from services.usage_service import check_analysis_quota_or_raise
from utils.logger import get_logger
import asyncio

router = APIRouter()
logger = get_logger(__name__)


async def _run_comparison(job_id: str, script_text: str, user_id: Optional[str] = None):
    """Background task: run alignment comparison."""
    job = await job_service.get_job(job_id)
    if not job:
        return

    try:
        job.set_status(JobStatus.PROCESSING)

        result = alignment_engine.compare(
            transcription=job.transcription,
            script_text=script_text,
        )

        job.comparison = result
        job.set_status(JobStatus.COMPLETED)

        # Auto-save result to history
        if user_id:
            try:
                async with AsyncSessionLocal() as db:
                    snippet = script_text[:150].strip()
                    row = AnalysisResult(
                        user_id=user_id,
                        job_id=job_id,
                        accuracy_percentage=round(result.stats.accuracy_percentage, 1),
                        total_words=result.stats.total_script_words,
                        correct_words=result.stats.correct_words,
                        script_snippet=snippet,
                        audio_duration=result.audio_duration,
                        result_json=result.model_dump_json(),
                    )
                    db.add(row)
                    await db.commit()
                    await db.refresh(row)
                    job.analysis_id = row.id
            except Exception as e:
                logger.warning("history_save_failed", job_id=job_id, error=str(e))

        logger.info(
            "comparison_complete",
            job_id=job_id,
            accuracy=result.stats.accuracy_percentage
        )

    except Exception as e:
        logger.error("comparison_failed", job_id=job_id, error=str(e))
        job.set_status(JobStatus.FAILED, error=str(e))


@router.post(
    "/compare",
    response_model=CompareResponse,
    summary="Compare transcript with script"
)
async def compare_with_script(
    request: CompareRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await job_service.get_job(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {request.job_id}")

    if not job.transcription:
        raise HTTPException(
            status_code=400,
            detail="Transcription not completed. Run /transcribe first."
        )

    if job.transcription.words == []:
        raise HTTPException(
            status_code=422,
            detail="Transcription produced no words. Check audio quality."
        )

    # Return cached result if available
    if job.comparison and job.status == JobStatus.COMPLETED:
        return CompareResponse(
            job_id=job.job_id,
            status=job.status,
            result=job.comparison,
            analysis_id=job.analysis_id,
        )

    # Check monthly analysis quota for free tier (before burning API credits)
    await check_analysis_quota_or_raise(user, db)

    background_tasks.add_task(_run_comparison, request.job_id, request.script_text, user.id)

    return CompareResponse(
        job_id=job.job_id,
        status=JobStatus.PROCESSING
    )


@router.get("/compare/{job_id}", response_model=CompareResponse)
async def get_comparison_status(job_id: str):
    """Poll for comparison results."""
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    return CompareResponse(
        job_id=job.job_id,
        status=job.status,
        result=job.comparison,
        error=job.error,
        analysis_id=job.analysis_id,
    )


@router.post(
    "/compare-takes",
    response_model=CompareTakesResponse,
    summary="Compare multiple takes against the same script and rank by accuracy",
)
async def compare_takes(
    request: CompareTakesRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Compare 2–5 takes of the same script. Returns them ranked by accuracy.
    Requires a Pro or Team plan.
    """
    plan = (user.plan or "free_trial").lower()
    if plan not in {"pro", "team"}:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "plan_required",
                "message": "Multiple takes comparison requires a Pro or Team plan.",
            },
        )

    jobs = []
    for jid in request.job_ids:
        job = await job_service.get_job(jid)
        if not job:
            raise HTTPException(status_code=404, detail=f"Job not found: {jid}")
        if not job.transcription:
            raise HTTPException(status_code=400, detail=f"Job {jid} has no transcription yet.")
        jobs.append(job)

    # Run all comparisons (fast — alignment only, transcription already done)
    async def _compare_one(job):
        result = alignment_engine.compare(
            transcription=job.transcription,
            script_text=request.script_text,
        )
        # Save to history
        try:
            async with AsyncSessionLocal() as db2:
                row = AnalysisResult(
                    user_id=user.id,
                    job_id=job.job_id,
                    accuracy_percentage=round(result.stats.accuracy_percentage, 1),
                    total_words=result.stats.total_script_words,
                    correct_words=result.stats.correct_words,
                    script_snippet=request.script_text[:150].strip(),
                    audio_duration=result.audio_duration,
                    result_json=result.model_dump_json(),
                )
                db2.add(row)
                await db2.commit()
                await db2.refresh(row)
                return result, row.id
        except Exception as e:
            logger.warning("takes_history_save_failed", job_id=job.job_id, error=str(e))
            return result, None

    results = await asyncio.gather(*[_compare_one(j) for j in jobs])

    # Sort by accuracy descending
    ranked = sorted(
        zip(jobs, results),
        key=lambda x: x[1][0].stats.accuracy_percentage,
        reverse=True,
    )

    takes = []
    for rank, (job, (result, analysis_id)) in enumerate(ranked, start=1):
        takes.append(TakeResult(
            job_id=job.job_id,
            rank=rank,
            accuracy_percentage=round(result.stats.accuracy_percentage, 1),
            stats=result.stats,
            aligned_words=result.aligned_words,
            audio_duration=result.audio_duration,
            analysis_id=analysis_id,
        ))

    return CompareTakesResponse(
        takes=takes,
        best_job_id=ranked[0][0].job_id,
    )
