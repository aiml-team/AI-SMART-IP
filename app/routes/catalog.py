"""
IP Catalog CRUD + bulk Excel upload.

Endpoints:
    GET    /api/catalog
    POST   /api/catalog
    POST   /api/catalog/upload         (multipart Excel file)
    GET    /api/catalog/{ip_id}
    PUT    /api/catalog/{ip_id}
    DELETE /api/catalog/{ip_id}
"""
from __future__ import annotations

import io
import logging
import re
from typing import List

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas import CatalogResponse, IpItem, IpItemInput, UploadResult
from app.services import catalog_service

logger = logging.getLogger("catalog")
router = APIRouter()


# ── List + create ───────────────────────────────────────────────────────────
@router.get("/catalog", response_model=CatalogResponse)
def list_catalog() -> CatalogResponse:
    try:
        return CatalogResponse(items=catalog_service.get_catalog())
    except Exception:
        logger.exception("Error loading catalog")
        raise HTTPException(
            status_code=500,
            detail={"error": "catalog_load_failed", "message": "Failed to load IP catalog"},
        )


@router.post("/catalog", response_model=IpItem, status_code=201)
def create_catalog_entry(body: IpItemInput) -> IpItem:
    try:
        catalog = catalog_service.get_catalog()
        ip_id = catalog_service.generate_ip_id(catalog)
        new_ip = IpItem(id=ip_id, **body.model_dump())
        catalog_service.add_ip_entry(new_ip)
        return new_ip
    except Exception as e:
        logger.exception("Error creating IP entry")
        raise HTTPException(
            status_code=500,
            detail={"error": "create_failed", "message": str(e)},
        )


# ── Bulk Excel upload ───────────────────────────────────────────────────────
def _parse_list(val) -> List[str]:
    if val is None:
        return []
    s = str(val).strip()
    if not s:
        return []
    return [part.strip() for part in re.split(r"[,;|]+", s) if part.strip()]


def _pick(row: dict, *keys: str) -> str:
    """Return the first non-empty trimmed value for any of the given keys."""
    for k in keys:
        if k in row:
            v = row[k]
            if v is None:
                continue
            s = str(v).strip()
            if s:
                return s
    return ""


@router.post("/catalog/upload", response_model=UploadResult)
async def upload_catalog(file: UploadFile = File(...)) -> UploadResult:
    if not file or not file.filename:
        raise HTTPException(
            status_code=400,
            detail={"error": "no_file", "message": "No file uploaded"},
        )

    ext = (file.filename.rsplit(".", 1)[-1] or "").lower()
    if ext not in ("xlsx", "xls"):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_file_type",
                "message": "Only .xlsx or .xls files are supported",
            },
        )

    try:
        contents = await file.read()
        engine = "openpyxl" if ext == "xlsx" else "xlrd"
        df = pd.read_excel(io.BytesIO(contents), engine=engine, dtype=str)
        df = df.fillna("")
        rows = df.to_dict(orient="records")

        catalog = catalog_service.get_catalog()
        errors: List[str] = []
        added = 0
        skipped = 0

        for i, row in enumerate(rows):
            row_num = i + 2  # +1 for 0-index, +1 for header row

            name = _pick(row, "name", "Name")
            description = _pick(row, "description", "Description")
            value_proposition = _pick(
                row, "valueProposition", "Value Proposition", "value_proposition"
            )
            pitch = _pick(row, "pitch", "Pitch")

            if not name or not description:
                errors.append(
                    f"Row {row_num}: missing required fields 'name' or 'description'"
                )
                skipped += 1
                continue

            ip_id = catalog_service.generate_ip_id(catalog)

            ip = IpItem(
                id=ip_id,
                name=name,
                description=description,
                businessProblems=_parse_list(
                    _pick(row, "businessProblems", "Business Problems", "business_problems")
                ),
                industries=_parse_list(_pick(row, "industries", "Industries")),
                sapModules=_parse_list(
                    _pick(row, "sapModules", "SAP Modules", "sap_modules")
                ),
                keywords=_parse_list(_pick(row, "keywords", "Keywords")),
                triggerSignals=_parse_list(
                    _pick(row, "triggerSignals", "Trigger Signals", "trigger_signals")
                ),
                valueProposition=value_proposition,
                pitch=pitch,
                differentiators=_pick(row, "differentiators", "Differentiators"),
                implementationEffort=_pick(
                    row,
                    "implementationEffort",
                    "Implementation Effort",
                    "implementation_effort",
                ) or "Medium",
                maturityLevel=_pick(
                    row, "maturityLevel", "Maturity Level", "maturity_level"
                ) or "MVP",
            )

            catalog.append(ip)
            added += 1

        if added > 0:
            catalog_service.save_catalog(catalog)

        return UploadResult(added=added, skipped=skipped, errors=errors)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error processing Excel upload")
        raise HTTPException(
            status_code=500,
            detail={"error": "upload_failed", "message": str(e)},
        )


# ── Single IP CRUD ──────────────────────────────────────────────────────────
@router.get("/catalog/{ip_id}", response_model=IpItem)
def get_catalog_entry(ip_id: str) -> IpItem:
    ip = catalog_service.get_ip_by_id(ip_id)
    if not ip:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"IP {ip_id} not found"},
        )
    return ip


@router.put("/catalog/{ip_id}", response_model=IpItem)
def update_catalog_entry(ip_id: str, body: IpItemInput) -> IpItem:
    updated = catalog_service.update_ip_entry(ip_id, body)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"IP {ip_id} not found"},
        )
    return updated


@router.delete("/catalog/{ip_id}")
def delete_catalog_entry(ip_id: str) -> dict:
    if not catalog_service.delete_ip_entry(ip_id):
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"IP {ip_id} not found"},
        )
    return {"success": True}
