from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio

from config import settings
from utils.logger import setup_logging, get_logger
from api.routes import upload, transcribe, compare, health, billing
from api.routes import history, stats, contact, feedback, chatbot, admin as admin_routes, me
from services.job_service import job_service
from db.init import init_db

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

    # ── Initialise the database (creates tables on first boot) ────────────
    try:
        await init_db()
    except Exception as e:
        logger.error("db_init_failed", error=str(e))

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
    allow_origins=["*"],
    allow_credentials=False,
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
    # Manually add CORS header so the browser can read the error body.
    # The CORS middleware doesn't always fire on unhandled exceptions.
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
        headers={"Access-Control-Allow-Origin": origin},
    )

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(transcribe.router, prefix="/api", tags=["Transcription"])
app.include_router(compare.router, prefix="/api", tags=["Comparison"])
app.include_router(billing.router, prefix="/api", tags=["Billing"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
app.include_router(contact.router, prefix="/api", tags=["Contact"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])
app.include_router(admin_routes.router, prefix="/api", tags=["Admin"])
app.include_router(me.router, prefix="/api", tags=["Me"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
