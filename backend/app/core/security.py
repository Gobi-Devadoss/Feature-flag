from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _bcrypt_compatible_password(password: str) -> str:
    """BCrypt supports passwords up to 72 bytes. Truncate to the safe limit."""
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    return pwd_context.hash(_bcrypt_compatible_password(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(_bcrypt_compatible_password(plain_password), hashed_password)
    except ValueError:
        return False


def create_token(subject: str, expires_delta: timedelta, extra_claims: Optional[dict] = None, token_type: str = "access") -> str:
    now = datetime.now(timezone.utc)
    to_encode: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + expires_delta,
        "type": token_type,
    }
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: str, extra_claims: Optional[dict] = None) -> str:
    return create_token(
        subject,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims,
        token_type="access",
    )


def create_refresh_token(subject: str) -> str:
    return create_token(
        subject,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
