from datetime import datetime
from typing import Optional

from pydantic import Field

from .common import ORMBase


class OrganizationBase(ORMBase):
    name: str = Field(..., min_length=1, max_length=255)
    type: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(ORMBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class OrganizationOut(OrganizationBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
