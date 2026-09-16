from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, RedistributionRecord, Organization
from auth.dependencies import get_current_user
from schemas.common import Page, PageMeta
from schemas.redistribution import (
    RedistributionCreate, RedistributionUpdate, RedistributionOut,
    REDISTRIBUTION_STATUSES,
)
from services.access import (
    is_admin, user_org_id, resolve_write_org_id, assert_can_read_org,
    get_food_item_or_404,
)

router = APIRouter(prefix="/api/redistribution", tags=["redistribution"])


def _get_rec_or_404(db: Session, rec_id: int) -> RedistributionRecord:
    rec = db.query(RedistributionRecord).filter(RedistributionRecord.id == rec_id).first()
    if rec is None:
        raise HTTPException(status_code=404, detail="RedistributionRecord not found")
    return rec


@router.get("", response_model=Page[RedistributionOut])
def list_redistributions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(RedistributionRecord)

    if not is_admin(current_user):
        own = user_org_id(current_user)
        if own is None:
            return Page[RedistributionOut](
                items=[], meta=PageMeta(page=page, limit=limit, total=0, total_pages=0)
            )
        # Non-admin sees records where they are either source OR destination
        from sqlalchemy import or_
        q = q.filter(or_(
            RedistributionRecord.source_organization_id == own,
            RedistributionRecord.destination_organization_id == own,
        ))

    if status:
        q = q.filter(RedistributionRecord.status == status)

    total = q.count()
    items = q.order_by(RedistributionRecord.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return Page[RedistributionOut](
        items=[RedistributionOut.model_validate(r) for r in items],
        meta=PageMeta(
            page=page, limit=limit, total=total,
            total_pages=(total + limit - 1) // limit if limit else 0,
        ),
    )


@router.get("/{rec_id}", response_model=RedistributionOut)
def get_redistribution(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = _get_rec_or_404(db, rec_id)
    if not is_admin(current_user):
        own = user_org_id(current_user)
        if own not in (rec.source_organization_id, rec.destination_organization_id):
            raise HTTPException(status_code=403, detail="Cannot access another organization's record")
    return RedistributionOut.model_validate(rec)


@router.post("", response_model=RedistributionOut, status_code=201)
def create_redistribution(
    payload: RedistributionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.status not in REDISTRIBUTION_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    source_id = resolve_write_org_id(current_user, payload.source_organization_id, db)

    # Destination must exist
    dest = db.query(Organization).filter(
        Organization.id == payload.destination_organization_id
    ).first()
    if dest is None:
        raise HTTPException(status_code=400, detail="destination_organization_id does not exist")
    if dest.id == source_id:
        raise HTTPException(status_code=400, detail="source and destination must differ")

    # Food item optional, but if given must exist and belong to source
    if payload.food_item_id is not None:
        item = get_food_item_or_404(db, payload.food_item_id)
        if item.organization_id != source_id:
            raise HTTPException(
                status_code=400,
                detail="food_item_id does not belong to the source organization",
            )

    rec = RedistributionRecord(
        source_organization_id=source_id,
        destination_organization_id=dest.id,
        food_item_id=payload.food_item_id,
        quantity=payload.quantity,
        status=payload.status,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return RedistributionOut.model_validate(rec)


@router.put("/{rec_id}", response_model=RedistributionOut)
def update_redistribution(
    rec_id: int,
    payload: RedistributionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = _get_rec_or_404(db, rec_id)

    if not is_admin(current_user):
        own = user_org_id(current_user)
        # Only the source can update for now (destination can be added later)
        if own != rec.source_organization_id:
            raise HTTPException(status_code=403, detail="Only the source organization can update this record")

    data = payload.model_dump(exclude_unset=True)

    if "status" in data and data["status"] not in REDISTRIBUTION_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data['status']}")

    if "destination_organization_id" in data:
        dest = db.query(Organization).filter(
            Organization.id == data["destination_organization_id"]
        ).first()
        if dest is None:
            raise HTTPException(status_code=400, detail="destination_organization_id does not exist")
        if dest.id == rec.source_organization_id:
            raise HTTPException(status_code=400, detail="source and destination must differ")

    for k, v in data.items():
        setattr(rec, k, v)
    db.commit()
    db.refresh(rec)
    return RedistributionOut.model_validate(rec)
