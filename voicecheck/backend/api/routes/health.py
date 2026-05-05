from fastapi import APIRouter
from models.schemas import HealthResponse
from config import settings
from services.job_service import job_service

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint. Use for monitoring and readiness checks."""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        transcription_backend=settings.TRANSCRIPTION_BACKEND,
        whisper_model=settings.WHISPER_MODEL_SIZE,
    )
