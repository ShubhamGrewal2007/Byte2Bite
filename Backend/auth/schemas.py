"""
Pydantic schemas for authentication (Task 2B, tightened for registration fix).

Uses Pydantic v2 style (`model_config`). If your project is on Pydantic v1,
replace `model_config = ConfigDict(from_attributes=True)` with
`class Config: orm_mode = True`.
"""

from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------

class UserRole(str, Enum):
    """The complete role set the system understands. Used everywhere except
    public registration."""
    ADMIN = "ADMIN"
    KITCHEN = "KITCHEN"
    NGO = "NGO"
    DISTRIBUTOR = "DISTRIBUTOR"


class PublicRegistrationRole(str, Enum):
    """Roles the public /api/auth/register endpoint will accept.

    ADMIN is intentionally excluded — admins are created via a controlled
    path, never through the public form.
    """
    KITCHEN = "KITCHEN"
    NGO = "NGO"
    DISTRIBUTOR = "DISTRIBUTOR"


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    # Public registration cannot mint admins. Pydantic rejects anything
    # outside this enum with a 422 before the router runs.
    role: PublicRegistrationRole

    # organization_id is optional and, when present, must be >= 1.
    # Sending 0 or negative is a client bug and Pydantic surfaces it as 422.
    organization_id: Optional[int] = Field(None, ge=1)

    organization_name: Optional[str] = Field(None, max_length=255)
    organization_type: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class UserPublic(BaseModel):
    """User representation safe to return in API responses (no password_hash)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    organization_id: Optional[int] = None
    created_at: Optional[datetime] = None


class RegisterResponse(BaseModel):
    message: str
    user: UserPublic


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class LogoutResponse(BaseModel):
    message: str
    note: str