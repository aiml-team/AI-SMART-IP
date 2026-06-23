"""
POST /api/analyze              — extract insights + score catalog + recommend
POST /api/analyze/email-pitch  — generate a follow-up email
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    EmailPitchRequest,
    EmailPitchResponse,
)
from app.services import ai_service, catalog_service

logger = logging.getLogger("analyze")
router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest) -> AnalyzeResponse:
    transcript = (body.transcript or "").strip()
    if not transcript:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_input", "message": "Transcript cannot be empty"},
        )

    try:
        catalog = catalog_service.get_catalog()
        insights = ai_service.extract_insights(transcript)
        scored = ai_service.score_ip_catalog(insights, catalog)
        top = ai_service.get_top_ips(scored, 3)
        recommendations = ai_service.generate_recommendation_reasons(insights, top)
        return AnalyzeResponse(insights=insights, recommendations=recommendations)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error analyzing transcript")
        raise HTTPException(
            status_code=500,
            detail={"error": "analysis_failed", "message": str(e)},
        )


@router.post("/analyze/email-pitch", response_model=EmailPitchResponse)
def email_pitch(body: EmailPitchRequest) -> EmailPitchResponse:
    try:
        result = ai_service.generate_email_pitch(
            body.ipName, body.customerContext, body.reason
        )
        return EmailPitchResponse(**result)
    except Exception as e:
        logger.exception("Error generating email pitch")
        raise HTTPException(
            status_code=500,
            detail={"error": "pitch_generation_failed", "message": str(e)},
        )
