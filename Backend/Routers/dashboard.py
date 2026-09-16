"""
Dashboard aggregation endpoint (Task 2C).

All values are computed from the actual database. No fabrication.
Where the schema cannot yet support a metric, we return 0 and document it.

See Part 12 for frontend-integration notes.
"""

from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import (
    User, FoodItem, InventoryRecord, WasteRecord, SurplusRecord,
    RedistributionRecord,
)
from auth.dependencies import get_current_user
from schemas.dashboard import (
    DashboardSummary, RecentActivityItem, ExpiringItem,
)
from services.access import is_admin, user_org_id

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardSummary)
def dashboard(
    expiring_days: int = Query(7, ge=1, le=90, description="Look-ahead window for expiring items"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin = is_admin(current_user)
    own_org = user_org_id(current_user)

    def scoped(q, org_col):
        """Apply org scoping for non-admins."""
        if admin:
            return q
        if own_org is None:
            return q.filter(org_col == -1)  # nothing
        return q.filter(org_col == own_org)

    # ---- Aggregations ----
    total_inventory = scoped(
        db.query(func.coalesce(func.sum(InventoryRecord.quantity), 0.0)),
        InventoryRecord.organization_id,
    ).scalar() or 0.0

    total_surplus = scoped(
        db.query(func.coalesce(func.sum(SurplusRecord.quantity), 0.0)),
        SurplusRecord.organization_id,
    ).scalar() or 0.0

    total_waste = scoped(
        db.query(func.coalesce(func.sum(WasteRecord.quantity), 0.0)),
        WasteRecord.organization_id,
    ).scalar() or 0.0

    # meals_saved: sum of quantities on redistribution records not cancelled
    red_q = db.query(func.coalesce(func.sum(RedistributionRecord.quantity), 0.0))
    if not admin:
        if own_org is None:
            meals_saved = 0.0
        else:
            red_q = red_q.filter(or_(
                RedistributionRecord.source_organization_id == own_org,
                RedistributionRecord.destination_organization_id == own_org,
            ))
            red_q = red_q.filter(RedistributionRecord.status != "cancelled")
            meals_saved = red_q.scalar() or 0.0
    else:
        red_q = red_q.filter(RedistributionRecord.status != "cancelled")
        meals_saved = red_q.scalar() or 0.0

    # active_redistributions: status in pending/in_transit/accepted
    active_q = db.query(func.count(RedistributionRecord.id)).filter(
        RedistributionRecord.status.in_(["pending", "accepted", "in_transit"])
    )
    if not admin:
        if own_org is None:
            active_redistributions = 0
        else:
            active_q = active_q.filter(or_(
                RedistributionRecord.source_organization_id == own_org,
                RedistributionRecord.destination_organization_id == own_org,
            ))
            active_redistributions = active_q.scalar() or 0
    else:
        active_redistributions = active_q.scalar() or 0

    # ---- Expiring items ----
    now = datetime.utcnow()
    horizon = now + timedelta(days=expiring_days)
    exp_q = db.query(FoodItem).filter(
        FoodItem.expiry_date.isnot(None),
        FoodItem.expiry_date >= now,
        FoodItem.expiry_date <= horizon,
    )
    exp_q = scoped(exp_q, FoodItem.organization_id)
    expiring_items = [
        ExpiringItem(
            food_item_id=i.id, name=i.name,
            expiry_date=i.expiry_date, quantity=i.quantity or 0.0, unit=i.unit,
        )
        for i in exp_q.order_by(FoodItem.expiry_date.asc()).limit(20).all()
    ]

    # ---- Recent activity (last 10 events across 4 tables) ----
    activity: List[RecentActivityItem] = []

    inv_q = scoped(db.query(InventoryRecord), InventoryRecord.organization_id)\
              .order_by(InventoryRecord.recorded_at.desc()).limit(10).all()
    for r in inv_q:
        activity.append(RecentActivityItem(
            type="inventory", id=r.id,
            summary=f"Inventory: {r.quantity} of food_item #{r.food_item_id} ({r.status})",
            timestamp=r.recorded_at,
        ))

    w_q = scoped(db.query(WasteRecord), WasteRecord.organization_id)\
             .order_by(WasteRecord.recorded_at.desc()).limit(10).all()
    for r in w_q:
        activity.append(RecentActivityItem(
            type="waste", id=r.id,
            summary=f"Waste: {r.quantity} of food_item #{r.food_item_id} ({r.reason or 'no reason'})",
            timestamp=r.recorded_at,
        ))

    s_q = scoped(db.query(SurplusRecord), SurplusRecord.organization_id)\
             .order_by(SurplusRecord.recorded_at.desc()).limit(10).all()
    for r in s_q:
        activity.append(RecentActivityItem(
            type="surplus", id=r.id,
            summary=f"Surplus: {r.quantity} of food_item #{r.food_item_id} ({r.status})",
            timestamp=r.recorded_at,
        ))

    red_list_q = db.query(RedistributionRecord)
    if not admin and own_org is not None:
        red_list_q = red_list_q.filter(or_(
            RedistributionRecord.source_organization_id == own_org,
            RedistributionRecord.destination_organization_id == own_org,
        ))
    elif not admin and own_org is None:
        red_list_q = red_list_q.filter(RedistributionRecord.id == -1)
    for r in red_list_q.order_by(RedistributionRecord.created_at.desc()).limit(10).all():
        activity.append(RecentActivityItem(
            type="redistribution", id=r.id,
            summary=f"Redistribution {r.source_organization_id} -> {r.destination_organization_id} qty={r.quantity} ({r.status})",
            timestamp=r.created_at,
        ))

    activity.sort(key=lambda a: a.timestamp or datetime.min, reverse=True)
    activity = activity[:10]

    return DashboardSummary(
        total_inventory=float(total_inventory),
        total_surplus=float(total_surplus),
        total_waste=float(total_waste),
        meals_saved=float(meals_saved),
        active_redistributions=int(active_redistributions),
        expiring_items=expiring_items,
        recent_activity=activity,
        scope="global" if admin else "organization",
        organization_id=None if admin else own_org,
    )
