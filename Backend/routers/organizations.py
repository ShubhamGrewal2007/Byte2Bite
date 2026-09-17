from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Organization
from auth.dependencies import get_current_user, require_admin
from schemas.common import Page, PageMeta
from schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationOut,
)
from services.access import is_admin, user_org_id

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.get("", response_model=Page[OrganizationOut])
def list_organizations(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    type: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Organization)
    if not is_admin(current_user):
        # Non-admins only see their own org
        if user_org_id(current_user) is None:
            return Page[OrganizationOut](
                items=[], meta=PageMeta(page=page, limit=limit, total=0, total_pages=0)
            )
        q = q.filter(Organization.id == user_org_id(current_user))
    if type:
        q = q.filter(Organization.type == type)

    total = q.count()
    items = q.order_by(Organization.id.asc()).offset((page - 1) * limit).limit(limit).all()
    total_pages = (total + limit - 1) // limit if limit else 0
    return Page[OrganizationOut](
        items=[OrganizationOut.model_validate(o) for o in items],
        meta=PageMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


@router.get("/{org_id}", response_model=OrganizationOut)
def get_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not is_admin(current_user) and user_org_id(current_user) != org.id:
        raise HTTPException(status_code=403, detail="Cannot access another organization")
    return OrganizationOut.model_validate(org)


@router.post("", response_model=OrganizationOut, status_code=201)
def create_organization(
    payload: OrganizationCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    org = Organization(**payload.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return OrganizationOut.model_validate(org)


@router.put("/{org_id}", response_model=OrganizationOut)
def update_organization(
    org_id: int,
    payload: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not is_admin(current_user) and user_org_id(current_user) != org.id:
        raise HTTPException(status_code=403, detail="Cannot modify another organization")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(org, k, v)
    db.commit()
    db.refresh(org)
    return OrganizationOut.model_validate(org)
