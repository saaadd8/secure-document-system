from datetime import datetime, timedelta, timezone
from threading import Lock

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

bearer_scheme = HTTPBearer()

_invalid_token = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token",
    headers={"WWW-Authenticate": "Bearer"},
)


class LoginAttemptLimiter:
    """Small in-memory limiter for failed logins, keyed by normalized email."""

    def __init__(self):
        self._attempts: dict[str, tuple[int, datetime, datetime | None]] = {}
        self._lock = Lock()

    def is_limited(self, key: str) -> bool:
        now = datetime.now(timezone.utc)
        with self._lock:
            state = self._attempts.get(key)
            if state is None:
                return False
            _, window_started, locked_until = state
            if locked_until is not None:
                if locked_until > now:
                    return True
                self._attempts.pop(key, None)
                return False
            if now - window_started >= timedelta(
                minutes=settings.login_failure_window_minutes
            ):
                self._attempts.pop(key, None)
            return False

    def record_failure(self, key: str) -> bool:
        """Record a failure and return whether the key is now rate limited."""
        now = datetime.now(timezone.utc)
        with self._lock:
            count, window_started, locked_until = self._attempts.get(
                key,
                (0, now, None),
            )
            if locked_until is not None and locked_until > now:
                return True
            if now - window_started >= timedelta(
                minutes=settings.login_failure_window_minutes
            ):
                count, window_started = 0, now
            count += 1
            if count >= settings.login_max_failed_attempts:
                locked_until = now + timedelta(minutes=settings.login_lockout_minutes)
                self._attempts[key] = (count, window_started, locked_until)
                return True
            self._attempts[key] = (count, window_started, None)
            return False

    def reset(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._attempts.clear()


login_attempt_limiter = LoginAttemptLimiter()


def hash_password(password: str) -> str:
    """Hash a plaintext password. Store only the returned string in the database."""
    password_bytes = password.encode("utf-8")
    hashed_bytes = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Return True only when the plaintext password matches the stored hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except ValueError:
        return False


def create_access_token(user_id: int) -> str:
    """Create a signed JWT whose subject is the user id."""
    expire = datetime.now(timezone.utc) + \
        timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Read the Bearer JWT, verify it, and load the matching User."""
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp"]},
        )
        subject = payload.get("sub")
        user_id = int(subject)
    except (jwt.PyJWTError, TypeError, ValueError):
        raise _invalid_token

    user = db.get(User, user_id)
    if user is None:
        raise _invalid_token
    return user
