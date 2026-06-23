"""
Application configuration — environment variable loader.

All settings come from environment variables (loaded from .env in dev).
"""
from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root, if present (no-op in production where the
# environment variables are injected by the host/container).
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


# ── Filesystem paths ────────────────────────────────────────────────────────
DATA_DIR = PROJECT_ROOT / "data"
CATALOG_PATH = DATA_DIR / "ip_catalog.json"
DOCUMENTS_DIR = DATA_DIR / "documents"
PUBLIC_DIR = PROJECT_ROOT / "public"


# ── Azure OpenAI settings ───────────────────────────────────────────────────
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_BASE_URL = os.getenv("AZURE_OPENAI_BASE_URL", "")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1")


# ── Server settings ─────────────────────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()

# Ensure data directories exist on startup.
DATA_DIR.mkdir(parents=True, exist_ok=True)
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
