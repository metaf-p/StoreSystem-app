from pathlib import Path
import io
import sys
import unittest
import zipfile
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "products_service"))

from app.document_validation import InvalidSupplierDocumentError, validate_supplier_document_file


def _make_zip_bytes(entries: dict[str, bytes]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in entries.items():
            archive.writestr(name, data)
    return buffer.getvalue()


class ValidateSupplierDocumentFileTest(unittest.TestCase):
    def assertInvalid(self, filename: str, content_type: Optional[str], file_bytes: bytes):
        with self.assertRaises(InvalidSupplierDocumentError) as context:
            validate_supplier_document_file(filename, content_type, file_bytes)
        self.assertIn("Invalid file format", str(context.exception))

    def test_accepts_pdf_signature_and_mime(self):
        file_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\nstartxref\n0\n%%EOF"
        validate_supplier_document_file("contract.pdf", "application/pdf", file_bytes)

    def test_rejects_pdf_with_octet_stream_mime(self):
        file_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\nstartxref\n0\n%%EOF"
        self.assertInvalid("contract.pdf", "application/octet-stream", file_bytes)

    def test_rejects_pdf_with_mime_mismatch(self):
        file_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\nstartxref\n0\n%%EOF"
        self.assertInvalid("contract.pdf", "image/png", file_bytes)

    def test_rejects_pdf_with_wrong_signature(self):
        self.assertInvalid("contract.pdf", "application/pdf", b"not a pdf")

    def test_accepts_docx_zip_package(self):
        file_bytes = _make_zip_bytes(
            {
                "[Content_Types].xml": b"<Types />",
                "word/document.xml": b"<w:document />",
            }
        )
        validate_supplier_document_file(
            "agreement.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_bytes,
        )

    def test_accepts_xlsx_zip_package(self):
        file_bytes = _make_zip_bytes(
            {
                "[Content_Types].xml": b"<Types />",
                "xl/workbook.xml": b"<workbook />",
            }
        )
        validate_supplier_document_file(
            "prices.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            file_bytes,
        )

    def test_accepts_png_signature(self):
        file_bytes = b"\x89PNG\r\n\x1a\n" + b"fake-png-data"
        validate_supplier_document_file("spec.png", "image/png", file_bytes)

    def test_accepts_jpg_signature(self):
        file_bytes = b"\xff\xd8\xff" + b"fake-jpg-data" + b"\xff\xd9"
        validate_supplier_document_file("photo.jpg", "image/jpeg", file_bytes)

    def test_accepts_xls_signature(self):
        file_bytes = bytes.fromhex("D0CF11E0A1B11AE1") + b"fake-xls-data"
        validate_supplier_document_file("prices.xls", "application/vnd.ms-excel", file_bytes)

    def test_rejects_wrong_extension(self):
        self.assertInvalid("notes.txt", "text/plain", b"plain text")


if __name__ == "__main__":
    unittest.main()
