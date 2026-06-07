import asyncio
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.schemas import TranscribeRequest, TranscribeResponse, JobStatus
from services.job_service import job_service
from services.usage_service import record_usage, check_transcription_quota_or_raise
from config import settings
from utils.logger import get_logger
from db.session import AsyncSessionLocal, get_db
from db.models import User
from auth.dependencies import current_user

router = APIRouter()
logger = get_logger(__name__)

# Retry config for transient OpenAI failures (rate limit / 503)
_MAX_RETRIES = 3
_RETRY_DELAYS = [30, 60, 120]   # seconds between attempts
_RETRYABLE_PHRASES = ("rate limit", "429", "503", "service unavailable", "overloaded")


def _get_storage():
    if settings.STORAGE_BACKEND == "s3":
        from core.storage.s3 import get_s3_storage
        return get_s3_storage()
    from core.storage.local import storage
    return storage


def _get_transcriber():
    if settings.TRANSCRIPTION_BACKEND == "faster_whisper":
        from core.transcription.faster_whisper import FasterWhisperTranscriber
        return FasterWhisperTranscriber()
    elif settings.TRANSCRIPTION_BACKEND == "openai_api":
        from core.transcription.openai_whisper import OpenAIWhisperTranscriber
        return OpenAIWhisperTranscriber()
    else:
        raise ValueError(f"Unknown transcription backend: {settings.TRANSCRIPTION_BACKEND}")


def _is_retryable(error: str) -> bool:
    low = error.lower()
    return any(phrase in low for phrase in _RETRYABLE_PHRASES)


async def _run_transcription(job_id: str):
    """
    Background task: transcribe audio and update job status.

    Retries up to _MAX_RETRIES times on transient OpenAI errors (rate limits,
    503s) before marking the job as failed.  Audio temp files from S3 downloads
    are always cleaned up, even on failure.
    """
    job = await job_service.get_job(job_id)
    if not job:
        logger.error("transcription_job_not_found", job_id=job_id)
        return

    job.set_status(JobStatus.PROCESSING)
    storage = _get_storage()
    tmp_path: Path | None = None

    for attempt in range(_MAX_RETRIES + 1):
        try:
            if attempt > 0:
                delay = _RETRY_DELAYS[attempt - 1]
                logger.info("transcription_retry", job_id=job_id, attempt=attempt, delay=delay)
                await asyncio.sleep(delay)

            # Fetch audio — S3 returns a temp path, local returns the real path
            audio_path = await storage.get_path(job_id, job.audio_filename)
            is_tmp = getattr(storage, "creates_temp_files", False)
            if is_tmp:
                tmp_path = audio_path

            transcriber = _get_transcriber()
            result = await transcriber.transcribe(audio_path, job_id)

            job.transcription = result
            job.audio_duration = result.duration_seconds
            job.set_status(JobStatus.COMPLETED)

            logger.info(
                "transcription_complete",
                job_id=job_id,
                words=len(result.words),
                duration=result.duration_seconds,
                attempts=attempt + 1,
            )

            # Record usage in DB
            if job.user_id:
                try:
                    async with AsyncSessionLocal() as db:
                        await record_usage(
                            user_id=job.user_id,
                            job_id=job_id,
                            seconds=float(result.duration_seconds or 0.0),
                            db=db,
                        )
                        user_q = await db.execute(select(User).where(User.id == job.user_id))
                        user = user_q.scalar_one_or_none()
                        if user is not None and (user.plan or "free_trial") == "free_trial":
                            minutes = float(result.duration_seconds or 0.0) / 60.0
                            user.trial_minutes_used = int(
                                (user.trial_minutes_used or 0) + round(minutes)
                            )
                            await db.commit()
                except Exception as e:
                    logger.warning("usage_record_failed", job_id=job_id, error=str(e))

            return  # success — exit retry loop

        except Exception as e:
            error_str = str(e)

            if _is_retryable(error_str) and attempt < _MAX_RETRIES:
                logger.warning(
                    "transcription_retryable_error",
                    job_id=job_id,
                    attempt=attempt + 1,
                    error=error_str,
                )
                continue  # retry

            # Non-retryable or out of retries
            logger.error(
                "transcription_failed",
                job_id=job_id,
                attempts=attempt + 1,
                error=error_str,
            )
            job.set_status(JobStatus.FAILED, error=error_str)
            return

        finally:
            # Always clean up the S3 temp file
            if tmp_path and tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
                tmp_path = None


@router.post(
    "/transcribe",
    response_model=TranscribeResponse,
    summary="Start transcription",
    description="Transcribe an uploaded audio file. Processing happens in background."
)
async def start_transcription(
    request: TranscribeRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await job_service.get_job(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {request.job_id}")

    if not job.audio_path:
        raise HTTPException(
            status_code=400,
            detail="No audio file associated with this job. Upload audio first."
        )

    if job.status == JobStatus.COMPLETED and job.transcription:
        return TranscribeResponse(
            job_id=job.job_id,
            status=job.status,
            result=job.transcription
        )

    if job.status == JobStatus.PROCESSING:
        return TranscribeResponse(job_id=job.job_id, status=job.status)

    await check_transcription_quota_or_raise(user, db)

    background_tasks.add_task(_run_transcription, request.job_id)

    return TranscribeResponse(job_id=job.job_id, status=JobStatus.PROCESSING)


@router.get(
    "/transcribe/{job_id}",
    response_model=TranscribeResponse,
    summary="Get transcription status"
)
async def get_transcription_status(job_id: str):
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    return TranscribeResponse(
        job_id=job.job_id,
        status=job.status,
        result=job.transcription,
        error=job.error
    )
