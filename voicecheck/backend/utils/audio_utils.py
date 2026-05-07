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

        # Extract duration. Browser MediaRecorder webm files often have no
        # duration in the container header — fall back to stream duration,
        # then to decoding the file end-to-end with ffprobe.
        streams = probe_data.get("streams", [])
        audio_streams = [s for s in streams if s.get("codec_type") == "audio"]

        if not audio_streams:
            raise ValueError("File contains no audio streams")

        duration = float(probe_data.get("format", {}).get("duration") or 0)
        if duration <= 0:
            for s in audio_streams:
                d = float(s.get("duration") or 0)
                if d > 0:
                    duration = d
                    break

        if duration <= 0:
            # Last resort: decode the file to figure out its real length.
            # This handles MediaRecorder webm where neither container nor
            # stream metadata carries a duration.
            try:
                decode = subprocess.run(
                    ["ffprobe", "-v", "error", "-of",
                     "default=noprint_wrappers=1:nokey=1",
                     "-show_entries", "format=duration",
                     "-f", audio_streams[0].get("codec_name", "matroska"),
                     str(file_path)],
                    capture_output=True, text=True, timeout=30,
                )
                duration = float(decode.stdout.strip() or 0)
            except Exception:
                pass

        if duration <= 0:
            # Decode-and-count via ffmpeg as the absolute fallback.
            try:
                m = subprocess.run(
                    ["ffmpeg", "-i", str(file_path), "-f", "null", "-"],
                    capture_output=True, text=True, timeout=60,
                )
                # ffmpeg writes "time=HH:MM:SS.xx" lines on stderr
                import re
                last = None
                for match in re.finditer(r"time=(\d+):(\d+):(\d+\.\d+)", m.stderr):
                    last = match
                if last:
                    h, mm, ss = last.groups()
                    duration = int(h) * 3600 + int(mm) * 60 + float(ss)
            except Exception:
                pass

        if duration <= 0:
            raise ValueError("Audio file has zero or negative duration")

        if duration > MAX_DURATION_SECONDS:
            raise ValueError(
                f"Audio too long: {duration:.0f}s. "
                f"Maximum: {MAX_DURATION_SECONDS}s"
            )

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
