import asyncio
import subprocess
import tempfile
import httpx
from pathlib import Path
from models.schemas import TranscriptionResult, TranscribedWord
from core.transcription.base import BaseTranscriber
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# 3GPP / AMR / Samsung voice memo brands that need transcoding before OpenAI
_NON_OPENAI_BRANDS = {"3gp4", "3gp ", "3g2 ", "3gp2", "amr ", "isom"}


def _needs_transcode(audio_path: Path) -> bool:
    """Return True if the file is a container OpenAI doesn't natively accept (e.g. 3GP)."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(audio_path)],
            capture_output=True, text=True, timeout=10,
        )
        import json
        tags = json.loads(result.stdout).get("format", {}).get("tags", {})
        brand = tags.get("major_brand", "").strip().lower()
        return brand in _NON_OPENAI_BRANDS
    except Exception:
        return False


def _transcode_to_mp3(audio_path: Path) -> Path:
    """Convert audio to MP3 in a temp file. Returns the temp Path."""
    tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    tmp.close()
    out = Path(tmp.name)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(audio_path), "-vn", "-ar", "16000",
         "-ac", "1", "-b:a", "64k", str(out)],
        capture_output=True, check=True, timeout=120,
    )
    return out


class OpenAIWhisperTranscriber(BaseTranscriber):
    """
    OpenAI Whisper API transcription.

    Cost: $0.006 per minute of audio
    Handles 3GP / Samsung voice memos by transcoding to MP3 via ffmpeg first.
    """

    API_URL = "https://api.openai.com/v1/audio/transcriptions"

    _MIME_MAP = {
        ".mp3": "audio/mpeg",
        ".mp4": "audio/mp4",
        ".m4a": "audio/mp4",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".oga": "audio/ogg",
        ".flac": "audio/flac",
        ".webm": "audio/webm",
        ".mpeg": "audio/mpeg",
        ".mpga": "audio/mpeg",
    }

    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY not set. "
                "Either set it in .env or switch to TRANSCRIPTION_BACKEND=faster_whisper"
            )
        self.api_key = settings.OPENAI_API_KEY

    async def transcribe(self, audio_path: Path, job_id: str) -> TranscriptionResult:
        logger.info("openai_transcription_started", job_id=job_id, audio_path=str(audio_path))

        # Transcode 3GP/AMR files that OpenAI rejects regardless of extension
        send_path = audio_path
        transcoded: Path | None = None
        if _needs_transcode(audio_path):
            logger.info("transcoding_to_mp3", job_id=job_id, original=str(audio_path))
            transcoded = _transcode_to_mp3(audio_path)
            send_path = transcoded

        try:
            with open(send_path, "rb") as f:
                audio_data = f.read()

            file_size_mb = len(audio_data) / 1024 / 1024
            logger.info("openai_sending_file", job_id=job_id, size_mb=round(file_size_mb, 2))

            # OpenAI hard limit is 25MB. Auto-transcode to compressed MP3 rather than failing.
            if file_size_mb > 25:
                logger.info("file_exceeds_openai_limit_transcoding", job_id=job_id, size_mb=round(file_size_mb, 2))
                compressed = _transcode_to_mp3(send_path)
                if transcoded:
                    transcoded.unlink(missing_ok=True)
                transcoded = compressed
                send_path = compressed
                with open(send_path, "rb") as f:
                    audio_data = f.read()
                file_size_mb = len(audio_data) / 1024 / 1024
                logger.info("transcoded_size", job_id=job_id, size_mb=round(file_size_mb, 2))
                if file_size_mb > 25:
                    raise ValueError(
                        f"Audio too large even after compression ({file_size_mb:.1f}MB). Max is 25MB."
                    )

            mime = self._MIME_MAP.get(send_path.suffix.lower(), "audio/mpeg")

            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    self.API_URL,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    files={"file": (send_path.name, audio_data, mime)},
                    data={
                        "model": "whisper-1",
                        "response_format": "verbose_json",
                        "timestamp_granularities[]": "word",
                    },
                )

                if response.status_code != 200:
                    error_detail = response.json().get("error", {}).get("message", "Unknown error")
                    raise RuntimeError(f"OpenAI API error: {error_detail}")

                data = response.json()

        finally:
            if transcoded and transcoded.exists():
                transcoded.unlink(missing_ok=True)

        words: list[TranscribedWord] = []
        if "words" in data:
            for w in data["words"]:
                words.append(TranscribedWord(
                    word=w["word"].strip(),
                    start=round(w["start"], 3),
                    end=round(w["end"], 3),
                    confidence=1.0,
                ))
        else:
            logger.warning("openai_no_word_timestamps", job_id=job_id)

        duration = data.get("duration", 0.0)
        logger.info("openai_transcription_completed", job_id=job_id, word_count=len(words), duration=duration)

        return TranscriptionResult(
            job_id=job_id,
            words=words,
            full_text=data.get("text", ""),
            duration_seconds=float(duration),
            language=data.get("language", "en"),
            model_used="openai-whisper-1",
        )

    def is_available(self) -> bool:
        return bool(settings.OPENAI_API_KEY)
