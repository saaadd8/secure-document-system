"""Helpers for recording document audit events."""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import AuditLog


def record_audit_event(
    db: Session,
    *,
    user_id: int | None,
    document_id: int | None,
    action: str,
    details: str | None = None,
) -> AuditLog:
    """Add an audit row to the current transaction without committing it."""
    audit_log = AuditLog(
        user_id=user_id,
        document_id=document_id,
        action=action,
        timestamp=datetime.now(timezone.utc),
        details=details,
    )
    db.add(audit_log)
    return audit_log
