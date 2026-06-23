"""
Pydantic models — request bodies, response shapes, and the core IP entity.
These mirror the original Zod schemas in @workspace/api-zod 1:1.
"""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Core IP catalog entry ───────────────────────────────────────────────────
class IpItem(BaseModel):
    id: str
    name: str
    description: str
    businessProblems: List[str] = Field(default_factory=list)
    industries: List[str] = Field(default_factory=list)
    sapModules: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    triggerSignals: List[str] = Field(default_factory=list)
    valueProposition: str = ""
    pitch: str = ""
    differentiators: str = ""
    implementationEffort: str = "Medium"
    maturityLevel: str = "MVP"


class IpItemInput(BaseModel):
    """Body for create/update — same as IpItem without `id`."""
    name: str
    description: str
    businessProblems: List[str] = Field(default_factory=list)
    industries: List[str] = Field(default_factory=list)
    sapModules: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    triggerSignals: List[str] = Field(default_factory=list)
    valueProposition: str = ""
    pitch: str = ""
    differentiators: str = ""
    implementationEffort: str = "Medium"
    maturityLevel: str = "MVP"


# ── /analyze ────────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    transcript: str


class Insights(BaseModel):
    businessProblems: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    sapModules: List[str] = Field(default_factory=list)
    industry: str = ""


class IpRecommendation(BaseModel):
    ipId: str
    ipName: str
    score: int
    reason: str
    pitch: str
    implementationEffort: str
    maturityLevel: str


class AnalyzeResponse(BaseModel):
    insights: Insights
    recommendations: List[IpRecommendation]


# ── /analyze/email-pitch ────────────────────────────────────────────────────
class EmailPitchRequest(BaseModel):
    ipName: str
    customerContext: str
    reason: str


class EmailPitchResponse(BaseModel):
    subject: str
    body: str


# ── Documents ───────────────────────────────────────────────────────────────
class IpDocument(BaseModel):
    id: str
    originalName: str
    storedName: str
    size: int
    uploadedAt: str
    mimeType: str


# ── Catalog list response ───────────────────────────────────────────────────
class CatalogResponse(BaseModel):
    items: List[IpItem]


class DocumentsResponse(BaseModel):
    documents: List[IpDocument]


class HealthResponse(BaseModel):
    status: str = "ok"


class UploadResult(BaseModel):
    added: int
    skipped: int
    errors: List[str]
