from datetime import datetime
from typing import Optional

from pydantic import Field

from .common import ORMBase


SURPLUS_STATUSES = {"available", "reserved", "redistributed", "expired", "cancelled"}


class SurplusBase(ORMBase):
    food_item_id: int
    quantity: float = Field(..., gt=0)
    status: str = Field("available", max_length=50)


class SurplusCreate(SurplusBase):
    organization_id: Optional[int] = None


class SurplusUpdate(ORMBase):
    quantity: Optional[float] = Field(None, gt=0)
    status: Optional[str] = Field(None, max_length=50)


class SurplusOut(SurplusBase):
    id: int
    organization_id: int
    recorded_at: Optional[datetime] = None
