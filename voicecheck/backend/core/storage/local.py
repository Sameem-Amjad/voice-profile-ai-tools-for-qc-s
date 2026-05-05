import aiofiles
import aiofiles.os
from pathlib import Path
from typing import BinaryIO
from core.storage.base import BaseStorage
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class LocalStorage(BaseStorage):
    """
    Local filesystem storage.

    Files are organized as:
    uploads/{job_id}/{filename}

    This makes it trivial to:
    1. Find all files for a job
    2. Clean up after job completion
    3. Swap to S3 (same interface, different implementation)
    """

    def __init__(self, base_dir: Path = None):
        self.base_dir = base_dir or settings.UPLOAD_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _job_dir(self, job_id: str) -> Path:
        job_dir = self.base_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        return job_dir

    async def save(self, file_obj: BinaryIO, filename: str, job_id: str) -> str:
        """Save uploaded file to disk. Returns full path as string."""
        job_dir = self._job_dir(job_id)
        file_path = job_dir / filename

        total_bytes = 0
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024

        try:
            async with aiofiles.open(file_path, "wb") as f:
                # Stream in chunks to handle large files without loading all into RAM
                while chunk := file_obj.read(1024 * 1024):  # 1MB chunks
                    total_bytes += len(chunk)

                    if total_bytes > max_bytes:
                        # Clean up partial file
                        await aiofiles.os.remove(file_path)
                        raise ValueError(
                            f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB"
                        )

                    await f.write(chunk)

            logger.info(
                "file_saved",
                job_id=job_id,
                filename=filename,
                size_mb=round(total_bytes / 1024 / 1024, 2)
            )
            return str(file_path)

        except Exception as e:
            logger.error("file_save_failed", job_id=job_id, error=str(e))
            # Attempt cleanup
            if file_path.exists():
                file_path.unlink()
            raise

    async def get_path(self, job_id: str, filename: str) -> Path:
        """Return path to file. Raises FileNotFoundError if missing."""
        file_path = self.base_dir / job_id / filename
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {job_id}/{filename}")
        return file_path

    async def delete(self, job_id: str, filename: str) -> bool:
        try:
            file_path = self.base_dir / job_id / filename
            if file_path.exists():
                await aiofiles.os.remove(file_path)
                return True
            return False
        except Exception as e:
            logger.warning("file_delete_failed", job_id=job_id, error=str(e))
            return False

    async def exists(self, job_id: str, filename: str) -> bool:
        return (self.base_dir / job_id / filename).exists()

    async def get_job_files(self, job_id: str) -> list[Path]:
        """List all files for a job."""
        job_dir = self.base_dir / job_id
        if not job_dir.exists():
            return []
        return list(job_dir.iterdir())

# Singleton instance
storage = LocalStorage()
