# AI-IP-Recommender (Smart IP Advisor) — Python / FastAPI

Single-service FastAPI app that serves both the JSON API and the prebuilt
React SPA. The UI is unchanged; only the backend was rewritten from
Node.js + Express to Python + FastAPI so future agents can be added easily.

## Project layout

```
.
├── main.py                 # FastAPI app + uvicorn entrypoint
├── requirements.txt        # Python dependencies
├── .env                    # Azure OpenAI credentials (gitignored)
├── app/
│   ├── config.py           # env loader + paths
│   ├── schemas.py          # Pydantic request/response models
│   ├── services/
│   │   ├── ai_service.py        # Azure OpenAI + scoring
│   │   ├── catalog_service.py   # IP catalog CRUD (JSON-backed)
│   │   └── document_service.py  # per-IP document storage
│   └── routes/
│       ├── health.py       # GET  /api/healthz
│       ├── analyze.py      # POST /api/analyze, /api/analyze/email-pitch
│       ├── catalog.py      # /api/catalog, /api/catalog/{id}, /api/catalog/upload
│       └── documents.py    # /api/catalog/{id}/documents/*
├── data/
│   ├── ip_catalog.json     # the IP catalog
│   └── documents/          # uploaded per-IP files (gitignored)
└── public/                 # prebuilt React SPA (index.html, assets/, ...)
```

## Setup

```bash
# 1. (recommended) create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. install dependencies
pip install -r requirements.txt
```

## Environment variables

Copy `.env.example` to `.env` (or edit the existing `.env`) and fill in:

```
PORT=8000
AZURE_OPENAI_DEPLOYMENT=gpt-4.1
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_BASE_URL=https://<your-resource>.openai.azure.com/
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

Then open http://localhost:8000 — the SPA loads from `./public` and talks to
the API at `/api/*` on the same origin.

Interactive API docs are at http://localhost:8000/docs.

## API endpoints

| Method | Path                                           | Purpose                        |
| ------ | ---------------------------------------------- | ------------------------------ |
| GET    | `/api/healthz`                                 | liveness probe                 |
| POST   | `/api/analyze`                                 | analyze transcript + recommend |
| POST   | `/api/analyze/email-pitch`                     | generate follow-up email       |
| GET    | `/api/catalog`                                 | list all IPs                   |
| POST   | `/api/catalog`                                 | create an IP                   |
| POST   | `/api/catalog/upload`                          | bulk import IPs from Excel     |
| GET    | `/api/catalog/{id}`                            | get one IP                     |
| PUT    | `/api/catalog/{id}`                            | update an IP                   |
| DELETE | `/api/catalog/{id}`                            | delete an IP                   |
| GET    | `/api/catalog/{id}/documents`                  | list IP documents              |
| POST   | `/api/catalog/{id}/documents`                  | upload a document              |
| DELETE | `/api/catalog/{id}/documents/{docId}`          | delete a document              |
| GET    | `/api/catalog/{id}/documents/{docId}/download` | download a document            |
