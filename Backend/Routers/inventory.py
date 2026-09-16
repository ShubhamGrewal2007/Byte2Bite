from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, InventoryRecord
from auth.dependencies import get_current_user
from schemas.common import Page, PageMeta, MessageResponse
from schemas.inventory import InventoryCreate, InventoryUpdate, InventoryOut
from services.access import (
    is_admin, user_org_id, resolve_write_org_id,
    assert_can_read_org, get_food_item_or_404, assert_food_item_owned_by,
)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


def _get_record_or_404(db: Session, rec_id: int) -> InventoryRecord:
    rec = db.query(InventoryRecord).filter(InventoryRecord.id == rec_id).first()
    if rec is None:
        raise HTTPException(status_code=404, detail="InventoryRecord not found")
    return rec


@router.get("", response_model=Page[InventoryOut])
def list_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None),
    organization_id: int | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(InventoryRecord)

    if is_admin(current_user):
        if organization_id is not None:
            q = q.filter(InventoryRecord.organization_id == organization_id)
    else:
        own = user_org_id(current_user)
        if own is None:
            return Page[InventoryOut](
                items=[], meta=PageMeta(page=page, limit=limit, total=0, total_pages=0)
            )
        q = q.filter(InventoryRecord.organization_id == own)

    if status:
        q = q.filter(InventoryRecord.status == status)

    total = q.count()
    items = q.order_by(InventoryRecord.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return Page[InventoryOut](
        items=[InventoryOut.model_validate(i) for i in items],
        meta=PageMeta(
            page=page, limit=limit, total=total,
            total_pages=(total + limit - 1) // limit if limit else 0,
        ),
    )


@router.get("/{rec_id}", response_model=InventoryOut)
def get_inventory(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = _get_record_or_404(db, rec_id)
    assert_can_read_org(current_user, rec.organization_id)
    return InventoryOut.model_validate(rec)


@router.post("", response_model=InventoryOut, status_code=201)
def create_inventory(
    payload: InventoryCreate,
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

    rec = InventoryRecord(
        organization_id=org_id,
        food_item_id=payload.food_item_id,
        quantity=payload.quantity,
        status=payload.status,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return InventoryOut.model_validate(rec)


@router.put("/{rec_id}", response_model=InventoryOut)
def update_inventory(
    rec_id: int,
    payload: InventoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = _get_record_or_404(db, rec_id)
    if not is_admin(current_user) and user_org_id(current_user) != rec.organization_id:
        raise HTTPException(status_code=403, detail="Cannot modify another organization's record")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(rec, k, v)
    db.commit()
    db.refresh(rec)
    return InventoryOut.model_validate(rec)


@router.delete("/{rec_id}", response_model=MessageResponse)
def delete_inventory(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = _get_record_or_404(db, rec_id)
    if not is_admin(current_user) and user_org_id(current_user) != rec.organization_id:
        raise HTTPException(status_code=403, detail="Cannot delete another organization's record")
    db.delete(rec)
    db.commit()
    return MessageResponse(message=f"InventoryRecord id={rec_id} deleted")
