from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, FoodItem
from auth.dependencies import get_current_user
from schemas.common import Page, PageMeta, MessageResponse
from schemas.food import FoodItemCreate, FoodItemUpdate, FoodItemOut
from services.access import (
    is_admin, user_org_id, resolve_write_org_id,
    assert_can_read_org, get_food_item_or_404, assert_food_item_owned_by,
)

router = APIRouter(prefix="/api/food", tags=["food"])


@router.get("", response_model=Page[FoodItemOut])
def list_food(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    category: str | None = Query(None),
    organization_id: int | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(FoodItem)

    if is_admin(current_user):
        if organization_id is not None:
            q = q.filter(FoodItem.organization_id == organization_id)
    else:
        own = user_org_id(current_user)
        if own is None:
            return Page[FoodItemOut](
                items=[], meta=PageMeta(page=page, limit=limit, total=0, total_pages=0)
            )
        q = q.filter(FoodItem.organization_id == own)

    if category:
        q = q.filter(FoodItem.category == category)

    total = q.count()
    items = q.order_by(FoodItem.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return Page[FoodItemOut](
        items=[FoodItemOut.model_validate(i) for i in items],
        meta=PageMeta(
            page=page, limit=limit, total=total,
            total_pages=(total + limit - 1) // limit if limit else 0,
        ),
    )


@router.get("/{item_id}", response_model=FoodItemOut)
def get_food(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = get_food_item_or_404(db, item_id)
    assert_can_read_org(current_user, item.organization_id)
    return FoodItemOut.model_validate(item)


@router.post("", response_model=FoodItemOut, status_code=201)
def create_food(
    payload: FoodItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = resolve_write_org_id(current_user, payload.organization_id, db)

    data = payload.model_dump(exclude={"organization_id"})
    item = FoodItem(organization_id=org_id, **data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return FoodItemOut.model_validate(item)


@router.put("/{item_id}", response_model=FoodItemOut)
def update_food(
    item_id: int,
    payload: FoodItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = get_food_item_or_404(db, item_id)
    assert_food_item_owned_by(current_user, item)

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return FoodItemOut.model_validate(item)


@router.delete("/{item_id}", response_model=MessageResponse)
def delete_food(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = get_food_item_or_404(db, item_id)
    assert_food_item_owned_by(current_user, item)
    db.delete(item)
    db.commit()
    return MessageResponse(message=f"FoodItem id={item_id} deleted")
