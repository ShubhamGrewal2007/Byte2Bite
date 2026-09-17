from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, SurplusRecord
from auth.dependencies import get_current_user
from schemas.common import Page, PageMeta
from schemas.surplus import (
    SurplusCreate, SurplusUpdate, SurplusOut, SURPLUS_STATUSES,
)
from services.access import (
    is_admin, user_org_id, resolve_write_org_id,
    assert_can_read_org, get_food_item_or_404,
)

router = APIRouter(prefix="/api/surplus", tags=["surplus"])


def _get_rec_or_404(db: Session, rec_id: int) -> SurplusRecord:
    rec = db.query(SurplusRecord).filter(SurplusRecord.id == rec_id).first()
    if rec is None:
        raise HTTPException(status_code=404, detail="SurplusRecord not found")
    return rec


@router.get("", response_model=Page[SurplusOut])
def list_surplus(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None),
    organization_id: int | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(SurplusRecord)
    if is_admin(current_user):
        if organization_id is not None:
            q = q.filter(SurplusRecord.organization_id == organization_id)
    else:
        own = user_org_id(current_user)
        if own is None:
            return Page[SurplusOut](
                items=[], meta=PageMeta(page=page, limit=limit, total=0, total_pages=0)
            )
        q = q.filter(SurplusRecord.organization_id == own)

    if status:
        q = q.filter(SurplusRecord.status == status)

    total = q.count()
    items = q.order_by(SurplusRecord.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return Page[SurplusOut](
        items=[SurplusOut.model_validate(s) for s in items],
        meta=PageMeta(
            page=page, limit=limit, total=total,
            total_pages=(total + limit - 1) // limit if limit else 0,
        ),
    )


@router.get("/{rec_id}", response_model=SurplusOut)
def get_surplus(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = _get_rec_or_404(db, rec_id)
    assert_can_read_org(current_user, rec.organization_id)
    return SurplusOut.model_validate(rec)


@router.post("", response_model=SurplusOut, status_code=201)
def create_surplus(
    payload: SurplusCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.status not in SURPLUS_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    org_id = resolve_write_org_id(current_user, payload.organization_id, db)
    item = get_food_item_or_404(db, payload.food_item_id)
    if item.organization_id != org_id:
        raise HTTPException(
            status_code=400,
            detail="food_item_id does not belong to the target organization",
        )

    rec = SurplusRecord(
        organization_id=org_id,
        food_item_id=payload.food_item_id,
        quantity=payload.quantity,
        status=payload.status,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return SurplusOut.model_validate(rec)


@router.put("/{rec_id}", response_model=SurplusOut)
def update_surplus(
    rec_id: int,
    payload: SurplusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = _get_rec_or_404(db, rec_id)
    if not is_admin(current_user) and user_org_id(current_user) != rec.organization_id:
        raise HTTPException(status_code=403, detail="Cannot modify another organization's record")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in SURPLUS_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data['status']}")

    for k, v in data.items():
        setattr(rec, k, v)
    db.commit()
    db.refresh(rec)
    return SurplusOut.model_validate(rec)
