from __future__ import annotations

import io
import zipfile
from pathlib import Path


ALLOWED_SUPPLIER_DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
    ".xls",
    ".xlsx",
}

ALLOWED_SUPPLIER_DOCUMENT_MIME_TYPES = {
    ".pdf": {"application/pdf"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".png": {"image/png"},
    ".jpg": {"image/jpeg", "image/jpg"},
    ".jpeg": {"image/jpeg", "image/jpg"},
    ".xls": {"application/vnd.ms-excel"},
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
}

INVALID_DOCUMENT_DETAIL = "Invalid file format. Allowed types: pdf, docx, png, jpg, jpeg, xls, xlsx."
MAX_SUPPLIER_DOCUMENT_SIZE = 10 * 1024 * 1024

PDF_SIGNATURE = b"%PDF-"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
JPEG_SOI = b"\xff\xd8\xff"
JPEG_EOI = b"\xff\xd9"
OLE_CFB_SIGNATURE = bytes.fromhex("D0CF11E0A1B11AE1")


class InvalidSupplierDocumentError(ValueError):
    pass


def _raise_invalid_document() -> None:
    raise InvalidSupplierDocumentError(INVALID_DOCUMENT_DETAIL)


def _validate_openxml_package(file_bytes: bytes, required_entries: set[str]) -> None:
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as archive:
            names = set(archive.namelist())
    except zipfile.BadZipFile:
        _raise_invalid_document()

    if not required_entries.issubset(names):
        _raise_invalid_document()


def validate_supplier_document_file(filename: str, content_type: str | None, file_bytes: bytes) -> None:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_SUPPLIER_DOCUMENT_EXTENSIONS:
        _raise_invalid_document()

    normalized_content_type = (content_type or "").lower()
    if normalized_content_type not in ALLOWED_SUPPLIER_DOCUMENT_MIME_TYPES[suffix]:
        _raise_invalid_document()

    if suffix == ".pdf":
        if not file_bytes.startswith(PDF_SIGNATURE):
            _raise_invalid_document()
        if b"%%EOF" not in file_bytes[-1024:]:
            _raise_invalid_document()
        return

    if suffix == ".png":
        if not file_bytes.startswith(PNG_SIGNATURE):
            _raise_invalid_document()
        return

    if suffix in {".jpg", ".jpeg"}:
        if len(file_bytes) < 4 or not file_bytes.startswith(JPEG_SOI) or not file_bytes.endswith(JPEG_EOI):
            _raise_invalid_document()
        return

    if suffix == ".xls":
        if not file_bytes.startswith(OLE_CFB_SIGNATURE):
            _raise_invalid_document()
        return

    if suffix == ".docx":
        _validate_openxml_package(file_bytes, {"[Content_Types].xml", "word/document.xml"})
        return

    if suffix == ".xlsx":
        _validate_openxml_package(file_bytes, {"[Content_Types].xml", "xl/workbook.xml"})
        return

    _raise_invalid_document()
