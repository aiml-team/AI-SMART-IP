"""
Per-IP document management:

    GET    /api/catalog/{ip_id}/documents
    POST   /api/catalog/{ip_id}/documents                       (multipart file)
    DELETE /api/catalog/{ip_id}/documents/{doc_id}
    GET    /api/catalog/{ip_id}/documents/{doc_id}/download
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.schemas import DocumentsResponse, IpDocument
from app.services import catalog_service, document_service

logger = logging.getLogger("documents")
router = APIRouter()


def _require_ip(ip_id: str) -> None:
    if catalog_service.get_ip_by_id(ip_id) is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"IP {ip_id} not found"},
        )


@router.get("/catalog/{ip_id}/documents", response_model=DocumentsResponse)
def list_documents(ip_id: str) -> DocumentsResponse:
    _require_ip(ip_id)
    return DocumentsResponse(documents=document_service.get_documents(ip_id))


@router.post("/catalog/{ip_id}/documents", response_model=IpDocument, status_code=201)
async def upload_document(ip_id: str, file: UploadFile = File(...)) -> IpDocument:
    _require_ip(ip_id)

    if not file or not file.filename:
        raise HTTPException(
            status_code=400,
            detail={"error": "no_file", "message": "No file uploaded"},
        )

    try:
        data = await file.read()
        return document_service.add_document(
            ip_id,
            file.filename,
            file.content_type or "application/octet-stream",
            data,
        )
    except Exception as e:
        logger.exception("Error uploading document")
        raise HTTPException(
            status_code=500,
            detail={"error": "upload_failed", "message": str(e)},
        )


@router.delete("/catalog/{ip_id}/documents/{doc_id}")
def delete_document(ip_id: str, doc_id: str) -> dict:
    _require_ip(ip_id)
    if not document_service.delete_document(ip_id, doc_id):
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Document not found"},
        )
    return {"success": True}


@router.get("/catalog/{ip_id}/documents/{doc_id}/download")
def download_document(ip_id: str, doc_id: str) -> FileResponse:
    result = document_service.get_document_file(ip_id, doc_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Document not found"},
        )
    path, doc = result
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Document file missing on disk"},
        )
    return FileResponse(
        path=str(path),
        filename=doc.originalName,
        media_type=doc.mimeType or "application/octet-stream",
    )
