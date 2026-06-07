import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from models.schemas import JobStatus, TranscriptionResult, ComparisonResult
from utils.logger import get_logger

logger = get_logger(__name__)

class Job:
    """Represents a processing job in the system."""

    def __init__(self, job_id: str, user_id: Optional[str] = None):
        self.job_id = job_id
        self.user_id: Optional[str] = user_id
        self.status = JobStatus.PENDING
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.audio_filename: Optional[str] = None
        self.audio_path: Optional[str] = None
        self.file_size_bytes: int = 0
        self.audio_duration: Optional[float] = None
        self.transcription: Optional[TranscriptionResult] = None
        self.comparison: Optional[ComparisonResult] = None
        self.error: Optional[str] = None
        self.analysis_id: Optional[str] = None

    def set_status(self, status: JobStatus, error: str = None):
        self.status = status
        self.updated_at = datetime.utcnow()
        if error:
            self.error = error

    def is_expired(self, timeout_seconds: int = 600) -> bool:
        return datetime.utcnow() > self.created_at + timedelta(seconds=timeout_seconds)

    def to_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "audio_filename": self.audio_filename,
            "audio_duration": self.audio_duration,
            "error": self.error,
        }


class JobService:
    """
    In-memory job store for MVP.

    Production replacement: Redis with TTL, or a DB like PostgreSQL.

    For MVP: simple dict is fine.
    - Survives the request lifecycle
    - Doesn't survive server restarts (acceptable for MVP)
    - Zero infrastructure cost
    """

    def __init__(self):
        self._jobs: dict[str, Job] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, user_id: Optional[str] = None) -> Job:
        """Create and register a new job, optionally tagged with a user_id."""
        job_id = str(uuid.uuid4())
        job = Job(job_id, user_id=user_id)

        async with self._lock:
            self._jobs[job_id] = job

        logger.info("job_created", job_id=job_id, user_id=user_id)
        return job

    async def get_job(self, job_id: str) -> Optional[Job]:
        """Get job by ID. Returns None if not found."""
        return self._jobs.get(job_id)

    async def require_job(self, job_id: str) -> Job:
        """Get job by ID. Raises ValueError if not found."""
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"Job not found: {job_id}")
        return job

    async def get_expired_job_ids(self) -> list[str]:
        """Return IDs of all expired jobs without removing them yet."""
        async with self._lock:
            return [
                job_id for job_id, job in self._jobs.items()
                if job.is_expired()
            ]

    async def cleanup_expired(self):
        """Remove expired jobs from memory. Returns count removed."""
        async with self._lock:
            expired = [
                job_id for job_id, job in self._jobs.items()
                if job.is_expired()
            ]
            for job_id in expired:
                del self._jobs[job_id]
                logger.info("job_expired_cleaned", job_id=job_id)

        return len(expired)

    def active_job_count(self) -> int:
        return len(self._jobs)

# Singleton
job_service = JobService()
