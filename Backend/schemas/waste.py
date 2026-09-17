from datetime import datetime
from typing import Optional

from pydantic import Field

from .common import ORMBase


class WasteBase(ORMBase):
    food_item_id: int
    quantity: float = Field(..., gt=0)
    reason: Optional[str] = Field(None, max_length=255)


class WasteCreate(WasteBase):
    organization_id: Optional[int] = None


class WasteOut(WasteBase):
    id: int
    organization_id: int
    recorded_at: Optional[datetime] = None
