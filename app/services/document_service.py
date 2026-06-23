"""
Document service — stores uploaded files per-IP on disk with a sidecar
metadata.json. Mirrors artifacts/api-server/src/services/documentService.ts.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple

from app.config import DOCUMENTS_DIR
from app.schemas import IpDocument


def _docs_dir(ip_id: str) -> Path:
    return DOCUMENTS_DIR / ip_id


def _meta_path(ip_id: str) -> Path:
    return _docs_dir(ip_id) / "metadata.json"


def get_documents(ip_id: str) -> List[IpDocument]:
    meta = _meta_path(ip_id)
    if not meta.exists():
        return []
    try:
        raw = json.loads(meta.read_text(encoding="utf-8"))
        return [IpDocument(**d) for d in raw]
    except Exception:
        return []


def _save_documents(ip_id: str, docs: List[IpDocument]) -> None:
    d = _docs_dir(ip_id)
    d.mkdir(parents=True, exist_ok=True)
    _meta_path(ip_id).write_text(
        json.dumps([doc.model_dump() for doc in docs], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def add_document(ip_id: str, original_name: str, mime_type: str, data: bytes) -> IpDocument:
    doc_id = str(uuid.uuid4())
    ext = Path(original_name).suffix
    stored_name = f"{doc_id}{ext}"

    d = _docs_dir(ip_id)
    d.mkdir(parents=True, exist_ok=True)
    (d / stored_name).write_bytes(data)

    doc = IpDocument(
        id=doc_id,
        originalName=original_name,
        storedName=stored_name,
        size=len(data),
        uploadedAt=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        mimeType=mime_type or "application/octet-stream",
    )

    docs = get_documents(ip_id)
    docs.append(doc)
    _save_documents(ip_id, docs)
    return doc


def delete_document(ip_id: str, doc_id: str) -> bool:
    docs = get_documents(ip_id)
    for i, doc in enumerate(docs):
        if doc.id == doc_id:
            file_path = _docs_dir(ip_id) / doc.storedName
            if file_path.exists():
                try:
                    file_path.unlink()
                except OSError:
                    pass
            del docs[i]
            _save_documents(ip_id, docs)
            return True
    return False


def get_document_file(ip_id: str, doc_id: str) -> Optional[Tuple[Path, IpDocument]]:
    for doc in get_documents(ip_id):
        if doc.id == doc_id:
            return _docs_dir(ip_id) / doc.storedName, doc
    return None
