# SoundProof — AI Voiceover Accuracy Tool

Compare voiceover recordings against scripts with word-level AI accuracy.

## Quick Start (Docker — Recommended)

```bash
git clone <repo>
cd voicecheck
cp .env.example .env

# Start everything
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

First run downloads the Whisper model (~150MB for base). Subsequent starts are instant.

## Local Development (No Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

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
   ```
   TRANSCRIPTION_BACKEND=openai_api
   OPENAI_API_KEY=sk-...
   ```

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
