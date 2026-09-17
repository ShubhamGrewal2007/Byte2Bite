"""
Organization-scoping helpers for Task 2C.

Centralizes the "which org can this user touch?" logic so that every
business router uses the SAME rules. This is the backend enforcement
layer for cross-organization access prevention.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from database.models import User, Organization, FoodItem


ADMIN_ROLE = "ADMIN"


def is_admin(user: User) -> bool:
    return (user.role or "").upper() == ADMIN_ROLE


def user_org_id(user: User) -> int | None:
    """Return the user's organization_id, or None if unattached."""
    return getattr(user, "organization_id", None)


def resolve_write_org_id(user: User, requested_org_id: int | None, db: Session) -> int:
    """
    Determine which organization_id a write should target.

    Rules:
      - ADMIN may pass an explicit organization_id (must exist).
        If omitted, ADMIN must still have an organization_id on their user,
        or the caller must supply one. We do NOT invent orgs.
      - Non-admin: requested_org_id is IGNORED. Their own organization_id
        is used. If they don't have one -> 403.
    """
    if is_admin(user):
        target = requested_org_id if requested_org_id is not None else user_org_id(user)
        if target is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="organization_id is required for admin users without an attached organization",
            )
        org = db.query(Organization).filter(Organization.id == target).first()
        if org is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization id={target} does not exist",
            )
        return org.id

    # Non-admin path
    own = user_org_id(user)
    if own is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not attached to an organization",
        )
    if requested_org_id is not None and requested_org_id != own:
        # Explicit attempt to write to another org — refuse loudly.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access another organization's data",
        )
    return own


def assert_can_read_org(user: User, org_id: int) -> None:
    """Raise 403 if the user cannot read the given organization's data."""
    if is_admin(user):
        return
    if user_org_id(user) != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access another organization's data",
        )


def assert_can_write_org(user: User, org_id: int) -> None:
    """Same rules as read for now; kept separate for future divergence."""
    assert_can_read_org(user, org_id)


def get_food_item_or_404(db: Session, food_item_id: int) -> FoodItem:
    item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FoodItem id={food_item_id} not found",
        )
    return item


def assert_food_item_owned_by(user: User, item: FoodItem) -> None:
    """Non-admins must own the food item (via its organization)."""
    if is_admin(user):
        return
    if user_org_id(user) != item.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FoodItem belongs to another organization",
        )
