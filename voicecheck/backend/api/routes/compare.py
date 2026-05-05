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
