"""
Shared schema utilities for Task 2C.

Compatible with Pydantic v2. If your project is on Pydantic v1, replace
`model_config = ConfigDict(from_attributes=True)` with
`class Config: orm_mode = True` in each schema file.
"""

from typing import Generic, List, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ORMBase(BaseModel):
    """Base for schemas that read from SQLAlchemy ORM objects."""
    model_config = ConfigDict(from_attributes=True)


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="1-based page number")
    limit: int = Field(50, ge=1, le=200, description="Items per page (max 200)")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class PageMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class Page(BaseModel, Generic[T]):
    """Generic paginated response."""
    items: List[T]
    meta: PageMeta


class MessageResponse(BaseModel):
    message: str
