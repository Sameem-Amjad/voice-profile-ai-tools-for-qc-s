from fastapi import APIRouter, HTTPException, BackgroundTasks
from sqlalchemy import select
from models.schemas import TranscribeRequest, TranscribeResponse, JobStatus
from services.job_service import job_service
from services.usage_service import record_usage
from core.storage.local import storage
from config import settings
from utils.logger import get_logger
from pathlib import Path
from db.session import AsyncSessionLocal
from db.models import User

router = APIRouter()
logger = get_logger(__name__)

def _get_transcriber():
    """
    Factory function — returns the configured transcriber.
    Allows swapping backends via env var without code changes.
    """
    if settings.TRANSCRIPTION_BACKEND == "faster_whisper":
        from core.transcription.faster_whisper import FasterWhisperTranscriber
        return FasterWhisperTranscriber()
    elif settings.TRANSCRIPTION_BACKEND == "openai_api":
        from core.transcription.openai_whisper import OpenAIWhisperTranscriber
        return OpenAIWhisperTranscriber()
    else:
        raise ValueError(f"Unknown transcription backend: {settings.TRANSCRIPTION_BACKEND}")


async def _run_transcription(job_id: str):
    """
    Background task: run transcription and update job status.

    Runs asynchronously so the API can return immediately.
    Client polls /transcribe to check status.
    """
    job = await job_service.get_job(job_id)
    if not job:
        logger.error("transcription_job_not_found", job_id=job_id)
        return

    try:
        job.set_status(JobStatus.PROCESSING)
        logger.info("transcription_processing", job_id=job_id)

        # Get audio file path
        audio_path = await storage.get_path(
            job_id,
            job.audio_filename
        )

        # Run transcription
        transcriber = _get_transcriber()
        result = await transcriber.transcribe(audio_path, job_id)

        # Store result in job
        job.transcription = result
        job.audio_duration = result.duration_seconds
        job.set_status(JobStatus.COMPLETED)

        logger.info(
            "transcription_complete",
            job_id=job_id,
            words=len(result.words),
            duration=result.duration_seconds
        )

        # ── Record usage (Phase 2) ──────────────────────────────────────
        # Background task: open our own DB session.
        if job.user_id:
            try:
                async with AsyncSessionLocal() as db:
                    await record_usage(
                        user_id=job.user_id,
                        job_id=job_id,
                        seconds=float(result.duration_seconds or 0.0),
                        db=db,
                    )
                    # Free-trial users: also bump the cumulative trial counter
                    user_q = await db.execute(select(User).where(User.id == job.user_id))
                    user = user_q.scalar_one_or_none()
                    if user is not None and (user.plan or "free_trial") == "free_trial":
                        minutes = float(result.duration_seconds or 0.0) / 60.0
                        user.trial_minutes_used = int((user.trial_minutes_used or 0) + round(minutes))
                        await db.commit()
            except Exception as e:
                # Usage logging is best-effort — don't fail the job over it.
                logger.warning(
                    "usage_record_failed",
                    job_id=job_id,
                    user_id=job.user_id,
                    error=str(e),
                )

    except Exception as e:
        logger.error("transcription_failed", job_id=job_id, error=str(e))
        job.set_status(JobStatus.FAILED, error=str(e))


@router.post(
    "/transcribe",
    response_model=TranscribeResponse,
    summary="Start transcription",
    description="Transcribe an uploaded audio file. Processing happens in background."
)
async def start_transcription(
    request: TranscribeRequest,
    background_tasks: BackgroundTasks
):
    """
    Start transcription job.

    This endpoint returns immediately with status=processing.
    Call this endpoint again with the same job_id to get results.

    Why background tasks?
    Transcription takes 30s-3min. We can't hold the HTTP connection open.
    Background tasks run after the response is sent.
    """
    job = await job_service.get_job(request.job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {request.job_id}"
        )

    if not job.audio_path:
        raise HTTPException(
            status_code=400,
            detail="No audio file associated with this job. Upload audio first."
        )

    # If already completed, return cached result
    if job.status == JobStatus.COMPLETED and job.transcription:
        return TranscribeResponse(
            job_id=job.job_id,
            status=job.status,
            result=job.transcription
        )

    # If currently processing, return current status
    if job.status == JobStatus.PROCESSING:
        return TranscribeResponse(
            job_id=job.job_id,
            status=job.status
        )

    # Start transcription in background
    background_tasks.add_task(_run_transcription, request.job_id)

    return TranscribeResponse(
        job_id=job.job_id,
        status=JobStatus.PROCESSING
    )


@router.get(
    "/transcribe/{job_id}",
    response_model=TranscribeResponse,
    summary="Get transcription status"
)
async def get_transcription_status(job_id: str):
    """Poll this endpoint to check transcription progress."""
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    return TranscribeResponse(
        job_id=job.job_id,
        status=job.status,
        result=job.transcription,
        error=job.error
    )
