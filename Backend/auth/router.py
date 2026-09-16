"""
Authentication routes for Byte2Bite (Task 2B, tightened for registration fix).

Endpoints:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me
  POST /api/auth/logout

Registration contract:
  Request body (JSON):
    {
      "name": str,
      "email": EmailStr,
      "password": str (>= 8 chars),
      "role": "KITCHEN" | "NGO" | "DISTRIBUTOR",
      "organization_name": str | null,     # optional
      "organization_type": str | null      # optional
    }
  - ADMIN is not accepted here. Admins must be created via a controlled
    path (seed script or an already-admin user). Public registration
    cannot mint admins.
  - organization_id is NOT accepted on the frontend contract; if the
    client sends 0, negative, or a non-existent id, we return 400 with
    a clear message.

Transaction safety:
  - Org creation + user creation happen in one commit.
  - If user creation fails, the org row is rolled back too — no orphans.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Organization

from .schemas import (
    RegisterRequest,
    LoginRequest,
    RegisterResponse,
    TokenResponse,
    LogoutResponse,
    UserPublic,
    UserRole,
)
from .security import hash_password, verify_password, create_access_token
from .dependencies import get_current_user


router = APIRouter(prefix="/api/auth", tags=["auth"])

# Roles the public registration endpoint is allowed to create.
_PUBLIC_REGISTRATION_ROLES = {
    UserRole.KITCHEN.value,
    UserRole.NGO.value,
    UserRole.DISTRIBUTOR.value,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_organization(db: Session, req: RegisterRequest) -> int | None:
    """
    Return an organization_id for the new user, or None.

    Rules (in order):
      1. If organization_id is provided:
           - must be >= 1
           - must exist in the database
           - we return it
      2. Else if organization_name is provided:
           - look up by (name, type) — reuse if it exists
           - create only if missing (no duplicates)
      3. Else: return None (e.g. an org-less user; the caller decides).

    We do NOT commit here. The caller commits once the user is built,
    so an org we create is rolled back if the user insert fails.
    """
    if req.organization_id is not None:
        if req.organization_id < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "organization_id must be a positive integer when provided. "
                    "Omit it entirely and use organization_name to create a new organization."
                ),
            )
        org = (
            db.query(Organization)
            .filter(Organization.id == req.organization_id)
            .first()
        )
        if org is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization id={req.organization_id} does not exist",
            )
        return org.id

    if req.organization_name:
        q = db.query(Organization).filter(Organization.name == req.organization_name)
        if req.organization_type:
            q = q.filter(Organization.type == req.organization_type)
        org = q.first()
        if org is None:
            org = Organization(
                name=req.organization_name,
                type=req.organization_type,
            )
            db.add(org)
            db.flush()  # allocate org.id without committing
        return org.id

    return None


def _to_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        name=user.name,
        email=user.email,
        role=(user.role or "").upper(),
        organization_id=getattr(user, "organization_id", None),
        created_at=getattr(user, "created_at", None),
    )


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # --- Guard: no public admin minting ---
    normalized_role = (payload.role.value if hasattr(payload.role, "value") else str(payload.role)).upper()
    if normalized_role not in _PUBLIC_REGISTRATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Public registration does not allow the role 'ADMIN'. "
                "Register as KITCHEN, NGO, or DISTRIBUTOR."
            ),
        )

    # --- Duplicate email check ---
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    # --- Resolve / create org (may flush, not commit) ---
    try:
        org_id = _resolve_organization(db, payload)

        user = User(
            name=payload.name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=normalized_role,
            organization_id=org_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except HTTPException:
        # Client error — nothing to clean up beyond an uncommitted flush,
        # but roll back in case we created an org via flush.
        db.rollback()
        raise
    except Exception:
        # Unexpected DB error — roll back everything (incl. any flushed org).
        db.rollback()
        raise

    return RegisterResponse(
        message="User registered successfully",
        user=_to_public(user),
    )


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if user is None:
        raise invalid
    if not verify_password(payload.password, user.password_hash or ""):
        raise invalid

    token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "role": (user.role or "").upper(),
        },
    )

    return TokenResponse(access_token=token, user=_to_public(user))


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return _to_public(current_user)


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------

@router.post("/logout", response_model=LogoutResponse)
def logout(current_user: User = Depends(get_current_user)):
    """
    Stateless-JWT logout for the prototype.

    JWTs are self-contained; the server cannot invalidate them without
    a revocation store. This endpoint is provided so the client has a
    canonical place to signal intent; the client is responsible for
    discarding the token.

    If real revocation is needed later, add a `revoked_tokens` table
    (jti, expires_at) and check it in get_current_user.
    """
    return LogoutResponse(
        message="Logged out. Discard the access token on the client.",
        note=(
            "JWTs are stateless. The client must delete its stored token. "
            "Server-side revocation would require a token blacklist."
        ),
    )