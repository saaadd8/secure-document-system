from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogPublic
from app.security import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogPublic])
def list_audit_logs(
    document_id: int | None = None,
    action: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return audit logs to administrators, newest first."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    query = db.query(AuditLog)
    if document_id is not None:
        query = query.filter(AuditLog.document_id == document_id)
    if action is not None:
        query = query.filter(AuditLog.action == action)

    return query.order_by(AuditLog.timestamp.desc()).all()
