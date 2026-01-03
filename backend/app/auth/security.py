from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.auth.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MIN)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])


def verify_google_id_token(id_token: str) -> dict[str, Any]:
    """
    Verifies Google OIDC ID token signature + claims.
    Accepts multiple audiences from GOOGLE_OAUTH_CLIENT_IDS.
    """
    audiences = settings.google_client_ids()
    if not audiences:
        raise ValueError("GOOGLE_OAUTH_CLIENT_IDS is empty")

    req = google_requests.Request()
    last_err: Exception | None = None
    for aud in audiences:
        try:
            return google_id_token.verify_oauth2_token(id_token, req, audience=aud)
        except Exception as e:
            last_err = e
            continue

    raise ValueError("Invalid Google ID token") from last_err
