"""
Catalog service — reads/writes the JSON-backed IP catalog and provides CRUD.

Mirrors the original artifacts/api-server/src/services/catalogService.ts.
"""
from __future__ import annotations

import json
import re
import threading
from typing import List, Optional

from app.config import CATALOG_PATH
from app.schemas import IpItem, IpItemInput


# In-memory cache + a lock to keep concurrent FastAPI requests safe.
_cache: Optional[List[IpItem]] = None
_lock = threading.Lock()


def _load_from_disk() -> List[IpItem]:
    if not CATALOG_PATH.exists():
        return []
    raw = CATALOG_PATH.read_text(encoding="utf-8")
    data = json.loads(raw)
    return [IpItem(**item) for item in data]


def _persist(catalog: List[IpItem]) -> None:
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    serialized = [item.model_dump() for item in catalog]
    CATALOG_PATH.write_text(
        json.dumps(serialized, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def get_catalog() -> List[IpItem]:
    """Return the in-memory catalog, loading from disk on first access."""
    global _cache
    with _lock:
        if _cache is None:
            _cache = _load_from_disk()
        # Return a shallow copy so callers can't mutate cache via the list ref.
        return list(_cache)


def save_catalog(catalog: List[IpItem]) -> None:
    global _cache
    with _lock:
        _persist(catalog)
        _cache = list(catalog)


def get_ip_by_id(ip_id: str) -> Optional[IpItem]:
    for item in get_catalog():
        if item.id == ip_id:
            return item
    return None


def add_ip_entry(ip: IpItem) -> IpItem:
    catalog = get_catalog()
    catalog.append(ip)
    save_catalog(catalog)
    return ip


def delete_ip_entry(ip_id: str) -> bool:
    catalog = get_catalog()
    new_catalog = [item for item in catalog if item.id != ip_id]
    if len(new_catalog) == len(catalog):
        return False
    save_catalog(new_catalog)
    return True


def update_ip_entry(ip_id: str, fields: IpItemInput) -> Optional[IpItem]:
    catalog = get_catalog()
    for idx, item in enumerate(catalog):
        if item.id == ip_id:
            updated = IpItem(id=ip_id, **fields.model_dump())
            catalog[idx] = updated
            save_catalog(catalog)
            return updated
    return None


def generate_ip_id(catalog: List[IpItem]) -> str:
    """Generate the next IPXXX identifier, mirroring the TS implementation."""
    pattern = re.compile(r"^IP(\d+)$")
    existing_nums: List[int] = []
    for item in catalog:
        m = pattern.match(item.id)
        if m:
            existing_nums.append(int(m.group(1)))
    next_num = max(existing_nums) + 1 if existing_nums else 1
    return f"IP{next_num:03d}"
