import asyncio
from pathlib import Path
from functools import lru_cache
from typing import Optional

from models.schemas import TranscriptionResult, TranscribedWord
from core.transcription.base import BaseTranscriber
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class FasterWhisperTranscriber(BaseTranscriber):
    """
    Local Whisper transcription using faster-whisper.

    Why faster-whisper over stock Whisper?
    - 4x faster on CPU
    - Lower memory usage (int8 quantization)
    - Word-level timestamps built in
    - Zero API cost
    - Works offline

    Model size guide (CPU performance):
    - tiny:   ~32x realtime, low accuracy  (~75MB RAM)
    - base:   ~16x realtime, decent        (~150MB RAM)  ← DEFAULT for dev
    - small:  ~6x realtime, good           (~480MB RAM)
    - medium: ~2x realtime, very good      (~1.5GB RAM)
    - large-v2: ~1x realtime, best         (~3GB RAM)
    """

    _model = None  # Class-level singleton — load once, reuse forever

    def __init__(self):
        self.model_size = settings.WHISPER_MODEL_SIZE
        self.device = settings.WHISPER_DEVICE
        self.compute_type = settings.WHISPER_COMPUTE_TYPE

    def _load_model(self):
        """
        Lazy load model on first use.
        First transcription will be slow (model download/load).
        All subsequent calls use the cached model.
        """
        if FasterWhisperTranscriber._model is None:
            logger.info(
                "loading_whisper_model",
                model=self.model_size,
                device=self.device,
                compute_type=self.compute_type
            )

            try:
                from faster_whisper import WhisperModel
                FasterWhisperTranscriber._model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type=self.compute_type,
                    download_root="./.whisper_models"  # Cache models locally
                )
                logger.info("whisper_model_loaded", model=self.model_size)
            except Exception as e:
                logger.error("whisper_model_load_failed", error=str(e))
                raise RuntimeError(f"Failed to load Whisper model: {e}")

        return FasterWhisperTranscriber._model

    async def transcribe(self, audio_path: Path, job_id: str) -> TranscriptionResult:
        """
        Transcribe audio with word-level timestamps.

        faster-whisper transcribe() is synchronous (runs on CPU).
        We run it in a thread pool to avoid blocking the event loop.
        This is the correct pattern for CPU-bound work in FastAPI.
        """
        logger.info(
            "transcription_started",
            job_id=job_id,
            audio_path=str(audio_path),
            model=self.model_size
        )

        # Run CPU-bound transcription in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,  # Default thread pool
            self._run_transcription,
            audio_path,
            job_id
        )

        return result

    def _run_transcription(self, audio_path: Path, job_id: str) -> TranscriptionResult:
        """
        Synchronous transcription — called from thread pool.

        This is where the actual ML inference happens.
        """
        model = self._load_model()

        # Transcribe with word timestamps enabled
        segments, info = model.transcribe(
            str(audio_path),
            word_timestamps=True,          # CRITICAL — enables word-level timing
            language=None,                  # Auto-detect language
            vad_filter=True,               # Voice Activity Detection — skip silence
            vad_parameters=dict(
                min_silence_duration_ms=500  # Merge words with <500ms gaps
            ),
            beam_size=5,                   # Balance speed/accuracy
            best_of=5,
            temperature=0.0,               # Deterministic output
        )

        # Extract word-level data from segments
        words: list[TranscribedWord] = []
        full_text_parts = []

        for segment in segments:
            full_text_parts.append(segment.text.strip())

            if segment.words:  # Word timestamps available
                for word in segment.words:
                    # Clean the word — remove leading/trailing whitespace
                    clean_word = word.word.strip()
                    if not clean_word:
                        continue

                    words.append(TranscribedWord(
                        word=clean_word,
                        start=round(word.start, 3),
                        end=round(word.end, 3),
                        confidence=round(word.probability, 4)
                    ))
            else:
                # Fallback: segment-level, no word timestamps
                # This shouldn't happen with word_timestamps=True
                logger.warning(
                    "no_word_timestamps",
                    job_id=job_id,
                    segment_text=segment.text
                )

        full_text = " ".join(full_text_parts)

        logger.info(
            "transcription_completed",
            job_id=job_id,
            word_count=len(words),
            duration=round(info.duration, 2),
            language=info.language
        )

        return TranscriptionResult(
            job_id=job_id,
            words=words,
            full_text=full_text,
            duration_seconds=round(info.duration, 2),
            language=info.language,
            model_used=f"faster-whisper-{self.model_size}"
        )

    def is_available(self) -> bool:
        try:
            import faster_whisper
            return True
        except ImportError:
            return False
