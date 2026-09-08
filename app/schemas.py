from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.config import settings


class UserRegister(BaseModel):
    """JSON body for POST /auth/register."""

    name: str = Field(min_length=1)
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_is_strong(cls, value: str) -> str:
        if len(value) < settings.password_min_length:
            raise ValueError(
                f"Password must be at least {settings.password_min_length} characters long"
            )
        if not any(character.islower() for character in value):
            raise ValueError("Password must include a lowercase letter")
        if not any(character.isupper() for character in value):
            raise ValueError("Password must include an uppercase letter")
        if not any(character.isdigit() for character in value):
            raise ValueError("Password must include a number")
        return value


class UserLogin(BaseModel):
    """JSON body for POST /auth/login."""

    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Password cannot be empty")
        return value


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMe(BaseModel):
    """Safe current-user payload. Never includes password or password_hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str


class UserPublic(BaseModel):
    """Safe user payload. Never includes password or password_hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime


class DocumentPublic(BaseModel):
    """Document metadata. Never includes file bytes."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    filename: str
    file_path: str
    document_type: str
    file_size: int
    sha256_hash: str
    created_at: datetime
    updated_at: datetime


class DocumentVerify(BaseModel):
    """Integrity check result for a stored PDF."""

    document_id: int
    filename: str
    valid: bool
    stored_hash: str
    current_hash: str


class DocumentShareCreate(BaseModel):
    """Payload for granting a user access to a document."""

    recipient_email: EmailStr
    permission: Literal["VIEW", "DOWNLOAD"]
    expires_at: datetime | None = None


class DocumentSharePublic(BaseModel):
    """Safe document-sharing metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    shared_with_user_id: int
    permission: Literal["VIEW", "DOWNLOAD"]
    created_at: datetime
    expires_at: datetime | None
    revoked_at: datetime | None


class SharedDocumentPublic(BaseModel):
    """An active share and the document metadata available to its recipient."""

    document: DocumentPublic
    permission: Literal["VIEW", "DOWNLOAD"]
    expires_at: datetime | None


class AuditLogPublic(BaseModel):
    """Audit-log metadata available to administrators."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    document_id: int | None
    action: str
    timestamp: datetime
    details: str | None
