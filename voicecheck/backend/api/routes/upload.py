from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from models.schemas import (
    UploadResponse, ErrorResponse,
    PresignRequest, PresignResponse, ConfirmUploadRequest,
)
from core.storage.local import storage as local_storage
from core.limiter import limiter
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


def _get_storage():
    if settings.STORAGE_BACKEND == "s3":
        from core.storage.s3 import get_s3_storage
        return get_s3_storage()
    return local_storage


# ── Original multipart upload (local dev + fallback) ─────────────────────────

@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload audio file (multipart)",
    description="Direct multipart upload. Works for local dev. Use /upload/presign in production."
)
@limiter.limit("10/minute")
async def upload_audio(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. "
                   f"Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )

    job = await job_service.create_job(user_id=user.id)

    try:
        safe_filename = f"audio{file_ext}"
        storage = _get_storage()
        file_path_str = await storage.save(
            file_obj=file.file,
            filename=safe_filename,
            job_id=job.job_id
        )

        file_path = Path(file_path_str) if settings.STORAGE_BACKEND == "local" else None

        if file_path:
            try:
                audio_meta = validate_audio_file(file_path)
            except ValueError as e:
                await storage.delete(job.job_id, safe_filename)
                raise HTTPException(status_code=422, detail=str(e))
            await check_quota_or_raise(user, db, audio_meta.get("duration") or 0.0)
            job.audio_filename = safe_filename
            job.audio_path = file_path_str
            job.file_size_bytes = audio_meta["size_bytes"]
            job.audio_duration = audio_meta.get("duration")
        else:
            # S3 path — size only, duration validated at confirm step
            job.audio_filename = safe_filename
            job.audio_path = file_path_str

        logger.info("upload_complete", job_id=job.job_id, user_id=user.id)

        return UploadResponse(
            job_id=job.job_id,
            file_path=file_path_str,
            file_size_bytes=job.file_size_bytes or 0,
            duration_seconds=job.audio_duration,
            message="File uploaded successfully. Use job_id to transcribe."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("upload_failed", job_id=job.job_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ── S3 presigned upload flow (production) ────────────────────────────────────

@router.post(
    "/upload/presign",
    response_model=PresignResponse,
    summary="Get a presigned S3 URL for direct browser upload",
    description=(
        "Step 1 of the S3 upload flow. Returns a presigned PUT URL. "
        "The browser PUTs the file directly to S3 — no bytes touch this server. "
        "Then call POST /upload/confirm with the returned job_id."
    ),
)
@limiter.limit("10/minute")
async def presign_upload(
    body: PresignRequest,
    request: Request,
    user: User = Depends(current_user),
):
    if settings.STORAGE_BACKEND != "s3":
        raise HTTPException(
            status_code=400,
            detail="Presigned uploads require STORAGE_BACKEND=s3. Use POST /upload for local storage."
        )

    file_ext = Path(body.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. "
                   f"Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if body.file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB."
        )

    job = await job_service.create_job(user_id=user.id)
    safe_filename = f"audio{file_ext}"

    from core.storage.s3 import get_s3_storage
    s3 = get_s3_storage()
    presign = s3.presign_upload(job.job_id, safe_filename)

    # Mark filename so confirm step knows what to look for
    job.audio_filename = safe_filename

    logger.info("presign_issued", job_id=job.job_id, user_id=user.id, filename=body.filename)

    return PresignResponse(
        job_id=job.job_id,
        upload_url=presign["upload_url"],
        s3_key=presign["s3_key"],
        content_type=presign["content_type"],
        expires_in=presign["expires_in"],
    )


@router.post(
    "/upload/confirm",
    response_model=UploadResponse,
    summary="Confirm S3 upload and validate the audio file",
    description=(
        "Step 2 of the S3 upload flow. Call this after the browser has PUT the file "
        "to S3. The server downloads the file, validates it with ffprobe, enforces "
        "quota, and marks the job ready for transcription."
    ),
)
async def confirm_upload(
    body: ConfirmUploadRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if settings.STORAGE_BACKEND != "s3":
        raise HTTPException(status_code=400, detail="Only valid when STORAGE_BACKEND=s3.")

    job = await job_service.get_job(body.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {body.job_id}")
    if job.user_id != user.id:
        raise HTTPException(status_code=403, detail="Job does not belong to this user.")

    from core.storage.s3 import get_s3_storage
    s3 = get_s3_storage()

    if not await s3.exists(job.job_id, job.audio_filename):
        raise HTTPException(
            status_code=422,
            detail="Audio file not found in S3. Ensure the upload completed before calling confirm."
        )

    # Download to temp for validation
    tmp_path = await s3.get_path(job.job_id, job.audio_filename)
    try:
        try:
            audio_meta = validate_audio_file(tmp_path)
        except ValueError as e:
            await s3.delete(job.job_id, job.audio_filename)
            raise HTTPException(status_code=422, detail=str(e))

        await check_quota_or_raise(user, db, audio_meta.get("duration") or 0.0)

        job.audio_path = body.s3_key
        job.file_size_bytes = audio_meta["size_bytes"]
        job.audio_duration = audio_meta.get("duration")

        logger.info(
            "upload_confirmed",
            job_id=job.job_id,
            user_id=user.id,
            duration=audio_meta.get("duration"),
        )

        return UploadResponse(
            job_id=job.job_id,
            file_path=body.s3_key,
            file_size_bytes=audio_meta["size_bytes"],
            duration_seconds=audio_meta.get("duration"),
            message="File confirmed. Use job_id to transcribe."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("confirm_failed", job_id=job.job_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Confirm failed: {str(e)}")
    finally:
        tmp_path.unlink(missing_ok=True)
