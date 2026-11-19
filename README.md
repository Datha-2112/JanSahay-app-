# JanSahay

JanSahay is a mobile-first civic information MVP for asking about Indian public benefit schemes, checking preliminary eligibility, and getting help understanding government notices. It supports English, Telugu, and Hindi UI selection and uses a local, curated JSON catalog.

## Run locally

Requirements: Python 3.11+ and Node.js 20+.

In one terminal:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The API is at http://localhost:8000 and its OpenAPI page is at http://localhost:8000/docs. Copy `.env.example` to `.env`, add a Gemini API key from Google AI Studio, and set `CORS_ORIGINS` and `VITE_API_URL` if the ports differ. `docker compose up` is also available.

## Current implementation

- FastAPI endpoints for chat, scheme browse/detail, notice upload response, voice fallbacks, and health.
- In-memory session profile with a configurable 30-minute default TTL; the app does not save chat messages or uploaded files.
- Deterministic eligibility rule engine. Missing or uncurated rule data produces `Maybe`, never an assumed pass.
- Responsive React interface with language selector, scheme catalog, chat, notice upload result, source links, listen, and browser speech input/output when supported.
- Offline-friendly keyword retrieval fallback that only returns catalog content; unknown questions receive a safe response.
- Optional Gemini grounded explanations for matched scheme records when `LLM_PROVIDER=gemini` and a key is configured. The model receives only the matched local scheme record and user question; a local answer is used if Gemini is unavailable.

## Catalog review status

The 12 records in `data/schemes/` are starter records. Each links to an official portal, but most still need a human review against current official scheme guidelines before they can be treated as verified. Their citations therefore say **Needs official verification**. Some have intentionally incomplete eligibility rules and return `Maybe`. PM-KISAN, MGNREGA, and NTR Bharosa links were checked against their government portals during project setup; check the portals again before relying on changing amounts or eligibility. Do not treat this demo as an official decision.

Run `make validate` (or `python scripts/validate_schemes.py` from `backend`) to validate the catalog shape. This project is an MVP scaffold: production RAG/vector indexing, server-side STT/TTS/OCR adapters, robust rate limiting, automated privacy/security evaluation, and the full eligibility interview remain future implementation work.

## API

- `POST /api/chat`
- `POST /api/notice/explain`
- `POST /api/voice/stt`
- `POST /api/voice/tts`
- `GET /api/schemes` and `GET /api/schemes/{scheme_id}?lang=te`
- `GET /api/health`

All user-facing decisions are informational. Confirm details with the responsible government office or official source.

## Deployment status

The current Docker Compose setup is for local development, not production deployment. Before a public launch, add production container builds and a static frontend server, set secrets and allowed origins in the deployment platform, use HTTPS, move rate limiting to a shared store, and finish validating scheme content. OCR and server-side STT/TTS are still fallbacks/placeholders, and scheme answers should not be treated as official decisions.
