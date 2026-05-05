from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO

class BaseStorage(ABC):
    """
    Abstract storage interface.
    Implement this for local disk, S3, GCS, etc.
    Swap backends without changing business logic.
    """

    @abstractmethod
    async def save(self, file_obj: BinaryIO, filename: str, job_id: str) -> str:
        """Save file and return its storage path/key."""
        pass

    @abstractmethod
    async def get_path(self, job_id: str, filename: str) -> Path:
        """Get the local filesystem path for a stored file."""
        pass

    @abstractmethod
    async def delete(self, job_id: str, filename: str) -> bool:
        """Delete a stored file. Returns True if deleted."""
        pass

    @abstractmethod
    async def exists(self, job_id: str, filename: str) -> bool:
        """Check if a file exists in storage."""
        pass
