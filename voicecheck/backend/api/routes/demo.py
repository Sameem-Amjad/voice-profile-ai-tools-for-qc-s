"""
Portfolio demo: one-click sign-in and sample recordings visitors can run without
a file of their own. Only mounted when DEMO_MODE is on (main.py).

POST /api/demo/sign-in             {account: "narrator" | "admin"} → {ticket}
GET  /api/demo/samples              → [{slug, title, kind, duration, script}]
GET  /api/demo/samples/{slug}.mp3   → the recording
"""

from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel

from core.limiter import limiter
from services import demo

router = APIRouter()


class DemoSignInRequest(BaseModel):
    account: Literal["narrator", "admin"]


@router.post("/demo/sign-in")
@limiter.limit("10/minute")
async def demo_sign_in(request: Request, body: DemoSignInRequest):
    return {"ticket": await demo.sign_in_ticket(body.account)}


@router.get("/demo/samples")
async def list_samples():
    return demo.samples()


@router.get("/demo/samples/{slug}.mp3")
async def get_sample(slug: str):
    path = demo.sample_file(slug)
    if not path:
        raise HTTPException(status_code=404, detail="Sample not found")
    return FileResponse(path, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400"})
