from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Project root (parent of the app/ package), not the current working directory.
ROOT_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """App settings loaded from environment variables or the root .env file."""

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Secure Document System"
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    max_upload_bytes: int = 10 * 1024 * 1024
    password_min_length: int = 12
    login_max_failed_attempts: int = 5
    login_failure_window_minutes: int = 15
    login_lockout_minutes: int = 15

    @field_validator("jwt_secret")
    @classmethod
    def jwt_secret_must_be_strong(cls, value: str) -> str:
        secret = value.strip()
        if len(secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters long")
        if len(set(secret)) < 8 or any(
            marker in secret.lower()
            for marker in ("dev-only", "replace-with", "change-me")
        ):
            raise ValueError("JWT_SECRET must be a unique random secret")
        return secret


settings = Settings()
