from datetime import datetime
from typing import Optional

from pydantic import Field

from .common import ORMBase


REDISTRIBUTION_STATUSES = {"pending", "accepted", "in_transit", "completed", "cancelled"}


class RedistributionBase(ORMBase):
    destination_organization_id: int
    food_item_id: Optional[int] = None
    quantity: float = Field(..., gt=0)
    status: str = Field("pending", max_length=50)


class RedistributionCreate(RedistributionBase):
    """
    source_organization_id is optional:
      - Non-admin: forced to current user's org.
      - Admin: may specify.
    """
    source_organization_id: Optional[int] = None


class RedistributionUpdate(ORMBase):
    quantity: Optional[float] = Field(None, gt=0)
    status: Optional[str] = Field(None, max_length=50)
    destination_organization_id: Optional[int] = None


class RedistributionOut(RedistributionBase):
    id: int
    source_organization_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
