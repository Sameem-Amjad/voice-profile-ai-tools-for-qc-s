# 🚀 Enhanced Claude Code Prompt - Production MVP

## Master Prompt for Claude Code

```
You are a 10-year experienced senior full-stack + AI engineer who has shipped 
production systems at scale. You write clean, maintainable, well-documented code 
with proper error handling, logging, and security practices baked in from day one.

You think in systems, not just features. You anticipate edge cases before they 
become bugs. You choose boring, reliable technology over hype. You optimize for 
developer experience and maintainability.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PROJECT: VoiceCheck — AI Voiceover Accuracy Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUILD A COMPLETE, RUNNABLE MVP. No placeholders. No "TODO: implement this". 
Every function must work. Every edge case must be handled.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 COST CONSTRAINTS (CRITICAL - READ FIRST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a development/MVP build. Minimize ALL third-party costs:

✅ USE THESE (Free/Near-Free for Dev):
  - openai/whisper (local model, runs on CPU, $0 cost) 
  - faster-whisper (optimized local Whisper, 4x faster, still $0)
  - OR OpenAI Whisper API ($0.006/min — cheap enough for dev/demo)
  - Local file storage (disk) — NOT S3 for MVP
  - SQLite for MVP — NOT Postgres/RDS
  - Redis via Docker — free locally
  - Everything runs locally via Docker Compose

❌ AVOID FOR NOW:
  - AWS S3 (use local disk storage with same interface)
  - Paid DBs, paid queues, paid anything
  - WhisperX requires GPU ideally — use faster-whisper instead 
    (CPU-friendly, still gives word-level timestamps)

📝 COST ARCHITECTURE DECISION:
  Use faster-whisper locally (FREE, word-level timestamps, CPU-compatible)
  Fallback option: OpenAI Whisper API with word timestamps enabled
  Storage: Local filesystem with S3-compatible abstraction layer
  (easy swap to real S3 later with one env var change)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 EXACT FOLDER STRUCTURE TO CREATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

voicecheck/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/                          # FastAPI Python backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                       # FastAPI app entry point
│   ├── config.py                     # Settings management
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── upload.py             # POST /api/upload
│   │   │   ├── transcribe.py         # POST /api/transcribe
│   │   │   ├── compare.py            # POST /api/compare
│   │   │   └── health.py             # GET /api/health
│   │   └── middleware/
│   │       ├── __init__.py
│   │       ├── cors.py
│   │       └── error_handler.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── transcription/
│   │   │   ├── __init__.py
│   │   │   ├── base.py               # Abstract transcription interface
│   │   │   ├── faster_whisper.py     # faster-whisper implementation
│   │   │   └── openai_whisper.py     # OpenAI API fallback
│   │   │
│   │   ├── alignment/
│   │   │   ├── __init__.py
│   │   │   ├── normalizer.py         # Text normalization
│   │   │   ├── needleman_wunsch.py   # NW alignment algorithm
│   │   │   ├── levenshtein.py        # Levenshtein distance utils
│   │   │   └── engine.py             # Main alignment orchestrator
│   │   │
│   │   └── storage/
│   │       ├── __init__.py
│   │       ├── base.py               # Storage interface
│   │       └── local.py              # Local disk implementation
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py                # Pydantic models
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── job_service.py            # Job state management
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py                 # Structured logging
│       └── audio_utils.py            # Audio validation/processing
│
└── frontend/                         # React frontend
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.js
    ├── index.html
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        │
        ├── components/
        │   ├── upload/
        │   │   ├── AudioUploader.jsx      # Drag & drop upload
        │   │   └── ScriptInput.jsx        # Script paste/upload
        │   │
        │   ├── player/
        │   │   ├── AudioPlayer.jsx        # HTML5 audio controller
        │   │   └── useAudioPlayer.js      # Audio playback hook
        │   │
        │   ├── results/
        │   │   ├── ResultsView.jsx        # Main results container
        │   │   ├── WordToken.jsx          # Individual word chip
        │   │   ├── ScriptHighlight.jsx    # Full highlighted script
        │   │   └── StatsPanel.jsx         # Accuracy stats
        │   │
        │   └── ui/
        │       ├── Button.jsx
        │       ├── LoadingSpinner.jsx
        │       ├── ProgressBar.jsx
        │       └── ErrorBanner.jsx
        │
        ├── hooks/
        │   ├── useUpload.js
        │   ├── useTranscription.js
        │   └── useComparison.js
        │
        ├── services/
        │   └── api.js                    # Axios API client
        │
        └── utils/
            └── textUtils.js              # Frontend text helpers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 COMPLETE BACKEND CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## FILE: backend/requirements.txt
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
faster-whisper==0.10.1
openai==1.12.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
aiofiles==23.2.1
numpy==1.26.3
librosa==0.10.1
soundfile==0.12.1
ffmpeg-python==0.2.0
structlog==24.1.0
httpx==0.26.0
pytest==7.4.4
pytest-asyncio==0.23.3
```

## FILE: backend/config.py
```python
from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Literal
import os

class Settings(BaseSettings):
    # App
    APP_NAME: str = "VoiceCheck API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS - frontend URL
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Storage - local disk for MVP, swap to S3 later
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_FILE_SIZE_MB: int = 500
    ALLOWED_AUDIO_EXTENSIONS: set[str] = {".mp3", ".wav", ".m4a", ".ogg", ".flac"}
    
    # Transcription backend selection
    # "faster_whisper" = local, free, CPU-compatible
    # "openai_api" = cloud, $0.006/min, needs API key
    TRANSCRIPTION_BACKEND: Literal["faster_whisper", "openai_api"] = "faster_whisper"
    
    # faster-whisper settings (local, FREE)
    WHISPER_MODEL_SIZE: Literal["tiny", "base", "small", "medium", "large-v2"] = "base"
    # tiny=CPU fast, base=good balance, small=better accuracy, medium=best CPU option
    WHISPER_DEVICE: Literal["cpu", "cuda"] = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"  # int8 = fast on CPU, float16 = GPU
    
    # OpenAI API (fallback, only if TRANSCRIPTION_BACKEND=openai_api)
    OPENAI_API_KEY: str = ""
    
    # Alignment settings
    ALIGNMENT_MATCH_SCORE: int = 2
    ALIGNMENT_MISMATCH_SCORE: int = -1
    ALIGNMENT_GAP_SCORE: int = -2
    SIMILARITY_THRESHOLD: float = 0.8  # 80% similar = "close enough"
    
    # Job management (in-memory for MVP, replace with Redis/DB later)
    JOB_TIMEOUT_SECONDS: int = 600  # 10 minutes for long audio
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "console"] = "console"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure upload directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
```

## FILE: backend/utils/logger.py
```python
import structlog
import logging
from config import settings

def setup_logging():
    """Configure structured logging for the application."""
    
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="ISO"),
        structlog.processors.StackInfoRenderer(),
    ]
    
    if settings.LOG_FORMAT == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    logging.basicConfig(level=log_level)

def get_logger(name: str):
    return structlog.get_logger(name)
```

## FILE: backend/models/schemas.py
```python
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

class HealthResponse(BaseModel):
    status: str
    version: str
    transcription_backend: str
    whisper_model: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    job_id: Optional[str] = None
```

## FILE: backend/core/storage/base.py
```python
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
```

## FILE: backend/core/storage/local.py
```python
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
```

## FILE: backend/core/transcription/base.py
```python
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
```

## FILE: backend/core/transcription/faster_whisper.py
```python
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
```

## FILE: backend/core/transcription/openai_whisper.py
```python
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
```

## FILE: backend/core/alignment/normalizer.py
```python
import re
import unicodedata
from utils.logger import get_logger

logger = get_logger(__name__)

# Common spoken contractions → expanded forms
# Handle both directions: "don't" → "do not" AND "do not" → "don't"
CONTRACTIONS = {
    "don't": "do not",
    "doesn't": "does not", 
    "didn't": "did not",
    "won't": "will not",
    "wouldn't": "would not",
    "can't": "cannot",
    "couldn't": "could not",
    "shouldn't": "should not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "i'm": "i am",
    "i've": "i have",
    "i'll": "i will",
    "i'd": "i would",
    "you're": "you are",
    "you've": "you have",
    "you'll": "you will",
    "they're": "they are",
    "they've": "they have",
    "we're": "we are",
    "we've": "we have",
    "he's": "he is",
    "she's": "she is",
    "it's": "it is",
    "that's": "that is",
    "there's": "there is",
    "what's": "what is",
    "let's": "let us",
}

# Filler words to optionally filter from transcription
# These don't appear in scripts but speakers say them
FILLER_WORDS = {"uh", "um", "hmm", "ah", "er", "uhh", "umm", "hm", "ugh"}

# Number words (for handling "two" vs "2" etc.)
NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12",
}


class TextNormalizer:
    """
    Normalize text for fair comparison between script and transcript.
    
    The challenge: a script says "don't" and the speaker says "do not" — 
    those should match. Or the script has "Hello," and whisper outputs "hello".
    
    Normalization pipeline:
    1. Unicode normalization (remove accents)
    2. Lowercase everything
    3. Expand contractions
    4. Remove punctuation
    5. Normalize whitespace
    6. Optionally handle numbers
    """
    
    def __init__(
        self,
        expand_contractions: bool = True,
        filter_fillers: bool = True,
        normalize_numbers: bool = False,  # Disabled by default — risky
    ):
        self.expand_contractions = expand_contractions
        self.filter_fillers = filter_fillers
        self.normalize_numbers = normalize_numbers
    
    def normalize_word(self, word: str) -> str:
        """
        Normalize a single word.
        Returns empty string if word should be removed.
        """
        if not word:
            return ""
        
        # Step 1: Unicode normalization — handles accented chars
        # "café" → "cafe" basically
        word = unicodedata.normalize("NFD", word)
        word = "".join(c for c in word if unicodedata.category(c) != "Mn")
        
        # Step 2: Lowercase
        word = word.lower().strip()
        
        # Step 3: Remove punctuation (keep apostrophes for contractions)
        # Remove leading/trailing punctuation only — preserve "don't"
        word = re.sub(r"^[^\w']+|[^\w']+$", "", word)
        
        # Step 4: Expand contractions BEFORE removing apostrophes
        if self.expand_contractions and word in CONTRACTIONS:
            # Return as single "word" — caller handles splitting
            return CONTRACTIONS[word]
        
        # Step 5: Remove remaining punctuation (including apostrophes now)
        word = re.sub(r"[^\w]", "", word)
        
        # Step 6: Handle number words
        if self.normalize_numbers and word in NUMBER_WORDS:
            word = NUMBER_WORDS[word]
        
        return word
    
    def normalize_text(self, text: str) -> list[str]:
        """
        Normalize full text into list of clean words.
        
        Returns list of individual words (contractions already split).
        e.g., "Hello, World! Don't stop." → ["hello", "world", "do", "not", "stop"]
        """
        if not text:
            return []
        
        # Tokenize — split on whitespace after basic cleanup
        raw_words = text.split()
        
        normalized: list[str] = []
        for raw_word in raw_words:
            result = self.normalize_word(raw_word)
            
            if not result:
                continue
            
            # Contraction expansion may return multiple words ("do not")
            if " " in result:
                normalized.extend(result.split())
            else:
                normalized.append(result)
        
        # Filter filler words from transcription
        if self.filter_fillers:
            normalized = [w for w in normalized if w not in FILLER_WORDS]
        
        return normalized
    
    def normalize_words_with_mapping(self, words: list[dict]) -> list[dict]:
        """
        Normalize a list of word dicts from Whisper output.
        Preserves timestamps through normalization.
        
        Input:  [{"word": "Hello,", "start": 0.5, "end": 0.8, "confidence": 0.99}]
        Output: [{"word": "hello",  "start": 0.5, "end": 0.8, "confidence": 0.99}]
        """
        result = []
        for word_dict in words:
            raw_word = word_dict.get("word", "")
            
            # Check if it's a filler before normalization
            if self.filter_fillers and raw_word.lower().strip() in FILLER_WORDS:
                logger.debug("filler_word_skipped", word=raw_word)
                continue
            
            normalized = self.normalize_word(raw_word)
            if not normalized:
                continue
            
            # Handle contraction expansion — we need to split the timestamp range
            if " " in normalized:
                expanded = normalized.split()
                total_duration = word_dict.get("end", 0) - word_dict.get("start", 0)
                per_word_duration = total_duration / len(expanded)
                
                for i, exp_word in enumerate(expanded):
                    start = word_dict.get("start", 0) + (i * per_word_duration)
                    end = start + per_word_duration
                    result.append({
                        **word_dict,
                        "word": exp_word,
                        "start": round(start, 3),
                        "end": round(end, 3),
                    })
            else:
                result.append({**word_dict, "word": normalized})
        
        return result
```

## FILE: backend/core/alignment/levenshtein.py
```python
import numpy as np
from functools import lru_cache


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Classic dynamic programming Levenshtein distance.
    
    Counts minimum edit operations (insert, delete, substitute)
    to transform s1 into s2.
    
    Used for:
    1. Word-level distance between transcript and script (sequence of words)
    2. Character-level similarity between individual words
    
    O(m*n) time, O(min(m,n)) space
    """
    if s1 == s2:
        return 0
    if not s1:
        return len(s2)
    if not s2:
        return len(s1)
    
    # Use two rows instead of full matrix — saves memory
    previous_row = list(range(len(s2) + 1))
    
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (0 if c1 == c2 else 1)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]


def word_similarity(word1: str, word2: str) -> float:
    """
    Similarity score between two words based on Levenshtein distance.
    
    Returns 0.0 (completely different) to 1.0 (identical).
    
    Used to detect "close matches" — e.g., pronunciation variants:
    - "because" vs "becoz" → 0.71
    - "hello" vs "helo" → 0.80
    - "world" vs "wrld" → 0.60
    """
    if word1 == word2:
        return 1.0
    if not word1 or not word2:
        return 0.0
    
    distance = levenshtein_distance(word1, word2)
    max_len = max(len(word1), len(word2))
    
    return 1.0 - (distance / max_len)


def levenshtein_align(sequence1: list[str], sequence2: list[str]) -> list[tuple]:
    """
    Align two sequences using Levenshtein DP.
    
    Returns list of (word1 or None, word2 or None) pairs representing alignment.
    - (word, word) = match or substitution
    - (None, word) = insertion in sequence2
    - (word, None) = deletion from sequence1
    
    This is used as a faster alternative to Needleman-Wunsch for shorter texts.
    """
    m, n = len(sequence1), len(sequence2)
    
    # Build DP matrix
    dp = np.zeros((m + 1, n + 1), dtype=int)
    
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if sequence1[i-1] == sequence2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(
                    dp[i-1][j],    # deletion
                    dp[i][j-1],    # insertion
                    dp[i-1][j-1]   # substitution
                )
    
    # Traceback to get alignment
    alignment = []
    i, j = m, n
    
    while i > 0 or j > 0:
        if i > 0 and j > 0 and (
            dp[i][j] == dp[i-1][j-1] + (0 if sequence1[i-1] == sequence2[j-1] else 1)
        ):
            alignment.append((sequence1[i-1], sequence2[j-1]))
            i -= 1
            j -= 1
        elif j > 0 and dp[i][j] == dp[i][j-1] + 1:
            alignment.append((None, sequence2[j-1]))
            j -= 1
        else:
            alignment.append((sequence1[i-1], None))
            i -= 1
    
    return list(reversed(alignment))
```

## FILE: backend/core/alignment/needleman_wunsch.py
```python
import numpy as np
from core.alignment.levenshtein import word_similarity
from utils.logger import get_logger

logger = get_logger(__name__)

# Alignment scoring constants
MATCH_SCORE = 2       # Reward for exact match
MISMATCH_SCORE = -1   # Penalty for substitution
GAP_SCORE = -2        # Penalty for insertion/deletion (missing/extra words)

# Score for "close enough" match (pronunciation variant, accent, etc.)
def similarity_score(word1: str, word2: str) -> float:
    """
    Compute alignment score between two words.
    
    This is the heart of the alignment — by giving partial credit for
    similar words, we handle:
    - Accent variations: "car" vs "ca" 
    - Whisper mishearing: "because" vs "becauz"
    - Spelling variations: "colour" vs "color"
    """
    if word1 == word2:
        return MATCH_SCORE
    
    sim = word_similarity(word1, word2)
    
    if sim >= 0.85:
        # Very close — count as match with slight penalty
        return MATCH_SCORE - 0.5
    elif sim >= 0.60:
        # Somewhat close — mismatch but better than gap
        return MISMATCH_SCORE + (sim * MATCH_SCORE)
    else:
        return MISMATCH_SCORE


class NeedlemanWunsch:
    """
    Needleman-Wunsch global sequence alignment algorithm.
    
    Originally designed for DNA/protein sequence alignment.
    We apply it to word sequences — same problem, different alphabet.
    
    Why NW over simple Levenshtein?
    - NW optimizes GLOBAL alignment (considers the full sequence)
    - Better handles insertions and deletions
    - The scoring matrix gives us flexibility (partial credit for similar words)
    - More accurate for voiceover comparison where order matters
    
    Why global alignment for voiceover?
    Because a voiceover artist reads the WHOLE script in order.
    We want to find the best way to align the full transcript with
    the full script, not just local patches.
    
    Time: O(m*n), Space: O(m*n)
    For very long audio (>10k words), we'd switch to banded NW or chunking.
    """
    
    def __init__(
        self,
        match_score: float = MATCH_SCORE,
        mismatch_score: float = MISMATCH_SCORE,
        gap_score: float = GAP_SCORE,
        similarity_threshold: float = 0.8,
    ):
        self.match_score = match_score
        self.mismatch_score = mismatch_score
        self.gap_score = gap_score
        self.similarity_threshold = similarity_threshold
    
    def align(
        self,
        transcript_words: list[str],
        script_words: list[str]
    ) -> list[tuple[str | None, str | None]]:
        """
        Align transcript sequence with script sequence.
        
        Returns list of (transcript_word, script_word) pairs:
        - ("hello", "hello")   → correct match
        - ("wrld", "world")    → mismatch/substitution  
        - (None, "missing")    → word in script, not spoken (gap in transcript)
        - ("extra", None)      → word spoken, not in script (gap in script)
        
        Args:
            transcript_words: What was actually spoken (from Whisper)
            script_words: What should have been said (from user's script)
        """
        m = len(transcript_words)
        n = len(script_words)
        
        if m == 0 and n == 0:
            return []
        
        logger.debug(
            "nw_alignment_start",
            transcript_words=m,
            script_words=n,
            matrix_size=f"{m}x{n}"
        )
        
        # ── Step 1: Fill scoring matrix ──────────────────────────────────
        # dp[i][j] = best alignment score for 
        #            transcript[:i] vs script[:j]
        dp = np.full((m + 1, n + 1), -np.inf)
        dp[0][0] = 0.0
        
        # Initialize gap penalties along edges
        for i in range(1, m + 1):
            dp[i][0] = dp[i-1][0] + self.gap_score
        for j in range(1, n + 1):
            dp[0][j] = dp[0][j-1] + self.gap_score
        
        # Fill the matrix
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                # Score for aligning transcript[i-1] with script[j-1]
                align_score = similarity_score(
                    transcript_words[i-1],
                    script_words[j-1]
                )
                
                dp[i][j] = max(
                    dp[i-1][j-1] + align_score,    # Align (match/mismatch)
                    dp[i-1][j] + self.gap_score,    # Gap in script (extra word)
                    dp[i][j-1] + self.gap_score,    # Gap in transcript (missing word)
                )
        
        logger.debug("nw_matrix_filled", final_score=dp[m][n])
        
        # ── Step 2: Traceback ────────────────────────────────────────────
        alignment: list[tuple] = []
        i, j = m, n
        
        while i > 0 or j > 0:
            if i == 0:
                # Must use gap in transcript
                alignment.append((None, script_words[j-1]))
                j -= 1
            elif j == 0:
                # Must use gap in script
                alignment.append((transcript_words[i-1], None))
                i -= 1
            else:
                current_score = dp[i][j]
                align_s = similarity_score(transcript_words[i-1], script_words[j-1])
                
                if np.isclose(current_score, dp[i-1][j-1] + align_s):
                    # Came from diagonal → alignment
                    alignment.append((transcript_words[i-1], script_words[j-1]))
                    i -= 1
                    j -= 1
                elif np.isclose(current_score, dp[i-1][j] + self.gap_score):
                    # Came from above → gap in script (extra spoken word)
                    alignment.append((transcript_words[i-1], None))
                    i -= 1
                else:
                    # Came from left → gap in transcript (missing word)
                    alignment.append((None, script_words[j-1]))
                    j -= 1
        
        return list(reversed(alignment))
```

## FILE: backend/core/alignment/engine.py
```python
from models.schemas import (
    AlignedWord, WordStatus, AccuracyStats,
    ComparisonResult, TranscriptionResult
)
from core.alignment.normalizer import TextNormalizer
from core.alignment.needleman_wunsch import NeedlemanWunsch
from core.alignment.levenshtein import word_similarity
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class AlignmentEngine:
    """
    Main orchestrator for comparing transcript against script.
    
    Pipeline:
    1. Normalize both texts
    2. Run Needleman-Wunsch alignment
    3. Classify each aligned pair (correct/incorrect/missing/extra)
    4. Map timestamps back to results
    5. Calculate accuracy statistics
    
    Design Decision: Why not just diff strings?
    Simple string diff would fail on:
    - "don't" vs "do not" (same meaning, different tokens)
    - "hello." vs "hello" (punctuation)
    - Accent differences: "water" → "wader"
    - Whisper mishearings that are phonetically similar
    
    The NW algorithm + similarity scoring handles all these gracefully.
    """
    
    def __init__(self):
        self.normalizer = TextNormalizer(
            expand_contractions=True,
            filter_fillers=True,
        )
        self.aligner = NeedlemanWunsch(
            match_score=settings.ALIGNMENT_MATCH_SCORE,
            mismatch_score=settings.ALIGNMENT_MISMATCH_SCORE,
            gap_score=settings.ALIGNMENT_GAP_SCORE,
            similarity_threshold=settings.SIMILARITY_THRESHOLD,
        )
    
    def compare(
        self,
        transcription: TranscriptionResult,
        script_text: str,
    ) -> ComparisonResult:
        """
        Main entry point: compare transcription against script.
        
        Returns a ComparisonResult with per-word status and accuracy stats.
        """
        logger.info(
            "alignment_started",
            job_id=transcription.job_id,
            transcript_words=len(transcription.words),
            script_length=len(script_text)
        )
        
        # ── Step 1: Normalize script ─────────────────────────────────────
        script_words_normalized = self.normalizer.normalize_text(script_text)
        
        # ── Step 2: Normalize transcript (preserving timestamps) ─────────
        transcript_word_dicts = [
            {
                "word": w.word,
                "start": w.start,
                "end": w.end,
                "confidence": w.confidence
            }
            for w in transcription.words
        ]
        transcript_normalized_dicts = self.normalizer.normalize_words_with_mapping(
            transcript_word_dicts
        )
        transcript_words_normalized = [d["word"] for d in transcript_normalized_dicts]
        
        logger.debug(
            "normalization_complete",
            script_words=len(script_words_normalized),
            transcript_words=len(transcript_words_normalized)
        )
        
        # ── Step 3: Run alignment ─────────────────────────────────────────
        alignment_pairs = self.aligner.align(
            transcript_words_normalized,
            script_words_normalized
        )
        
        # ── Step 4: Build lookup for transcript timestamps ────────────────
        # Map normalized transcript word index → timestamp data
        transcript_by_index: dict[int, dict] = {
            i: d for i, d in enumerate(transcript_normalized_dicts)
        }
        
        # ── Step 5: Classify each alignment pair ─────────────────────────
        aligned_words: list[AlignedWord] = []
        transcript_idx = 0
        script_idx = 0
        
        for transcript_word, script_word in alignment_pairs:
            
            # Get timestamp data for this transcript word (if exists)
            ts_data = None
            if transcript_word is not None:
                # Find the matching transcript entry by index
                if transcript_idx < len(transcript_normalized_dicts):
                    ts_data = transcript_normalized_dicts[transcript_idx]
                transcript_idx += 1
            
            if script_word is not None:
                script_idx += 1
            
            aligned_word = self._classify_pair(
                transcript_word=transcript_word,
                script_word=script_word,
                ts_data=ts_data,
            )
            aligned_words.append(aligned_word)
        
        # ── Step 6: Calculate stats ───────────────────────────────────────
        stats = self._calculate_stats(aligned_words, len(script_words_normalized))
        
        logger.info(
            "alignment_completed",
            job_id=transcription.job_id,
            accuracy=stats.accuracy_percentage,
            correct=stats.correct_words,
            incorrect=stats.incorrect_words,
            missing=stats.missing_words,
            extra=stats.extra_words,
        )
        
        return ComparisonResult(
            job_id=transcription.job_id,
            aligned_words=aligned_words,
            stats=stats,
            audio_duration=transcription.duration_seconds,
            script_word_count=len(script_words_normalized),
        )
    
    def _classify_pair(
        self,
        transcript_word: str | None,
        script_word: str | None,
        ts_data: dict | None,
    ) -> AlignedWord:
        """
        Classify a single aligned pair.
        
        Cases:
        1. Both present, identical → CORRECT
        2. Both present, very similar → CLOSE (accent/pronunciation)
        3. Both present, different → INCORRECT
        4. Script word missing from transcript → MISSING
        5. Extra transcript word not in script → EXTRA
        """
        
        start = ts_data.get("start") if ts_data else None
        end = ts_data.get("end") if ts_data else None
        confidence = ts_data.get("confidence") if ts_data else None
        
        # Case 4: Missing word (in script, not spoken)
        if transcript_word is None and script_word is not None:
            return AlignedWord(
                word=script_word,
                status=WordStatus.MISSING,
                expected=script_word,
            )
        
        # Case 5: Extra word (spoken, not in script)
        if script_word is None and transcript_word is not None:
            return AlignedWord(
                word=transcript_word,
                status=WordStatus.EXTRA,
                start=start,
                end=end,
                confidence=confidence,
            )
        
        # Both words present — classify match quality
        sim = word_similarity(transcript_word, script_word)
        
        # Case 1: Exact match
        if transcript_word == script_word:
            return AlignedWord(
                word=script_word,
                status=WordStatus.CORRECT,
                start=start,
                end=end,
                confidence=confidence,
                similarity_score=1.0,
            )
        
        # Case 2: Very close match (accent, slight mispronunciation)
        if sim >= settings.SIMILARITY_THRESHOLD:
            return AlignedWord(
                word=transcript_word,
                status=WordStatus.CLOSE,
                expected=script_word,
                start=start,
                end=end,
                confidence=confidence,
                similarity_score=round(sim, 3),
            )
        
        # Case 3: Incorrect word
        return AlignedWord(
            word=transcript_word,
            status=WordStatus.INCORRECT,
            expected=script_word,
            start=start,
            end=end,
            confidence=confidence,
            similarity_score=round(sim, 3),
        )
    
    def _calculate_stats(
        self,
        aligned_words: list[AlignedWord],
        total_script_words: int
    ) -> AccuracyStats:
        """Calculate accuracy statistics from aligned words."""
        
        counts = {status: 0 for status in WordStatus}
        for w in aligned_words:
            counts[w.status] += 1
        
        correct = counts[WordStatus.CORRECT]
        close = counts[WordStatus.CLOSE]
        incorrect = counts[WordStatus.INCORRECT]
        missing = counts[WordStatus.MISSING]
        extra = counts[WordStatus.EXTRA]
        
        # Accuracy: (correct + partial credit for close) / total script words
        # Close matches get 0.5 credit — they said something recognizable
        if total_script_words > 0:
            accuracy = ((correct + (close * 0.5)) / total_script_words) * 100
            accuracy = min(100.0, round(accuracy, 2))
        else:
            accuracy = 0.0
        
        return AccuracyStats(
            total_script_words=total_script_words,
            correct_words=correct,
            incorrect_words=incorrect,
            missing_words=missing,
            extra_words=extra,
            close_matches=close,
            accuracy_percentage=accuracy,
        )

# Singleton
alignment_engine = AlignmentEngine()
```

## FILE: backend/services/job_service.py
```python
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from models.schemas import JobStatus, TranscriptionResult, ComparisonResult
from utils.logger import get_logger

logger = get_logger(__name__)

class Job:
    """Represents a processing job in the system."""
    
    def __init__(self, job_id: str):
        self.job_id = job_id
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
    
    async def create_job(self) -> Job:
        """Create and register a new job."""
        job_id = str(uuid.uuid4())
        job = Job(job_id)
        
        async with self._lock:
            self._jobs[job_id] = job
        
        logger.info("job_created", job_id=job_id)
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
    
    async def cleanup_expired(self):
        """
        Remove expired jobs from memory.
        Call this periodically (e.g., every 5 minutes).
        """
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
```

## FILE: backend/utils/audio_utils.py
```python
import subprocess
from pathlib import Path
from utils.logger import get_logger

logger = get_logger(__name__)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm"}
MAX_DURATION_SECONDS = 60 * 60  # 1 hour hard limit


def validate_audio_file(file_path: Path) -> dict:
    """
    Validate audio file and return basic metadata.
    
    Uses ffprobe (comes with ffmpeg) to inspect the file.
    This is more reliable than checking file headers manually.
    
    Returns dict with: duration, format, size_bytes
    Raises ValueError for invalid files.
    """
    if not file_path.exists():
        raise ValueError(f"File does not exist: {file_path}")
    
    ext = file_path.suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file format: {ext}. "
            f"Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Use ffprobe to get duration and validate it's actually audio
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_streams",
                "-show_format",
                str(file_path)
            ],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            raise ValueError(
                f"Invalid audio file: {result.stderr.strip()}"
            )
        
        import json
        probe_data = json.loads(result.stdout)
        
        # Extract duration
        duration = float(probe_data.get("format", {}).get("duration", 0))
        
        if duration <= 0:
            raise ValueError("Audio file has zero or negative duration")
        
        if duration > MAX_DURATION_SECONDS:
            raise ValueError(
                f"Audio too long: {duration:.0f}s. "
                f"Maximum: {MAX_DURATION_SECONDS}s"
            )
        
        # Check it has audio stream
        streams = probe_data.get("streams", [])
        audio_streams = [s for s in streams if s.get("codec_type") == "audio"]
        
        if not audio_streams:
            raise ValueError("File contains no audio streams")
        
        file_size = file_path.stat().st_size
        
        logger.info(
            "audio_validated",
            path=str(file_path),
            duration=round(duration, 2),
            format=probe_data.get("format", {}).get("format_name", "unknown"),
            size_mb=round(file_size / 1024 / 1024, 2)
        )
        
        return {
            "duration": round(duration, 2),
            "format": probe_data.get("format", {}).get("format_name", "unknown"),
            "size_bytes": file_size,
            "audio_streams": len(audio_streams),
        }
        
    except subprocess.TimeoutExpired:
        raise ValueError("Timed out validating audio file")
    except json.JSONDecodeError:
        raise ValueError("Could not parse audio file metadata")
    except FileNotFoundError:
        # ffprobe not installed
        logger.warning("ffprobe_not_found", path=str(file_path))
        # Fall back to basic size check
        size = file_path.stat().st_size
        if size == 0:
            raise ValueError("Audio file is empty")
        return {
            "duration": None,  # Unknown without ffprobe
            "format": ext.lstrip("."),
            "size_bytes": size,
            "audio_streams": 1,  # Assume valid
        }
```

## FILE: backend/api/routes/upload.py
```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uuid
from pathlib import Path

from models.schemas import UploadResponse, ErrorResponse
from core.storage.local import storage
from services.job_service import job_service
from utils.audio_utils import validate_audio_file
from utils.logger import get_logger
from config import settings

router = APIRouter()
logger = get_logger(__name__)

@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload audio file",
    description="Upload an audio file for transcription. Returns a job_id to track processing."
)
async def upload_audio(file: UploadFile = File(...)):
    """
    Handle audio file upload.
    
    Steps:
    1. Validate file extension
    2. Create job
    3. Save file to storage
    4. Validate audio metadata (duration, format)
    5. Return job_id
    """
    
    # ── Validate extension before saving ─────────────────────────────────
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. "
                   f"Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )
    
    # ── Create job ────────────────────────────────────────────────────────
    job = await job_service.create_job()
    
    try:
        # ── Save file ─────────────────────────────────────────────────────
        # Keep original extension for ffmpeg compatibility
        safe_filename = f"audio{file_ext}"
        
        file_path_str = await storage.save(
            file_obj=file.file,
            filename=safe_filename,
            job_id=job.job_id
        )
        
        file_path = Path(file_path_str)
        
        # ── Validate audio ────────────────────────────────────────────────
        try:
            audio_meta = validate_audio_file(file_path)
        except ValueError as e:
            # Invalid audio — clean up and fail
            await storage.delete(job.job_id, safe_filename)
            raise HTTPException(status_code=422, detail=str(e))
        
        # ── Update job record ─────────────────────────────────────────────
        job.audio_filename = safe_filename
        job.audio_path = file_path_str
        job.file_size_bytes = audio_meta["size_bytes"]
        job.audio_duration = audio_meta.get("duration")
        
        logger.info(
            "upload_complete",
            job_id=job.job_id,
            filename=file.filename,
            duration=audio_meta.get("duration"),
        )
        
        return UploadResponse(
            job_id=job.job_id,
            file_path=file_path_str,
            file_size_bytes=audio_meta["size_bytes"],
            duration_seconds=audio_meta.get("duration"),
            message="File uploaded successfully. Use job_id to transcribe."
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("upload_failed", job_id=job.job_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
```

## FILE: backend/api/routes/transcribe.py
```python
from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import TranscribeRequest, TranscribeResponse, JobStatus
from services.job_service import job_service
from core.storage.local import storage
from config import settings
from utils.logger import get_logger
from pathlib import Path

router = APIRouter()
logger = get_logger(__name__)

def _get_transcriber():
    """
    Factory function — returns the configured transcriber.
    Allows swapping backends via env var without code changes.
    """
    if settings.TRANSCRIPTION_BACKEND == "faster_whisper":
        from core.transcription.faster_whisper import FasterWhisperTranscriber
        return FasterWhisperTranscriber()
    elif settings.TRANSCRIPTION_BACKEND == "openai_api":
        from core.transcription.openai_whisper import OpenAIWhisperTranscriber
        return OpenAIWhisperTranscriber()
    else:
        raise ValueError(f"Unknown transcription backend: {settings.TRANSCRIPTION_BACKEND}")


async def _run_transcription(job_id: str):
    """
    Background task: run transcription and update job status.
    
    Runs asynchronously so the API can return immediately.
    Client polls /transcribe to check status.
    """
    job = await job_service.get_job(job_id)
    if not job:
        logger.error("transcription_job_not_found", job_id=job_id)
        return
    
    try:
        job.set_status(JobStatus.PROCESSING)
        logger.info("transcription_processing", job_id=job_id)
        
        # Get audio file path
        audio_path = await storage.get_path(
            job_id,
            job.audio_filename
        )
        
        # Run transcription
        transcriber = _get_transcriber()
        result = await transcriber.transcribe(audio_path, job_id)
        
        # Store result in job
        job.transcription = result
        job.audio_duration = result.duration_seconds
        job.set_status(JobStatus.COMPLETED)
        
        logger.info(
            "transcription_complete",
            job_id=job_id,
            words=len(result.words),
            duration=result.duration_seconds
        )
        
    except Exception as e:
        logger.error("transcription_failed", job_id=job_id, error=str(e))
        job.set_status(JobStatus.FAILED, error=str(e))


@router.post(
    "/transcribe",
    response_model=TranscribeResponse,
    summary="Start transcription",
    description="Transcribe an uploaded audio file. Processing happens in background."
)
async def start_transcription(
    request: TranscribeRequest,
    background_tasks: BackgroundTasks
):
    """
    Start transcription job.
    
    This endpoint returns immediately with status=processing.
    Call this endpoint again with the same job_id to get results.
    
    Why background tasks?
    Transcription takes 30s-3min. We can't hold the HTTP connection open.
    Background tasks run after the response is sent.
    """
    job = await job_service.get_job(request.job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {request.job_id}"
        )
    
    if not job.audio_path:
        raise HTTPException(
            status_code=400,
            detail="No audio file associated with this job. Upload audio first."
        )
    
    # If already completed, return cached result
    if job.status == JobStatus.COMPLETED and job.transcription:
        return TranscribeResponse(
            job_id=job.job_id,
            status=job.status,
            result=job.transcription
        )
    
    # If currently processing, return current status
    if job.status == JobStatus.PROCESSING:
        return TranscribeResponse(
            job_id=job.job_id,
            status=job.status
        )
    
    # Start transcription in background
    background_tasks.add_task(_run_transcription, request.job_id)
    
    return TranscribeResponse(
        job_id=job.job_id,
        status=JobStatus.PROCESSING
    )


@router.get(
    "/transcribe/{job_id}",
    response_model=TranscribeResponse,
    summary="Get transcription status"
)
async def get_transcription_status(job_id: str):
    """Poll this endpoint to check transcription progress."""
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    
    return TranscribeResponse(
        job_id=job.job_id,
        status=job.status,
        result=job.transcription,
        error=job.error
    )
```

## FILE: backend/api/routes/compare.py
```python
from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import CompareRequest, CompareResponse, JobStatus
from services.job_service import job_service
from core.alignment.engine import alignment_engine
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


async def _run_comparison(job_id: str, script_text: str):
    """Background task: run alignment comparison."""
    job = await job_service.get_job(job_id)
    if not job:
        return
    
    try:
        job.set_status(JobStatus.PROCESSING)
        
        result = alignment_engine.compare(
            transcription=job.transcription,
            script_text=script_text,
        )
        
        job.comparison = result
        job.set_status(JobStatus.COMPLETED)
        
        logger.info(
            "comparison_complete",
            job_id=job_id,
            accuracy=result.stats.accuracy_percentage
        )
        
    except Exception as e:
        logger.error("comparison_failed", job_id=job_id, error=str(e))
        job.set_status(JobStatus.FAILED, error=str(e))


@router.post(
    "/compare",
    response_model=CompareResponse,
    summary="Compare transcript with script"
)
async def compare_with_script(
    request: CompareRequest,
    background_tasks: BackgroundTasks
):
    """
    Compare transcription against provided script.
    
    Requires:
    - job_id with completed transcription
    - script_text: the expected text
    
    Returns word-by-word alignment with accuracy stats.
    """
    job = await job_service.get_job(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {request.job_id}")
    
    if not job.transcription:
        raise HTTPException(
            status_code=400,
            detail="Transcription not completed. Run /transcribe first."
        )
    
    if job.transcription.words == []:
        raise HTTPException(
            status_code=422,
            detail="Transcription produced no words. Check audio quality."
        )
    
    # Return cached result if available
    if job.comparison and job.status == JobStatus.COMPLETED:
        return CompareResponse(
            job_id=job.job_id,
            status=job.status,
            result=job.comparison
        )
    
    # Run comparison in background
    background_tasks.add_task(_run_comparison, request.job_id, request.script_text)
    
    return CompareResponse(
        job_id=job.job_id,
        status=JobStatus.PROCESSING
    )


@router.get("/compare/{job_id}", response_model=CompareResponse)
async def get_comparison_status(job_id: str):
    """Poll for comparison results."""
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    
    return CompareResponse(
        job_id=job.job_id,
        status=job.status,
        result=job.comparison,
        error=job.error
    )
```

## FILE: backend/api/routes/health.py
```python
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
```

## FILE: backend/main.py
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio

from config import settings
from utils.logger import setup_logging, get_logger
from api.routes import upload, transcribe, compare, health
from services.job_service import job_service

# Setup logging before anything else
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Startup: initialize resources, log config
    Shutdown: clean up, flush logs
    """
    logger.info(
        "app_starting",
        name=settings.APP_NAME,
        version=settings.APP_VERSION,
        transcription_backend=settings.TRANSCRIPTION_BACKEND,
        whisper_model=settings.WHISPER_MODEL_SIZE if settings.TRANSCRIPTION_BACKEND == "faster_whisper" else "n/a"
    )
    
    # Pre-warm the Whisper model on startup to avoid cold start on first request
    if settings.TRANSCRIPTION_BACKEND == "faster_whisper":
        logger.info("prewarm_whisper_model_start")
        try:
            from core.transcription.faster_whisper import FasterWhisperTranscriber
            transcriber = FasterWhisperTranscriber()
            
            # Load model in background — don't block startup
            loop = asyncio.get_event_loop()
            loop.run_in_executor(None, transcriber._load_model)
            logger.info("whisper_model_loading_background")
        except Exception as e:
            logger.warning("whisper_prewarm_failed", error=str(e))
    
    # Start background cleanup task
    async def cleanup_task():
        while True:
            await asyncio.sleep(300)  # Every 5 minutes
            cleaned = await job_service.cleanup_expired()
            if cleaned > 0:
                logger.info("jobs_cleaned", count=cleaned)
    
    cleanup_task_handle = asyncio.create_task(cleanup_task())
    
    logger.info("app_ready", host=settings.HOST, port=settings.PORT)
    
    yield  # App is running
    
    # Shutdown
    cleanup_task_handle.cancel()
    logger.info("app_shutdown")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    VoiceCheck API — AI-powered voiceover accuracy tool.
    
    ## Workflow
    1. **POST /api/upload** — Upload audio file
    2. **POST /api/transcribe** — Start transcription (async)
    3. **GET /api/transcribe/{job_id}** — Poll for transcription results
    4. **POST /api/compare** — Compare with script (async)
    5. **GET /api/compare/{job_id}** — Poll for comparison results
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — never expose stack traces to client
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        error_type=type(exc).__name__
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(transcribe.router, prefix="/api", tags=["Transcription"])
app.include_router(compare.router, prefix="/api", tags=["Comparison"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 COMPLETE FRONTEND CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## FILE: frontend/package.json
```json
{
  "name": "voicecheck-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.5",
    "react-dropzone": "^14.2.3",
    "lucide-react": "^0.314.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.12",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}
```

## FILE: frontend/src/services/api.js
```javascript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 minute timeout for transcription
});

// Request logging in development
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response error normalization
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail 
      || error.response?.data?.error 
      || error.message 
      || 'Unknown error';
    throw new Error(message);
  }
);

// ─── API Functions ───────────────────────────────────────────────────────────

export const uploadAudio = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(pct);
      }
    },
  });
};

export const startTranscription = async (jobId) => {
  return api.post('/transcribe', { job_id: jobId });
};

export const getTranscriptionStatus = async (jobId) => {
  return api.get(`/transcribe/${jobId}`);
};

export const startComparison = async (jobId, scriptText) => {
  return api.post('/compare', { job_id: jobId, script_text: scriptText });
};

export const getComparisonStatus = async (jobId) => {
  return api.get(`/compare/${jobId}`);
};

export const checkHealth = async () => {
  return api.get('/health');
};

// ─── Polling Helper ──────────────────────────────────────────────────────────

/**
 * Poll an async operation until it completes or fails.
 * 
 * @param {Function} pollFn - Async function that returns {status, result, error}
 * @param {Object} options
 * @param {number} options.intervalMs - Polling interval (default: 2000ms)
 * @param {number} options.maxAttempts - Max polls before giving up (default: 150)
 * @param {Function} options.onStatus - Called with status on each poll
 * @returns {Promise} - Resolves with result or rejects with error
 */
export const pollUntilComplete = async (pollFn, options = {}) => {
  const {
    intervalMs = 2000,
    maxAttempts = 150, // 5 minutes at 2s intervals
    onStatus = null,
  } = options;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await pollFn();
    
    if (onStatus) onStatus(response.status);
    
    if (response.status === 'completed') {
      return response;
    }
    
    if (response.status === 'failed') {
      throw new Error(response.error || 'Processing failed');
    }
    
    // Still processing — wait and retry
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Processing timed out. Audio may be too long or server overloaded.');
};
```

## FILE: frontend/src/hooks/useUpload.js
```javascript
import { useState, useCallback } from 'react';
import { uploadAudio } from '../services/api';

export const useUpload = () => {
  const [state, setState] = useState({
    uploading: false,
    progress: 0,
    jobId: null,
    fileMeta: null,
    error: null,
  });
  
  const upload = useCallback(async (file) => {
    setState(prev => ({ ...prev, uploading: true, error: null, progress: 0 }));
    
    try {
      const result = await uploadAudio(file, (pct) => {
        setState(prev => ({ ...prev, progress: pct }));
      });
      
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        jobId: result.job_id,
        fileMeta: {
          name: file.name,
          size: file.size,
          duration: result.duration_seconds,
        },
      }));
      
      return result;
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error.message,
      }));
      throw error;
    }
  }, []);
  
  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      jobId: null,
      fileMeta: null,
      error: null,
    });
  }, []);
  
  return { ...state, upload, reset };
};
```

## FILE: frontend/src/hooks/useTranscription.js
```javascript
import { useState, useCallback } from 'react';
import { startTranscription, getTranscriptionStatus, pollUntilComplete } from '../services/api';

export const useTranscription = () => {
  const [state, setState] = useState({
    transcribing: false,
    status: null,
    result: null,
    error: null,
  });
  
  const transcribe = useCallback(async (jobId) => {
    setState(prev => ({ ...prev, transcribing: true, error: null, status: 'starting' }));
    
    try {
      // Start transcription
      await startTranscription(jobId);
      
      setState(prev => ({ ...prev, status: 'processing' }));
      
      // Poll until complete
      const response = await pollUntilComplete(
        () => getTranscriptionStatus(jobId),
        {
          intervalMs: 2500,
          onStatus: (status) => setState(prev => ({ ...prev, status })),
        }
      );
      
      setState(prev => ({
        ...prev,
        transcribing: false,
        status: 'completed',
        result: response.result,
      }));
      
      return response.result;
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        transcribing: false,
        status: 'failed',
        error: error.message,
      }));
      throw error;
    }
  }, []);
  
  return { ...state, transcribe };
};
```

## FILE: frontend/src/hooks/useComparison.js
```javascript
import { useState, useCallback } from 'react';
import { startComparison, getComparisonStatus, pollUntilComplete } from '../services/api';

export const useComparison = () => {
  const [state, setState] = useState({
    comparing: false,
    result: null,
    error: null,
  });
  
  const compare = useCallback(async (jobId, scriptText) => {
    setState(prev => ({ ...prev, comparing: true, error: null }));
    
    try {
      await startComparison(jobId, scriptText);
      
      const response = await pollUntilComplete(
        () => getComparisonStatus(jobId),
        { intervalMs: 1500 }
      );
      
      setState(prev => ({
        ...prev,
        comparing: false,
        result: response.result,
      }));
      
      return response.result;
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        comparing: false,
        error: error.message,
      }));
      throw error;
    }
  }, []);
  
  const reset = useCallback(() => {
    setState({ comparing: false, result: null, error: null });
  }, []);
  
  return { ...state, compare, reset };
};
```

## FILE: frontend/src/hooks/useAudioPlayer.js
```javascript
import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(null);
  const [state, setState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    audioUrl: null,
    activeWordIndex: null,
  });
  
  // Load audio file into player
  const loadAudio = useCallback((file) => {
    const url = URL.createObjectURL(file);
    
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
    
    setState(prev => ({ ...prev, audioUrl: url, isPlaying: false, currentTime: 0 }));
  }, []);
  
  // Jump to specific timestamp and play
  const seekTo = useCallback((startTime, endTime = null) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = startTime;
    audioRef.current.play();
    
    setState(prev => ({ ...prev, isPlaying: true }));
    
    // Auto-pause after word finishes (optional behavior)
    if (endTime) {
      const duration = (endTime - startTime) * 1000;
      setTimeout(() => {
        if (audioRef.current && audioRef.current.currentTime >= endTime - 0.1) {
          // Don't pause — let it keep playing. Better UX.
          // audioRef.current.pause();
        }
      }, duration + 200);
    }
  }, []);
  
  // Play/pause toggle
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [state.isPlaying]);
  
  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlers = {
      timeupdate: () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      },
      loadedmetadata: () => {
        setState(prev => ({ ...prev, duration: audio.duration }));
      },
      play: () => setState(prev => ({ ...prev, isPlaying: true })),
      pause: () => setState(prev => ({ ...prev, isPlaying: false })),
      ended: () => setState(prev => ({ ...prev, isPlaying: false })),
    };
    
    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });
    
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
    };
  }, []);
  
  // Track which word is currently playing (for karaoke highlight)
  const getActiveWordIndex = useCallback((alignedWords) => {
    if (!alignedWords) return null;
    const t = state.currentTime;
    
    for (let i = 0; i < alignedWords.length; i++) {
      const w = alignedWords[i];
      if (w.start != null && w.end != null) {
        if (t >= w.start && t <= w.end) return i;
      }
    }
    return null;
  }, [state.currentTime]);
  
  return {
    audioRef,
    ...state,
    loadAudio,
    seekTo,
    togglePlay,
    getActiveWordIndex,
  };
};
```

## FILE: frontend/src/components/upload/AudioUploader.jsx
```jsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const ACCEPTED_FORMATS = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg'],
  'audio/flac': ['.flac'],
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const AudioUploader = ({ onFileSelect, uploading, progress, fileMeta, error }) => {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const reason = rejectedFiles[0].errors[0]?.message || 'Invalid file';
      console.error('File rejected:', reason);
      return;
    }
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
    disabled: uploading || !!fileMeta,
  });
  
  // Show success state
  if (fileMeta) {
    return (
      <div className="border-2 border-green-300 bg-green-50 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-500 shrink-0" size={24} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-green-800 truncate">{fileMeta.name}</p>
            <p className="text-sm text-green-600">
              {formatFileSize(fileMeta.size)}
              {fileMeta.duration && ` · ${Math.round(fileMeta.duration)}s`}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-blue-400 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
          uploading && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        <Music
          className={clsx(
            'mx-auto mb-3 transition-colors',
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          )}
          size={36}
        />
        
        {uploading ? (
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{progress}%</p>
          </div>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">
              {isDragActive ? 'Drop your audio here' : 'Drag & drop audio file'}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              or <span className="text-blue-600 font-medium">browse files</span>
            </p>
            <p className="text-xs text-gray-400">
              MP3, WAV, M4A, OGG, FLAC · Max 500MB
            </p>
          </>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
```

## FILE: frontend/src/components/upload/ScriptInput.jsx
```jsx
import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';

const PLACEHOLDER = `Paste your script here...

Example:
"Hello and welcome to VoiceCheck. This tool helps voiceover artists 
verify their recordings against the original script with word-level accuracy."`;

export const ScriptInput = ({ value, onChange, disabled }) => {
  const wordCount = value.trim() 
    ? value.trim().split(/\s+/).length 
    : 0;
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => onChange(evt.target.result);
    reader.readAsText(file);
    
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Script / Expected Text
        </label>
        <div className="flex items-center gap-2">
          {wordCount > 0 && (
            <span className="text-xs text-gray-500">{wordCount} words</span>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".txt,.md,.rtf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={disabled}
            />
            <span className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <FileText size={12} />
              Upload .txt
            </span>
          </label>
        </div>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={disabled}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:bg-gray-50 disabled:text-gray-500
                     resize-none font-mono leading-relaxed"
        />
        {value && !disabled && (
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
```

## FILE: frontend/src/components/player/AudioPlayer.jsx
```jsx
import React from 'react';
import { Play, Pause, SkipBack } from 'lucide-react';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const AudioPlayer = ({ audioRef, isPlaying, currentTime, duration, onToggle }) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * duration;
  };
  
  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };
  
  return (
    <div className="bg-gray-900 rounded-xl p-4 text-white">
      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" preload="metadata" />
      
      <div className="flex items-center gap-4">
        {/* Restart button */}
        <button
          onClick={handleRestart}
          className="text-gray-400 hover:text-white transition-colors"
          title="Restart"
        >
          <SkipBack size={18} />
        </button>
        
        {/* Play/Pause */}
        <button
          onClick={onToggle}
          className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full 
                     flex items-center justify-center transition-colors"
        >
          {isPlaying 
            ? <Pause size={18} fill="white" />
            : <Play size={18} fill="white" className="ml-0.5" />
          }
        </button>
        
        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-gray-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          
          <div
            className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer relative group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            {/* Scrubber dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white 
                          rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                          -translate-x-1/2 pointer-events-none"
              style={{ left: `${progress}%` }}
            />
          </div>
          
          <span className="text-xs text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
```

## FILE: frontend/src/components/results/WordToken.jsx
```jsx
import React from 'react';
import clsx from 'clsx';

const STATUS_CONFIG = {
  correct: {
    bg: 'bg-green-100 hover:bg-green-200',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
    label: '✓',
  },
  incorrect: {
    bg: 'bg-red-100 hover:bg-red-200',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-500',
    label: '✗',
  },
  missing: {
    bg: 'bg-yellow-100 hover:bg-yellow-200',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
    label: '?',
  },
  extra: {
    bg: 'bg-orange-100 hover:bg-orange-200',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dot: 'bg-orange-400',
    label: '+',
  },
  close: {
    bg: 'bg-blue-100 hover:bg-blue-200',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
    label: '~',
  },
};

export const WordToken = ({
  word,
  status,
  expected,
  start,
  end,
  confidence,
  similarityScore,
  isActive,          // Currently playing in audio
  onClick,           // Called when word is clicked
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.correct;
  const isClickable = start != null && onClick;
  
  const tooltip = (() => {
    const parts = [];
    if (status === 'incorrect' && expected) parts.push(`Expected: "${expected}"`);
    if (status === 'close' && expected) parts.push(`Script: "${expected}" (${Math.round(similarityScore * 100)}% match)`);
    if (status === 'missing') parts.push('Word not spoken');
    if (status === 'extra') parts.push('Extra word (not in script)');
    if (start != null) parts.push(`${start.toFixed(2)}s – ${end?.toFixed(2)}s`);
    if (confidence != null) parts.push(`Confidence: ${Math.round(confidence * 100)}%`);
    return parts.join('\n');
  })();
  
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border text-sm font-medium',
        'transition-all duration-150 mx-0.5 my-0.5',
        config.bg,
        config.text,
        config.border,
        isClickable && 'cursor-pointer',
        isActive && 'ring-2 ring-blue-500 ring-offset-1 scale-110',
        status === 'missing' && 'opacity-60 border-dashed',
      )}
      onClick={isClickable ? () => onClick(start, end) : undefined}
      title={tooltip}
    >
      {/* Status indicator dot */}
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      
      {/* Word text */}
      <span>
        {status === 'missing' ? `[${word}]` : word}
      </span>
      
      {/* Show expected word for incorrect */}
      {status === 'incorrect' && expected && (
        <span className="text-xs opacity-60 ml-0.5">
          →{expected}
        </span>
      )}
    </span>
  );
};
```

## FILE: frontend/src/components/results/StatsPanel.jsx
```jsx
import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Plus, Activity } from 'lucide-react';
import clsx from 'clsx';

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className={clsx('rounded-xl p-4 border', color.bg, color.border)}>
    <div className="flex items-center justify-between mb-1">
      <Icon size={18} className={color.icon} />
      <span className={clsx('text-2xl font-bold', color.text)}>{value}</span>
    </div>
    <p className={clsx('text-xs font-medium', color.label)}>{label}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

export const StatsPanel = ({ stats, duration }) => {
  const {
    accuracy_percentage,
    correct_words,
    incorrect_words,
    missing_words,
    extra_words,
    close_matches,
    total_script_words,
  } = stats;
  
  const accuracyColor = accuracy_percentage >= 90
    ? { ring: 'text-green-600', bg: 'bg-green-50' }
    : accuracy_percentage >= 70
    ? { ring: 'text-yellow-600', bg: 'bg-yellow-50' }
    : { ring: 'text-red-600', bg: 'bg-red-50' };
  
  return (
    <div className="space-y-4">
      {/* Main accuracy score */}
      <div className={clsx(
        'rounded-xl p-6 text-center border-2',
        accuracyColor.bg,
        accuracy_percentage >= 90 ? 'border-green-200'
          : accuracy_percentage >= 70 ? 'border-yellow-200' : 'border-red-200'
      )}>
        <p className="text-sm font-medium text-gray-600 mb-1">Overall Accuracy</p>
        <p className={clsx('text-5xl font-bold', accuracyColor.ring)}>
          {accuracy_percentage.toFixed(1)}%
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {correct_words} of {total_script_words} words correct
        </p>
        {duration && (
          <p className="text-xs text-gray-400 mt-1">
            Audio: {Math.floor(duration / 60)}m {Math.round(duration % 60)}s
          </p>
        )}
      </div>
      
      {/* Breakdown grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Correct"
          value={correct_words}
          color={{
            bg: 'bg-green-50', border: 'border-green-200',
            icon: 'text-green-500', text: 'text-green-700', label: 'text-green-600'
          }}
        />
        <StatCard
          icon={XCircle}
          label="Incorrect"
          value={incorrect_words}
          color={{
            bg: 'bg-red-50', border: 'border-red-200',
            icon: 'text-red-500', text: 'text-red-700', label: 'text-red-600'
          }}
        />
        <StatCard
          icon={AlertCircle}
          label="Missing"
          value={missing_words}
          color={{
            bg: 'bg-yellow-50', border: 'border-yellow-200',
            icon: 'text-yellow-500', text: 'text-yellow-700', label: 'text-yellow-600'
          }}
        />
        <StatCard
          icon={Activity}
          label="Close Match"
          value={close_matches}
          subtitle="Pronunciation variants"
          color={{
            bg: 'bg-blue-50', border: 'border-blue-200',
            icon: 'text-blue-500', text: 'text-blue-700', label: 'text-blue-600'
          }}
        />
      </div>
      
      {extra_words > 0 && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-2 text-sm text-orange-700">
          <span className="font-medium">{extra_words}</span> extra words spoken (not in script)
        </div>
      )}
      
      {/* Legend */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Legend</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <span>🟢 Correct word</span>
          <span>🔴 Wrong word</span>
          <span>🟡 Missing word</span>
          <span>🔵 Close match (accent)</span>
          <span>🟠 Extra word spoken</span>
          <span>🖱️ Click word → play audio</span>
        </div>
      </div>
    </div>
  );
};
```

## FILE: frontend/src/components/results/ResultsView.jsx
```jsx
import React, { useMemo, useState } from 'react';
import { WordToken } from './WordToken';
import { StatsPanel } from './StatsPanel';
import { AudioPlayer } from '../player/AudioPlayer';
import { Filter } from 'lucide-react';
import clsx from 'clsx';

const FILTERS = [
  { id: 'all', label: 'All Words' },
  { id: 'incorrect', label: '❌ Incorrect' },
  { id: 'missing', label: '⚠️ Missing' },
  { id: 'correct', label: '✅ Correct' },
  { id: 'close', label: '🔵 Close' },
];

export const ResultsView = ({
  result,
  audioRef,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeekTo,
}) => {
  const [filter, setFilter] = useState('all');
  
  const { aligned_words, stats } = result;
  
  // Find active word index based on playback position
  const activeWordIndex = useMemo(() => {
    for (let i = 0; i < aligned_words.length; i++) {
      const w = aligned_words[i];
      if (w.start != null && w.end != null) {
        if (currentTime >= w.start && currentTime <= w.end) return i;
      }
    }
    return null;
  }, [currentTime, aligned_words]);
  
  const filteredWords = useMemo(() => {
    if (filter === 'all') return aligned_words;
    return aligned_words.filter(w => w.status === filter);
  }, [aligned_words, filter]);
  
  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <AudioPlayer
        audioRef={audioRef}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration || result.audio_duration}
        onToggle={onTogglePlay}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Word Display */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                  filter === f.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          {/* Word tokens */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 leading-loose min-h-[200px]">
            {filteredWords.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-8">
                No words match this filter
              </p>
            ) : (
              filteredWords.map((word, idx) => (
                <WordToken
                  key={`${word.word}-${idx}`}
                  {...word}
                  isActive={activeWordIndex === idx}
                  onClick={word.start != null ? onSeekTo : null}
                />
              ))
            )}
          </div>
          
          <p className="text-xs text-gray-400 text-center">
            💡 Click any highlighted word to jump to that point in the audio
          </p>
        </div>
        
        {/* Right: Stats */}
        <div>
          <StatsPanel
            stats={stats}
            duration={result.audio_duration}
          />
        </div>
      </div>
    </div>
  );
};
```

## FILE: frontend/src/App.jsx
```jsx
import React, { useState, useRef } from 'react';
import { AudioUploader } from './components/upload/AudioUploader';
import { ScriptInput } from './components/upload/ScriptInput';
import { ResultsView } from './components/results/ResultsView';
import { useUpload } from './hooks/useUpload';
import { useTranscription } from './hooks/useTranscription';
import { useComparison } from './hooks/useComparison';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { Mic2, ChevronRight, RotateCcw, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// Steps for the workflow UI
const STEPS = ['upload', 'transcribe', 'results'];

const StepBadge = ({ step, current, label }) => {
  const stepIndex = STEPS.indexOf(step);
  const currentIndex = STEPS.indexOf(current);
  const done = stepIndex < currentIndex;
  const active = step === current;
  
  return (
    <div className="flex items-center gap-2">
      <span className={clsx(
        'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center',
        done ? 'bg-green-500 text-white'
          : active ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-500'
      )}>
        {done ? '✓' : stepIndex + 1}
      </span>
      <span className={clsx(
        'text-sm font-medium',
        active ? 'text-gray-900' : 'text-gray-400'
      )}>
        {label}
      </span>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState('upload');
  const [script, setScript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  
  const upload = useUpload();
  const transcription = useTranscription();
  const comparison = useComparison();
  const player = useAudioPlayer();
  
  // ── File selected handler ─────────────────────────────────────────────
  const handleFileSelect = async (file) => {
    setAudioFile(file);
    player.loadAudio(file);
    
    try {
      await upload.upload(file);
    } catch (e) {
      // Error handled in hook
    }
  };
  
  // ── Analyze button ────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!upload.jobId || !script.trim()) return;
    
    setStep('transcribe');
    
    try {
      await transcription.transcribe(upload.jobId);
      await comparison.compare(upload.jobId, script);
      setStep('results');
    } catch (e) {
      setStep('upload'); // Reset on error
    }
  };
  
  // ── Reset everything ──────────────────────────────────────────────────
  const handleReset = () => {
    setStep('upload');
    setScript('');
    setAudioFile(null);
    upload.reset();
    comparison.reset();
  };
  
  const canAnalyze = upload.jobId && script.trim().length > 0 && !transcription.transcribing;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic2 className="text-blue-400" size={24} />
            <span className="text-white font-bold text-lg tracking-tight">
              Voice<span className="text-blue-400">Check</span>
            </span>
          </div>
          
          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-4">
            <StepBadge step="upload" current={step} label="Upload" />
            <ChevronRight size={14} className="text-gray-600" />
            <StepBadge step="transcribe" current={step} label="Transcribe" />
            <ChevronRight size={14} className="text-gray-600" />
            <StepBadge step="results" current={step} label="Results" />
          </div>
          
          {step !== 'upload' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw size={14} />
              Start over
            </button>
          )}
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* ── Step: Upload + Script ─────────────────────────────────── */}
        {(step === 'upload' || step === 'transcribe') && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Check your voiceover accuracy
              </h1>
              <p className="text-gray-400">
                Upload your recording and paste the script to get word-level feedback
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Audio Upload Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">1</span>
                  Upload Audio
                </h2>
                <AudioUploader
                  onFileSelect={handleFileSelect}
                  uploading={upload.uploading}
                  progress={upload.progress}
                  fileMeta={upload.fileMeta}
                  error={upload.error}
                />
              </div>
              
              {/* Script Input Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">2</span>
                  Paste Script
                </h2>
                <ScriptInput
                  value={script}
                  onChange={setScript}
                  disabled={step === 'transcribe'}
                />
              </div>
            </div>
            
            {/* Processing status */}
            {step === 'transcribe' && (
              <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-6 text-center">
                <Loader2 className="animate-spin text-blue-400 mx-auto mb-3" size={32} />
                <p className="text-white font-medium">
                  {transcription.status === 'processing'
                    ? '🎙️ Transcribing audio with AI...'
                    : comparison.comparing
                    ? '🧠 Aligning with script...'
                    : 'Processing...'}
                </p>
                <p className="text-blue-300 text-sm mt-1">
                  {upload.fileMeta?.duration
                    ? `Estimating ${Math.ceil(upload.fileMeta.duration / 30)}–${Math.ceil(upload.fileMeta.duration / 15)} seconds`
                    : 'This may take 30–120 seconds for longer recordings'}
                </p>
              </div>
            )}
            
            {/* Analyze button */}
            {step === 'upload' && (
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className={clsx(
                    'flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white',
                    'transition-all duration-200 shadow-lg',
                    canAnalyze
                      ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-100'
                      : 'bg-gray-600 cursor-not-allowed opacity-60'
                  )}
                >
                  <Mic2 size={20} />
                  Analyze Recording
                </button>
              </div>
            )}
            
            {/* Error display */}
            {(transcription.error || comparison.error) && (
              <div className="bg-red-900/40 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                ❌ {transcription.error || comparison.error}
              </div>
            )}
          </div>
        )}
        
        {/* ── Step: Results ─────────────────────────────────────────── */}
        {step === 'results' && comparison.result && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">Analysis Complete</h2>
              <p className="text-gray-400 text-sm">
                Click any word to jump to that point in the audio
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <ResultsView
                result={comparison.result}
                audioRef={player.audioRef}
                isPlaying={player.isPlaying}
                currentTime={player.currentTime}
                duration={player.duration}
                onTogglePlay={player.togglePlay}
                onSeekTo={player.seekTo}
              />
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-xs">
        VoiceCheck MVP · Built with faster-whisper + Needleman-Wunsch alignment
      </footer>
    </div>
  );
}
```

## FILE: frontend/src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## FILE: frontend/src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}
```

## FILE: frontend/tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

## FILE: frontend/vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐳 DOCKER + DEVOPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## FILE: docker-compose.yml
```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: voicecheck-backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app                          # Hot reload in dev
      - voicecheck-uploads:/app/uploads         # Persist uploads
      - voicecheck-models:/app/.whisper_models  # Cache Whisper models
    environment:
      - TRANSCRIPTION_BACKEND=${TRANSCRIPTION_BACKEND:-faster_whisper}
      - WHISPER_MODEL_SIZE=${WHISPER_MODEL_SIZE:-base}
      - WHISPER_DEVICE=cpu
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - DEBUG=true
      - LOG_FORMAT=console
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s  # Give time for model loading

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: voicecheck-frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000/api
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  voicecheck-uploads:
  voicecheck-models:
```

## FILE: backend/Dockerfile
```dockerfile
FROM python:3.11-slim

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Create upload directory
RUN mkdir -p uploads .whisper_models

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

## FILE: frontend/Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

## FILE: .env.example
```bash
# ─── Transcription ──────────────────────────────
# Options: faster_whisper (free, local) | openai_api (paid, cloud)
TRANSCRIPTION_BACKEND=faster_whisper

# Whisper model size (only for faster_whisper)
# tiny=fastest, base=balanced, small=better, medium=best CPU option
WHISPER_MODEL_SIZE=base

# Only needed if TRANSCRIPTION_BACKEND=openai_api
OPENAI_API_KEY=

# ─── App ────────────────────────────────────────
DEBUG=false
LOG_LEVEL=INFO

# ─── Frontend ───────────────────────────────────
VITE_API_URL=http://localhost:8000/api
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 README.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## FILE: README.md
```markdown
# VoiceCheck — AI Voiceover Accuracy Tool

Compare voiceover recordings against scripts with word-level AI accuracy.

## Quick Start (Docker — Recommended)

\`\`\`bash
git clone <repo>
cd voicecheck
cp .env.example .env

# Start everything
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
\`\`\`

First run downloads the Whisper model (~150MB for base). Subsequent starts are instant.

## Local Development (No Docker)

### Backend
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --reload --port 8000
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Model Selection Guide

| Model  | Speed (CPU) | Accuracy | RAM   | Best For        |
|--------|-------------|----------|-------|-----------------|
| tiny   | ~32x RT     | OK       | 75MB  | Quick testing   |
| base   | ~16x RT     | Good     | 150MB | Development ✅  |
| small  | ~6x RT      | Better   | 480MB | Production      |
| medium | ~2x RT      | Best CPU | 1.5GB | High accuracy   |

Set `WHISPER_MODEL_SIZE=small` in `.env` for production use.

## Using OpenAI API Instead (Optional)

If you want cloud transcription:
1. Get API key at platform.openai.com (~$0.006/min)
2. Set in `.env`:
   \`\`\`
   TRANSCRIPTION_BACKEND=openai_api
   OPENAI_API_KEY=sk-...
   \`\`\`

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/upload | Upload audio file |
| POST | /api/transcribe | Start transcription |
| GET | /api/transcribe/{id} | Poll transcription status |
| POST | /api/compare | Compare with script |
| GET | /api/compare/{id} | Poll comparison status |
| GET | /api/health | Health check |

Full interactive docs at http://localhost:8000/docs

## Architecture Decisions

**Why faster-whisper over WhisperX?**
- WhisperX requires GPU for best results
- faster-whisper gives word timestamps on CPU (int8 quantized)
- 4x faster than stock whisper, zero cost

**Why Needleman-Wunsch over simple diff?**
- Handles missing/extra words correctly
- Partial credit for similar words (accent handling)
- Global alignment = better for ordered voiceover reading

**Why in-memory job store?**
- Zero infrastructure for MVP
- Add Redis/Postgres when scaling
- Interface is already abstracted for easy swap

## Cost Breakdown (Dev/MVP)

| Component | Cost |
|-----------|------|
| faster-whisper | FREE (local) |
| Local storage | FREE |
| OpenAI API (optional) | $0.006/min |
| Docker | FREE |
| **Total for dev** | **$0** |
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now build all files exactly as specified. 
Do not skip any file. 
Do not use placeholder comments like "# implement this".
Every function must have real working code.
Test your logic mentally before writing — especially the alignment engine.
A 10-year experienced engineer ships code that works on first run.

Start with the backend alignment engine (needleman_wunsch.py + engine.py) 
as that is the core business logic. Then build outward.
```

---

## 🎯 Key Engineering Decisions Explained

```
┌─────────────────────────────────────────────────────────┐
│              WHY THESE CHOICES MATTER                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  faster-whisper > WhisperX                               │
│  ✓ Works on CPU (no GPU needed for dev)                  │
│  ✓ 100% free, runs offline                               │
│  ✓ Word-level timestamps built in                        │
│  ✓ int8 quantization = fast on cheap hardware            │
│                                                          │
│  Needleman-Wunsch > Simple Diff                          │
│  ✓ Handles insertions/deletions correctly                │
│  ✓ Partial similarity scoring for accents                │
│  ✓ Global alignment = correct word ordering              │
│  ✓ Same algorithm used in bioinformatics (proven)        │
│                                                          │
│  FastAPI > Node.js Express                               │
│  ✓ Native async, perfect for AI processing               │
│  ✓ Auto OpenAPI docs                                     │
│  ✓ Pydantic = runtime type safety                        │
│  ✓ Background tasks built in (no extra queue)            │
│                                                          │
│  Local Storage > S3                                      │
│  ✓ Zero cost for dev                                     │
│  ✓ Abstraction layer = swap to S3 in 1 hour              │
│  ✓ No AWS account needed to start                        │
│                                                          │
│  Total Dev Cost: $0.00/month                             │
└─────────────────────────────────────────────────────────┘
```