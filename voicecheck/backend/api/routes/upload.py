from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
import uuid
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from models.schemas import UploadResponse, ErrorResponse
from core.storage.local import storage
from services.job_service import job_service
from services.usage_service import check_quota_or_raise
from utils.audio_utils import validate_audio_file
from utils.logger import get_logger
from config import settings
from auth.dependencies import current_user
from db.models import User
from db.session import get_db

router = APIRouter()
logger = get_logger(__name__)

@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload audio file",
    description="Upload an audio file for transcription. Returns a job_id to track processing."
)
async def upload_audio(
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle audio file upload.

    Steps:
    1. Validate file extension
    2. Create job (tagged with user_id)
    3. Save file to storage
    4. Validate audio metadata (duration, format)
    5. Enforce per-user quota based on plan
    6. Return job_id
    """

    # ── Validate extension before saving ─────────────────────────────────
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. "
                   f"Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )

    # ── Create job (tagged with user_id) ──────────────────────────────────
    job = await job_service.create_job(user_id=user.id)

    try:
        # ── Save file ─────────────────────────────────────────────────────
        # Keep original extension for ffmpeg compatibility
        safe_filename = f"audio{file_ext}"

        file_path_str = await storage.save(
            file_obj=file.file,
            filename=safe_filename,
            job_id=job.job_id
        )

        file_path = Path(file_path_str)

        # ── Validate audio ────────────────────────────────────────────────
        try:
            audio_meta = validate_audio_file(file_path)
        except ValueError as e:
            # Invalid audio — clean up and fail
            await storage.delete(job.job_id, safe_filename)
            raise HTTPException(status_code=422, detail=str(e))

        # ── Enforce per-user quota (after we know the duration) ───────────
        await check_quota_or_raise(user, db, audio_meta.get("duration") or 0.0)

        # ── Update job record ─────────────────────────────────────────────
        job.audio_filename = safe_filename
        job.audio_path = file_path_str
        job.file_size_bytes = audio_meta["size_bytes"]
        job.audio_duration = audio_meta.get("duration")

        logger.info(
            "upload_complete",
            job_id=job.job_id,
            user_id=user.id,
            filename=file.filename,
            duration=audio_meta.get("duration"),
        )

        return UploadResponse(
            job_id=job.job_id,
            file_path=file_path_str,
            file_size_bytes=audio_meta["size_bytes"],
            duration_seconds=audio_meta.get("duration"),
            message="File uploaded successfully. Use job_id to transcribe."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("upload_failed", job_id=job.job_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
