from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """A person who can later sign in to the document system."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="USER", server_default="USER")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    documents: Mapped[list["Document"]] = relationship(
        back_populates="owner",
    )
    received_document_shares: Mapped[list["DocumentShare"]] = relationship(
        back_populates="shared_with_user",
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="user")


class Document(Base):
    """Metadata for a stored file. The file itself lives on disk/storage, not in PostgreSQL."""

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    owner: Mapped["User"] = relationship(back_populates="documents")
    shares: Mapped[list["DocumentShare"]] = relationship(back_populates="document")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="document")


class DocumentShare(Base):
    """A recipient's permission to access a document owned by another user."""

    __tablename__ = "document_shares"
    __table_args__ = (
        CheckConstraint(
            "permission IN ('VIEW', 'DOWNLOAD')",
            name="ck_document_shares_permission",
        ),
        UniqueConstraint(
            "document_id",
            "shared_with_user_id",
            name="uq_document_shares_document_recipient",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        nullable=False,
        index=True,
    )
    shared_with_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    permission: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    revoked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    document: Mapped["Document"] = relationship(back_populates="shares")
    shared_with_user: Mapped["User"] = relationship(
        back_populates="received_document_shares",
    )


class AuditLog(Base):
    """A record of a document-related action performed by a user."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    details: Mapped[str] = mapped_column(String(1000), nullable=True)
    user: Mapped["User"] = relationship(back_populates="audit_logs")
    document: Mapped["Document"] = relationship(back_populates="audit_logs")
