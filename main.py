"""
AI-IP-Recommender — FastAPI application entrypoint.

Run:
    uvicorn main:app --reload --port 8000

This single service exposes:
  • the JSON API under /api/*
  • the prebuilt React SPA at  / (served from ./public)

The API surface (paths, methods, request bodies, response shapes) is identical
to the previous Node/Express implementation so the existing frontend works
without any change.
"""
from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import LOG_LEVEL, PUBLIC_DIR
from app.routes import analyze, catalog, documents, health


# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")


# ── FastAPI app ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI-IP-Recommender",
    description="Smart IP Advisor — SAP IP recommendation engine.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── API routes (all under /api) ─────────────────────────────────────────────
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(catalog.router, prefix="/api", tags=["catalog"])
app.include_router(documents.router, prefix="/api", tags=["documents"])


# ── Serve the prebuilt SPA from ./public (if present) ───────────────────────
if PUBLIC_DIR.exists() and (PUBLIC_DIR / "index.html").exists():
    logger.info("Serving frontend static files from %s", PUBLIC_DIR)

    # Mount the /assets directory and any other top-level static files.
    assets_dir = PUBLIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # SPA fallback: any non-/api path returns the SPA's index.html so the
    # client-side router (wouter) can take over. Static files like favicon.svg
    # are handled inline below.
    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        # API routes are handled above; anything starting with `api/` that gets
        # here is genuinely unmatched -> 404 via FastAPI default.
        if full_path.startswith("api/") or full_path == "api":
            return FileResponse(
                PUBLIC_DIR / "index.html", status_code=404
            )  # safe fallback

        # Serve real files that exist at the top level of /public verbatim.
        candidate = PUBLIC_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)

        # Otherwise return the SPA shell.
        return FileResponse(PUBLIC_DIR / "index.html")
else:
    logger.warning(
        "No frontend build found at %s — API will be served, but the SPA will not.",
        PUBLIC_DIR,
    )


# ── Allow running with: python main.py ──────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
