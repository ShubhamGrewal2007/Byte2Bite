from datetime import datetime
from typing import Optional

from pydantic import Field

from .common import ORMBase


class FoodItemBase(ORMBase):
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    quantity: float = Field(..., ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    production_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    storage_temperature: Optional[float] = None


class FoodItemCreate(FoodItemBase):
    """
    organization_id is intentionally OPTIONAL and IGNORED for non-admin users.
    Admin users may pass it to create food for a specific org.
    """
    organization_id: Optional[int] = None


class FoodItemUpdate(ORMBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    production_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    storage_temperature: Optional[float] = None


class FoodItemOut(FoodItemBase):
    id: int
    organization_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
