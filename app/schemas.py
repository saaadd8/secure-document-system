from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    """JSON body for POST /auth/register."""

    name: str = Field(min_length=1)
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Password cannot be empty")
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
