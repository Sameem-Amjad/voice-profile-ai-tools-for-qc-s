"""
S3 storage backend — production replacement for LocalStorage.

Upload flow (presigned):
  1. Frontend calls POST /api/upload/presign  → gets { upload_url, job_id, s3_key }
  2. Frontend PUTs the file directly to S3    → no server, no proxy, no timeout
  3. Frontend calls POST /api/upload/confirm  → backend validates + marks job ready

Transcription flow:
  get_path() downloads the S3 object to a temp file so the rest of the pipeline
  (ffprobe validation, OpenAI upload) works unchanged.  The temp file is cleaned
  up by the caller after transcription completes.
"""

import tempfile
from pathlib import Path
from typing import BinaryIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from config import settings
from core.storage.base import BaseStorage
from utils.logger import get_logger

logger = get_logger(__name__)

_MIME_MAP = {
    ".mp3":  "audio/mpeg",
    ".wav":  "audio/wav",
    ".m4a":  "audio/mp4",
    ".ogg":  "audio/ogg",
    ".flac": "audio/flac",
    ".webm": "audio/webm",
}


class S3Storage(BaseStorage):
    """
    Production S3 storage.

    Files are stored under uploads/{job_id}/{filename} in the configured bucket.
    S3 lifecycle rules (configured separately) expire objects after 24 h.
    """

    creates_temp_files = True  # get_path() returns a tmp path — callers must unlink

    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
                config=Config(signature_version="s3v4"),
            )
        return self._client

    def _key(self, job_id: str, filename: str) -> str:
        return f"uploads/{job_id}/{filename}"

    # ── Presigned upload ──────────────────────────────────────────────────────

    def presign_upload(self, job_id: str, filename: str) -> dict:
        """
        Return a presigned PUT URL the browser can use to upload directly to S3.
        No audio bytes ever touch the FastAPI server.
        """
        ext = Path(filename).suffix.lower()
        content_type = _MIME_MAP.get(ext, "application/octet-stream")
        key = self._key(job_id, filename)

        upload_url = self.client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=settings.S3_PRESIGN_EXPIRY,
        )
        logger.info("presign_generated", job_id=job_id, key=key)
        return {
            "upload_url": upload_url,
            "s3_key": key,
            "content_type": content_type,
            "expires_in": settings.S3_PRESIGN_EXPIRY,
        }

    # ── BaseStorage interface ─────────────────────────────────────────────────

    async def save(self, file_obj: BinaryIO, filename: str, job_id: str) -> str:
        """Stream upload to S3. Returns the S3 key (used as the 'path')."""
        key = self._key(job_id, filename)
        self.client.upload_fileobj(file_obj, settings.S3_BUCKET, key)
        logger.info("s3_upload_complete", job_id=job_id, key=key)
        return key

    async def get_path(self, job_id: str, filename: str) -> Path:
        """
        Download S3 object to a temp file and return the local path.
        Caller is responsible for unlinking the temp file after use.
        """
        key = self._key(job_id, filename)
        suffix = Path(filename).suffix
        tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
        tmp.close()
        tmp_path = Path(tmp.name)

        try:
            self.client.download_file(settings.S3_BUCKET, key, str(tmp_path))
        except ClientError as e:
            tmp_path.unlink(missing_ok=True)
            raise FileNotFoundError(
                f"S3 object not found: {key}"
            ) from e

        logger.info("s3_downloaded_to_tmp", job_id=job_id, key=key, tmp=str(tmp_path))
        return tmp_path

    async def delete(self, job_id: str, filename: str) -> bool:
        try:
            key = self._key(job_id, filename)
            self.client.delete_object(Bucket=settings.S3_BUCKET, Key=key)
            logger.info("s3_deleted", key=key)
            return True
        except ClientError as e:
            logger.warning("s3_delete_failed", job_id=job_id, error=str(e))
            return False

    async def exists(self, job_id: str, filename: str) -> bool:
        try:
            key = self._key(job_id, filename)
            self.client.head_object(Bucket=settings.S3_BUCKET, Key=key)
            return True
        except ClientError:
            return False

    def delete_key(self, s3_key: str) -> bool:
        """Delete an arbitrary S3 key (used by background cleanup)."""
        try:
            self.client.delete_object(Bucket=settings.S3_BUCKET, Key=s3_key)
            return True
        except ClientError as e:
            logger.warning("s3_delete_key_failed", key=s3_key, error=str(e))
            return False

    def list_upload_keys_older_than(self, hours: int) -> list[str]:
        """
        List all keys under uploads/ that haven't been modified in `hours` hours.
        Used by the background cleanup job.
        """
        from datetime import datetime, timezone, timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        keys = []
        paginator = self.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=settings.S3_BUCKET, Prefix="uploads/"):
            for obj in page.get("Contents", []):
                if obj["LastModified"] < cutoff:
                    keys.append(obj["Key"])
        return keys


# Singleton — created lazily so missing credentials don't crash startup
_s3_storage: S3Storage | None = None


def get_s3_storage() -> S3Storage:
    global _s3_storage
    if _s3_storage is None:
        _s3_storage = S3Storage()
    return _s3_storage
