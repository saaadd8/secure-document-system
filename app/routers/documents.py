import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import ROOT_DIR
from app.database import get_db
from app.models import Document, User
from app.schemas import DocumentPublic
from app.security import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

STORAGE_DIR = ROOT_DIR / "storage" / "documents"
PDF_CONTENT_TYPE = "application/pdf"


def _is_pdf_upload(filename: str, content_type: str | None) -> bool:
    """MVP check: original name must end with .pdf and type must be PDF if provided."""
    if not filename.lower().endswith(".pdf"):
        return False
    if content_type:
        media_type = content_type.split(";")[0].strip().lower()
        if media_type and media_type != PDF_CONTENT_TYPE:
            return False
    return True


@router.get("", response_model=list[DocumentPublic])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's documents, newest first."""
    return (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.post(
    "/upload",
    response_model=DocumentPublic,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Store a PDF on disk and save its metadata. Requires a valid JWT."""
    original_name = Path(file.filename or "").name
    if not original_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A filename is required",
        )
    if not _is_pdf_upload(original_name, file.content_type):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are allowed",
        )
    if len(original_name) > 255:
        original_name = original_name[:255]

    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    file_size = len(contents)
    sha256_hash = hashlib.sha256(contents).hexdigest()

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}.pdf"
    stored_path = STORAGE_DIR / stored_name
    relative_path = stored_path.relative_to(ROOT_DIR).as_posix()

    try:
        stored_path.write_bytes(contents)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save uploaded file",
        ) from exc

    document = Document(
        owner_id=current_user.id,
        filename=original_name,
        file_path=relative_path,
        document_type="PDF",
        file_size=file_size,
        sha256_hash=sha256_hash,
    )
    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception as exc:
        db.rollback()
        stored_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save document metadata",
        ) from exc

    return document
