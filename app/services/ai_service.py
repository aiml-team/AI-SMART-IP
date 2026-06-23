"""
AI service — wraps Azure OpenAI calls and the IP scoring algorithm.

This is a direct Python port of artifacts/api-server/src/services/aiService.ts.
Prompts and scoring weights are identical to the original implementation so
the user-facing output is unchanged.
"""
from __future__ import annotations

import json
import logging
from typing import List, Dict

from openai import AzureOpenAI

from app.config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_BASE_URL,
    AZURE_OPENAI_DEPLOYMENT,
)
from app.schemas import Insights, IpItem, IpRecommendation

logger = logging.getLogger("ai_service")


# ── Azure OpenAI client (constructed lazily so missing env vars don't crash
#    import-time; they only blow up when an AI route is actually hit). ───────
_client: AzureOpenAI | None = None


def _get_client() -> AzureOpenAI:
    global _client
    if _client is None:
        missing = [
            name
            for name, value in [
                ("AZURE_OPENAI_API_KEY", AZURE_OPENAI_API_KEY),
                ("AZURE_OPENAI_BASE_URL", AZURE_OPENAI_BASE_URL),
                ("AZURE_OPENAI_API_VERSION", AZURE_OPENAI_API_VERSION),
                ("AZURE_OPENAI_DEPLOYMENT", AZURE_OPENAI_DEPLOYMENT),
            ]
            if not value
        ]
        if missing:
            raise RuntimeError(
                f"Missing required Azure OpenAI env vars: {', '.join(missing)}"
            )
        _client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            azure_endpoint=AZURE_OPENAI_BASE_URL,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_deployment=AZURE_OPENAI_DEPLOYMENT,
        )
    return _client


# ── 1. Extract insights from a meeting transcript ───────────────────────────
def extract_insights(transcript: str) -> Insights:
    prompt = (
        "Analyze the following customer meeting transcript and extract:\n"
        "1. Key business problems (specific pain points mentioned)\n"
        "2. SAP modules or technologies mentioned\n"
        "3. Business keywords relevant to SAP solutions\n"
        "4. Industry (if identifiable)\n\n"
        "Return ONLY valid JSON with these exact keys: businessProblems (array of strings), "
        "keywords (array of strings), sapModules (array of strings), "
        "industry (string, empty string if not identifiable).\n\n"
        f"Transcript:\n{transcript}"
    )

    resp = _get_client().chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        max_completion_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    content = resp.choices[0].message.content if resp.choices else None
    if not content:
        raise RuntimeError("No response from AI model")

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse AI insights response: %s", content)
        raise RuntimeError("Failed to parse AI response as JSON") from e

    return Insights(
        businessProblems=parsed.get("businessProblems") or [],
        keywords=parsed.get("keywords") or [],
        sapModules=parsed.get("sapModules") or [],
        industry=parsed.get("industry") if isinstance(parsed.get("industry"), str) else "",
    )


# ── 2. Scoring helpers ──────────────────────────────────────────────────────
def _normalize(s: str) -> str:
    return s.lower().strip()


def _overlap_score(set_a: List[str], set_b: List[str]) -> float:
    if not set_a or not set_b:
        return 0.0
    na = [_normalize(x) for x in set_a]
    nb = [_normalize(x) for x in set_b]
    matches = 0
    for a in na:
        for b in nb:
            if a in b or b in a:
                matches += 1
                break
    return min(1.0, matches / max(len(na), 1))


def score_ip_catalog(insights: Insights, catalog: List[IpItem]) -> List[Dict]:
    """Return list of {ip, rawScore, breakdown} dicts, matching the JS shape."""
    scored: List[Dict] = []
    for ip in catalog:
        keyword_score = _overlap_score(
            list(insights.keywords) + list(insights.businessProblems),
            list(ip.keywords) + list(ip.triggerSignals),
        )
        problem_score = _overlap_score(insights.businessProblems, ip.businessProblems)
        module_score = _overlap_score(insights.sapModules, ip.sapModules)

        industry_match = (
            insights.industry == ""
            or any(
                _normalize(ind).find(_normalize(insights.industry)) >= 0
                or _normalize(insights.industry).find(_normalize(ind)) >= 0
                or _normalize(ind) == "all industries"
                for ind in ip.industries
            )
        )
        industry_score = 1.0 if industry_match else 0.0

        raw_score = (
            keyword_score * 0.4
            + problem_score * 0.3
            + module_score * 0.2
            + industry_score * 0.1
        )

        scored.append(
            {
                "ip": ip,
                "rawScore": raw_score,
                "breakdown": {
                    "keywordScore": keyword_score,
                    "problemScore": problem_score,
                    "moduleScore": module_score,
                    "industryScore": industry_score,
                },
            }
        )
    return scored


def get_top_ips(scored: List[Dict], count: int = 3) -> List[Dict]:
    return sorted(scored, key=lambda x: x["rawScore"], reverse=True)[:count]


# ── 3. Generate human-readable recommendation reasons + pitches ─────────────
def generate_recommendation_reasons(
    insights: Insights, top_ips: List[Dict]
) -> List[IpRecommendation]:
    ip_summaries = "\n\n".join(
        f"IP {idx + 1}: {item['ip'].name}\n"
        f"Description: {item['ip'].description}\n"
        f"Value Proposition: {item['ip'].valueProposition}\n"
        f"Business Problems Solved: {', '.join(item['ip'].businessProblems)}\n"
        f"SAP Modules: {', '.join(item['ip'].sapModules)}"
        for idx, item in enumerate(top_ips)
    )

    prompt = (
        "You are an SAP sales expert. A customer meeting revealed these insights:\n"
        f"Business Problems: {', '.join(insights.businessProblems)}\n"
        f"Keywords: {', '.join(insights.keywords)}\n"
        f"SAP Modules Mentioned: {', '.join(insights.sapModules)}\n"
        f"Industry: {insights.industry or 'Unknown'}\n\n"
        "Given these top IP candidates, write a compelling explanation of why each IP "
        "is relevant to this customer, and a customer-ready sales pitch.\n\n"
        f"{ip_summaries}\n\n"
        f"Return ONLY valid JSON as an array of {len(top_ips)} objects, each with:\n"
        "- \"reason\": A 2-3 sentence explanation of why this IP is relevant to the "
        "customer's specific situation\n"
        "- \"pitch\": A 2-3 sentence customer-ready sales message they can use in the "
        "next meeting\n\n"
        "Return as: { \"recommendations\": [...] }"
    )

    resp = _get_client().chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        max_completion_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    content = resp.choices[0].message.content if resp.choices else None
    if not content:
        raise RuntimeError("No response from AI model for recommendations")

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse recommendation response: %s", content)
        raise RuntimeError("Failed to parse recommendation response as JSON") from e

    recs_in = parsed.get("recommendations") or []

    out: List[IpRecommendation] = []
    for idx, item in enumerate(top_ips):
        ip: IpItem = item["ip"]
        ai_rec = recs_in[idx] if idx < len(recs_in) else {}
        out.append(
            IpRecommendation(
                ipId=ip.id,
                ipName=ip.name,
                score=round(item["rawScore"] * 100),
                reason=ai_rec.get("reason") or ip.valueProposition,
                pitch=ai_rec.get("pitch") or ip.pitch,
                implementationEffort=ip.implementationEffort,
                maturityLevel=ip.maturityLevel,
            )
        )
    return out


# ── 4. Generate a follow-up email pitch ─────────────────────────────────────
def generate_email_pitch(ip_name: str, customer_context: str, reason: str) -> Dict[str, str]:
    prompt = (
        "You are an SAP sales executive writing a follow-up email after a customer "
        "meeting.\n\n"
        f"IP Solution: {ip_name}\n"
        f"Customer Context: {customer_context}\n"
        f"Why It's Relevant: {reason}\n\n"
        "Write a professional, concise follow-up email pitching this SAP IP solution.\n\n"
        "Return ONLY valid JSON with:\n"
        "- \"subject\": Email subject line (concise, compelling)\n"
        "- \"body\": Email body (professional, 3-4 paragraphs, no generic filler, "
        "specific to the customer context)"
    )

    resp = _get_client().chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        max_completion_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    content = resp.choices[0].message.content if resp.choices else None
    if not content:
        raise RuntimeError("No response from AI model for email pitch")

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as e:
        raise RuntimeError("Failed to parse email pitch response") from e

    return {
        "subject": parsed.get("subject") or f"Following Up: {ip_name} for Your Business",
        "body": parsed.get("body") or "",
    }
