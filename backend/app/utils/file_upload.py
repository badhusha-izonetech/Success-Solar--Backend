"""
File upload utilities — multipart upload, path resolution, validation.
Replaces frontend base64 DataURL approach with real file storage.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOC_TYPES = {"application/pdf", "image/jpeg", "image/jpg", "image/png"}


def _ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def _upload_dir() -> Path:
    return Path(settings.UPLOAD_DIR)


async def save_upload(
    file: UploadFile,
    subfolder: str,
    allowed_types: set[str] | None = None,
) -> str:
    """
    Validate and save an uploaded file.
    Returns the relative URL path (e.g. 'uploads/payment_proofs/abc.jpg').
    """
    if allowed_types and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{file.content_type}' not allowed.",
        )

    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit.",
        )

    ext = Path(file.filename or "file").suffix or ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_dir = _ensure_dir(_upload_dir() / subfolder)
    dest_path = dest_dir / filename

    with open(dest_path, "wb") as f:
        f.write(content)

    return f"{settings.UPLOAD_DIR}/{subfolder}/{filename}"


async def save_field_visit_photo(file: UploadFile) -> str:
    return await save_upload(file, "field_visit_photos", ALLOWED_IMAGE_TYPES)


async def save_payment_proof(file: UploadFile) -> str:
    return await save_upload(file, "payment_proofs", ALLOWED_DOC_TYPES)


async def save_quotation_document(file: UploadFile) -> str:
    return await save_upload(file, "quotation_documents", ALLOWED_DOC_TYPES)
