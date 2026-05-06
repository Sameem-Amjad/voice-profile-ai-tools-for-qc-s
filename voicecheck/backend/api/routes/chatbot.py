from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI
from config import settings

router = APIRouter()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """You are VoiceCheck's helpful support assistant. VoiceCheck is an AI-powered voiceover accuracy tool that helps voice artists check their recordings against scripts.

Key features:
- Upload audio (MP3, WAV, M4A, OGG, FLAC, WebM) or record directly in the browser
- AI transcribes the audio using OpenAI Whisper
- Word-level comparison with the script using alignment algorithms
- Click on words to jump to that point in the audio
- Track your accuracy history in your dashboard
- Plans: Free Trial (30 min total), Starter ($20/mo, 5h/mo), Pro ($40/mo, 25h/mo)

Be helpful, concise, and friendly. If you don't know something, say so."""

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/chatbot", response_model=ChatResponse)
async def chatbot(body: ChatRequest):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="Chatbot not configured")

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": body.message[:500]},
        ],
        max_tokens=300,
        temperature=0.7,
    )
    return ChatResponse(reply=response.choices[0].message.content)
