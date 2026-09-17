"""
Dashboard response schema (Task 2C).

NOTE: Field names are chosen to be generic and defensible because the
frontend dashboard code was not provided for inspection. See Part 12
for the exact list of things to confirm once frontend code is available.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class RecentActivityItem(BaseModel):
    type: str          # "inventory" | "waste" | "surplus" | "redistribution"
    id: int
    summary: str
    timestamp: Optional[datetime] = None


class ExpiringItem(BaseModel):
    food_item_id: int
    name: str
    expiry_date: Optional[datetime]
    quantity: float
    unit: Optional[str]


class DashboardSummary(BaseModel):
    # Aggregated numbers, all calculated from DB (no fabrication).
    total_inventory: float
    total_surplus: float
    total_waste: float
    meals_saved: float          # = total redistributed quantity (completed/pending summed)
    active_redistributions: int

    # Lists
    expiring_items: List[ExpiringItem]
    recent_activity: List[RecentActivityItem]

    # Scope transparency
    scope: str                  # "organization" or "global" (admin)
    organization_id: Optional[int]
