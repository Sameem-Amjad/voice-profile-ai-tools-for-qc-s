from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Literal
import os
import json

class Settings(BaseSettings):
    # App
    APP_NAME: str = "VoiceCheck API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS - frontend origins. Set as a single string to avoid pydantic-settings
    # JSON-decoding env vars typed as list. The `cors_origins_list` property
    # parses both JSON-list and comma-separated forms. Examples:
    #   CORS_ORIGINS=https://voicecheck.vercel.app
    #   CORS_ORIGINS=https://voicecheck.vercel.app,https://staging.vercel.app
    #   CORS_ORIGINS=["https://voicecheck.vercel.app"]
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        s = (self.CORS_ORIGINS or "").strip()
        if not s:
            return []
        if s.startswith("["):
            try:
                return json.loads(s)
            except json.JSONDecodeError:
                pass
        return [o.strip() for o in s.split(",") if o.strip()]

    # Storage - local disk for MVP, swap to S3 later
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_FILE_SIZE_MB: int = 500
    ALLOWED_AUDIO_EXTENSIONS: set[str] = {".mp3", ".wav", ".m4a", ".ogg", ".flac"}

    # Transcription backend selection
    # Per brief: users must never see/provide an API key — server-side OpenAI
    # is the production path. faster_whisper remains as a zero-cost local
    # development/offline fallback (e.g. for tests, demo without API key).
    # "openai_api"      = cloud, $0.006/min, default for prod
    # "faster_whisper"  = local, free, CPU-compatible (dev fallback)
    TRANSCRIPTION_BACKEND: Literal["faster_whisper", "openai_api"] = "openai_api"

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

    # ── Phase 2: Database ─────────────────────────────────────────────────
    # Default: local SQLite for dev. Production: postgresql+asyncpg://...
    DATABASE_URL: str = "sqlite+aiosqlite:///./voicecheck.db"

    # ── Phase 2: Auth (Clerk JWT verification, server-side only) ──────────
    # If CLERK_JWKS_URL is empty, it's auto-derived from CLERK_ISSUER as
    # f"{issuer}/.well-known/jwks.json".
    CLERK_ISSUER: str = ""
    CLERK_JWKS_URL: str = ""
    # When False (dev/MVP demo), upload/transcribe are public so existing
    # tests keep passing. Flip to True in prod once Clerk creds are wired.
    AUTH_REQUIRED: bool = False

    # ── Phase 2: Stripe billing ───────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_STARTER: str = ""
    STRIPE_PRICE_PRO: str = ""
    ADMIN_EMAILS: str = ""  # comma-separated list of admin email addresses

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Auto-derive JWKS URL from issuer if not explicitly set
if not settings.CLERK_JWKS_URL and settings.CLERK_ISSUER:
    settings.CLERK_JWKS_URL = settings.CLERK_ISSUER.rstrip("/") + "/.well-known/jwks.json"

# Ensure upload directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
