"""
Smoke test for the FastAPI app.

Boots the application via the in-process TestClient (no real HTTP server) and
verifies the health endpoint is wired up correctly under the `/api` prefix.

Run from inside `backend/`:
    pytest tests/test_api.py
"""

from fastapi.testclient import TestClient

from main import app


def test_health_endpoint_returns_healthy():
    """GET /api/health → 200 with status='healthy'."""
    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "healthy"
    # These fields are part of HealthResponse — presence check is enough here.
    assert "version" in body
    assert "transcription_backend" in body
    assert "whisper_model" in body
