from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, WasteRecord
from auth.dependencies import get_current_user
from schemas.common import Page, PageMeta
from schemas.waste import WasteCreate, WasteOut
from services.access import (
    is_admin, user_org_id, resolve_write_org_id,
    assert_can_read_org, get_food_item_or_404,
)

router = APIRouter(prefix="/api/waste", tags=["waste"])


@router.get("", response_model=Page[WasteOut])
def list_waste(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    organization_id: int | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(WasteRecord)
    if is_admin(current_user):
        if organization_id is not None:
            q = q.filter(WasteRecord.organization_id == organization_id)
    else:
        own = user_org_id(current_user)
        if own is None:
            return Page[WasteOut](
                items=[], meta=PageMeta(page=page, limit=limit, total=0, total_pages=0)
            )
        q = q.filter(WasteRecord.organization_id == own)

    total = q.count()
    items = q.order_by(WasteRecord.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return Page[WasteOut](
        items=[WasteOut.model_validate(w) for w in items],
        meta=PageMeta(
            page=page, limit=limit, total=total,
            total_pages=(total + limit - 1) // limit if limit else 0,
        ),
    )


@router.get("/{rec_id}", response_model=WasteOut)
def get_waste(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = db.query(WasteRecord).filter(WasteRecord.id == rec_id).first()
    if rec is None:
        raise HTTPException(status_code=404, detail="WasteRecord not found")
    assert_can_read_org(current_user, rec.organization_id)
    return WasteOut.model_validate(rec)


@router.post("", response_model=WasteOut, status_code=201)
def create_waste(
    payload: WasteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = resolve_write_org_id(current_user, payload.organization_id, db)
    item = get_food_item_or_404(db, payload.food_item_id)
    if item.organization_id != org_id:
        raise HTTPException(
            status_code=400,
            detail="food_item_id does not belong to the target organization",
        )

    rec = WasteRecord(
        organization_id=org_id,
        food_item_id=payload.food_item_id,
        quantity=payload.quantity,
        reason=payload.reason,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return WasteOut.model_validate(rec)
