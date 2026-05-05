from abc import ABC, abstractmethod
from pathlib import Path
from models.schemas import TranscriptionResult

class BaseTranscriber(ABC):
    """
    Abstract transcription interface.

    Implementations:
    - FasterWhisperTranscriber: Local, free, CPU-friendly
    - OpenAIWhisperTranscriber: Cloud API, $0.006/min

    Swap via TRANSCRIPTION_BACKEND env var.
    """

    @abstractmethod
    async def transcribe(self, audio_path: Path, job_id: str) -> TranscriptionResult:
        """
        Transcribe audio file.

        MUST return word-level timestamps.
        Without this, the alignment engine cannot function.

        Args:
            audio_path: Path to audio file on disk
            job_id: For logging/tracking purposes

        Returns:
            TranscriptionResult with word-level timestamps
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this backend is properly configured and available."""
        pass
