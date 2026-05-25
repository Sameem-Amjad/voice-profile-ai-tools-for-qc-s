from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from enum import Enum
import uuid

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class WordStatus(str, Enum):
    CORRECT = "correct"
    INCORRECT = "incorrect"
    MISSING = "missing"
    EXTRA = "extra"          # Word in audio but NOT in script
    CLOSE = "close"          # Close match (accent/pronunciation variant)

# ─── Transcription Models ───────────────────────────────────────────────────

class TranscribedWord(BaseModel):
    """Single word with timestamp from speech-to-text."""
    word: str
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

    class Config:
        json_schema_extra = {
            "example": {"word": "hello", "start": 0.52, "end": 0.80, "confidence": 0.98}
        }

class TranscriptionResult(BaseModel):
    """Complete transcription output."""
    job_id: str
    words: list[TranscribedWord]
    full_text: str
    duration_seconds: float
    language: str = "en"
    model_used: str

# ─── Alignment Models ───────────────────────────────────────────────────────

class AlignedWord(BaseModel):
    """Single word after alignment with script."""
    word: str                              # What was spoken (or what was expected)
    status: WordStatus
    expected: Optional[str] = None         # Only set when status=incorrect
    start: Optional[float] = None          # Timestamp if word was spoken
    end: Optional[float] = None
    confidence: Optional[float] = None
    similarity_score: Optional[float] = None  # 0-1 how close the match is

    class Config:
        json_schema_extra = {
            "example": {
                "word": "wrld",
                "status": "incorrect",
                "expected": "world",
                "start": 0.81,
                "end": 1.10,
                "confidence": 0.95,
                "similarity_score": 0.60
            }
        }

class AccuracyStats(BaseModel):
    """Summary statistics for the comparison."""
    total_script_words: int
    correct_words: int
    incorrect_words: int
    missing_words: int
    extra_words: int
    close_matches: int
    accuracy_percentage: float = Field(..., ge=0.0, le=100.0)

    @property
    def readable_accuracy(self) -> str:
        return f"{self.accuracy_percentage:.1f}%"

class ComparisonResult(BaseModel):
    """Full comparison output."""
    job_id: str
    aligned_words: list[AlignedWord]
    stats: AccuracyStats
    audio_duration: float
    script_word_count: int

# ─── API Request/Response Models ────────────────────────────────────────────

class UploadResponse(BaseModel):
    job_id: str
    file_path: str
    file_size_bytes: int
    duration_seconds: Optional[float] = None
    message: str = "File uploaded successfully"

class TranscribeRequest(BaseModel):
    job_id: str

class TranscribeResponse(BaseModel):
    job_id: str
    status: JobStatus
    result: Optional[TranscriptionResult] = None
    error: Optional[str] = None

class CompareRequest(BaseModel):
    job_id: str
    script_text: str = Field(..., min_length=1, max_length=50000)

class CompareResponse(BaseModel):
    job_id: str
    status: JobStatus
    result: Optional[ComparisonResult] = None
    error: Optional[str] = None
    analysis_id: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    transcription_backend: str
    whisper_model: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    job_id: Optional[str] = None


# ── Shared result (public, no auth) ─────────────────────────────────────────

class SharedResultResponse(BaseModel):
    accuracy_percentage: float
    total_words: int
    correct_words: int
    audio_duration: float
    script_snippet: Optional[str] = None
    result: Optional[ComparisonResult] = None
    created_at: str


# ── Multiple-takes comparison ────────────────────────────────────────────────

class CompareTakesRequest(BaseModel):
    job_ids: list[str] = Field(..., min_length=2, max_length=5)
    script_text: str = Field(..., min_length=1, max_length=50000)


class TakeResult(BaseModel):
    job_id: str
    rank: int
    accuracy_percentage: float
    stats: AccuracyStats
    aligned_words: list[AlignedWord]
    audio_duration: float
    analysis_id: Optional[str] = None


class CompareTakesResponse(BaseModel):
    takes: list[TakeResult]
    best_job_id: str
