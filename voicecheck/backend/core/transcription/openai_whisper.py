import asyncio
import httpx
from pathlib import Path
from models.schemas import TranscriptionResult, TranscribedWord
from core.transcription.base import BaseTranscriber
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class OpenAIWhisperTranscriber(BaseTranscriber):
    """
    OpenAI Whisper API transcription.

    Cost: $0.006 per minute of audio
    Example: 10 min audio = $0.06 — cheap for dev/testing

    Requires OPENAI_API_KEY in .env

    Pros: No local compute needed, always latest model
    Cons: Costs money, requires internet, data leaves your machine
    """

    API_URL = "https://api.openai.com/v1/audio/transcriptions"

    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY not set. "
                "Either set it in .env or switch to TRANSCRIPTION_BACKEND=faster_whisper"
            )
        self.api_key = settings.OPENAI_API_KEY

    async def transcribe(self, audio_path: Path, job_id: str) -> TranscriptionResult:
        logger.info(
            "openai_transcription_started",
            job_id=job_id,
            audio_path=str(audio_path)
        )

        # Read file
        with open(audio_path, "rb") as f:
            audio_data = f.read()

        file_size_mb = len(audio_data) / 1024 / 1024
        logger.info("openai_sending_file", job_id=job_id, size_mb=round(file_size_mb, 2))

        # Note: OpenAI has 25MB file limit
        if file_size_mb > 25:
            raise ValueError(
                f"File too large for OpenAI API ({file_size_mb:.1f}MB). "
                "Max is 25MB. Use faster-whisper for larger files."
            )

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                self.API_URL,
                headers={"Authorization": f"Bearer {self.api_key}"},
                files={"file": (audio_path.name, audio_data, "audio/mpeg")},
                data={
                    "model": "whisper-1",
                    "response_format": "verbose_json",
                    "timestamp_granularities[]": "word",  # Request word timestamps
                }
            )

            if response.status_code != 200:
                error_detail = response.json().get("error", {}).get("message", "Unknown error")
                raise RuntimeError(f"OpenAI API error: {error_detail}")

            data = response.json()

        # Parse OpenAI response format
        words: list[TranscribedWord] = []

        if "words" in data:
            for w in data["words"]:
                words.append(TranscribedWord(
                    word=w["word"].strip(),
                    start=round(w["start"], 3),
                    end=round(w["end"], 3),
                    confidence=1.0  # OpenAI doesn't return per-word confidence
                ))
        else:
            logger.warning("openai_no_word_timestamps", job_id=job_id)

        duration = data.get("duration", 0.0)

        logger.info(
            "openai_transcription_completed",
            job_id=job_id,
            word_count=len(words),
            duration=duration
        )

        return TranscriptionResult(
            job_id=job_id,
            words=words,
            full_text=data.get("text", ""),
            duration_seconds=float(duration),
            language=data.get("language", "en"),
            model_used="openai-whisper-1"
        )

    def is_available(self) -> bool:
        return bool(settings.OPENAI_API_KEY)
