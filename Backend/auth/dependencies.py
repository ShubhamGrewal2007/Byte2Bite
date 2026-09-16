"""
Reusable FastAPI auth dependencies (Task 2B).

  - oauth2_scheme       : extracts Bearer token
  - get_current_user    : decodes JWT -> User ORM object
  - require_role(*roles): factory for role-restricted dependencies
  - require_admin       : shorthand for require_role(ADMIN)

Uses the EXISTING database session from database.connection.get_db.
Does NOT create a second engine or session factory.
"""

from typing import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User
from .security import decode_access_token


# tokenUrl is informational for OpenAPI docs; our login accepts JSON, not form.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def _credentials_exception(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the Bearer JWT and return the corresponding User.
    Raises 401 on missing / invalid / expired token or unknown user.
    """
    if not token:
        raise _credentials_exception("Not authenticated")

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise _credentials_exception("Invalid or expired token")

    sub = payload.get("sub")
    if sub is None:
        raise _credentials_exception("Token missing subject")

    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        raise _credentials_exception("Token subject is malformed")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise _credentials_exception("User no longer exists")

    return user


def require_role(*allowed_roles: Iterable[str]):
    """
    Dependency factory. Usage:

        @router.get("/admin-only", dependencies=[Depends(require_role("ADMIN"))])
        def x(): ...

    Or to receive the user:

        def x(user: User = Depends(require_role("KITCHEN", "NGO"))): ...
    """
    allowed = {r.upper() for r in allowed_roles}

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if (current_user.role or "").upper() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {sorted(allowed)}",
            )
        return current_user

    return _checker


# Convenience shorthand
require_admin = require_role("ADMIN")
