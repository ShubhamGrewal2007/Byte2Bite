"""
Password hashing + JWT encoding/decoding for Byte2Bite (Task 2B).

Keeps cryptographic logic out of route handlers.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import jwt, JWTError
from passlib.context import CryptContext


# ---------------------------------------------------------------------------
# Configuration (environment-driven; no hardcoded secrets)
# ---------------------------------------------------------------------------

JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

if not JWT_SECRET_KEY:
    # Fail fast in production. For prototype dev, warn loudly.
    # Do NOT silently fall back to a hardcoded secret.
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is not set. "
        "Set it before starting the backend, e.g.:\n"
        "  export JWT_SECRET_KEY=$(python -c \"import secrets; print(secrets.token_urlsafe(64))\")\n"
        "Or place it in a .env file (see README)."
    )


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

# bcrypt is the industry standard; passlib handles salt + rounds.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash for the given plaintext password."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Constant-time verification of a plaintext password against a hash."""
    if not password_hash:
        return False
    try:
        return pwd_context.verify(plain_password, password_hash)
    except ValueError:
        # Malformed hash in DB — treat as failed auth, don't 500.
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def create_access_token(
    subject: str,
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT.

    `subject` is conventionally the user id (as a string).
    `extra_claims` typically carries `email` and `role`.
    """
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT. Raises JWTError on any problem
    (bad signature, expired, malformed).
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
