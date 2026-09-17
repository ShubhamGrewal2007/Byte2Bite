from datetime import datetime
from typing import Optional

from pydantic import Field

from .common import ORMBase


INVENTORY_STATUSES = {"available", "reserved", "depleted", "expired"}


class InventoryBase(ORMBase):
    food_item_id: int
    quantity: float = Field(..., ge=0)
    status: str = Field("available", max_length=50)


class InventoryCreate(InventoryBase):
    # Non-admins: ignored (uses current user's org).
    # Admins: may specify target org.
    organization_id: Optional[int] = None


class InventoryUpdate(ORMBase):
    quantity: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None, max_length=50)


class InventoryOut(InventoryBase):
    id: int
    organization_id: int
    recorded_at: Optional[datetime] = None
