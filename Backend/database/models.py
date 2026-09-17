"""
SQLAlchemy ORM models for Byte2Bite.

These models define the persistent data layer for Task 2A.
No business logic, authentication, AI, or analytics is implemented here.
"""

from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship

from .connection import Base


# ---------------------------------------------------------------------------
# Mixins
# ---------------------------------------------------------------------------

class TimestampMixin:
    """Adds created_at / updated_at to any model that inherits it."""

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # placeholder for Task 2B
    role = Column(String(50), nullable=False, default="user")
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    organization = relationship("Organization", foreign_keys=[organization_id])

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------

class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(100), nullable=True)  # e.g. restaurant, ngo, grocery
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Relationships
    food_items = relationship(
        "FoodItem", back_populates="organization", cascade="all, delete-orphan"
    )
    inventory_records = relationship(
        "InventoryRecord", back_populates="organization", cascade="all, delete-orphan"
    )
    waste_records = relationship(
        "WasteRecord", back_populates="organization", cascade="all, delete-orphan"
    )
    surplus_records = relationship(
        "SurplusRecord", back_populates="organization", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name!r} type={self.type!r}>"


# ---------------------------------------------------------------------------
# FoodItem
# ---------------------------------------------------------------------------

class FoodItem(Base, TimestampMixin):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String(50), nullable=True)  # e.g. kg, litres, pieces
    production_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    storage_temperature = Column(Float, nullable=True)  # Celsius

    # Relationships
    organization = relationship("Organization", back_populates="food_items")
    inventory_records = relationship(
        "InventoryRecord", back_populates="food_item", cascade="all, delete-orphan"
    )
    waste_records = relationship(
        "WasteRecord", back_populates="food_item", cascade="all, delete-orphan"
    )
    surplus_records = relationship(
        "SurplusRecord", back_populates="food_item", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<FoodItem id={self.id} name={self.name!r} org={self.organization_id}>"


# ---------------------------------------------------------------------------
# InventoryRecord
# ---------------------------------------------------------------------------

class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    food_item_id = Column(
        Integer, ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False
    )
    quantity = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="available")
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="inventory_records")
    food_item = relationship("FoodItem", back_populates="inventory_records")

    def __repr__(self) -> str:
        return (
            f"<InventoryRecord id={self.id} org={self.organization_id} "
            f"item={self.food_item_id} qty={self.quantity}>"
        )


# ---------------------------------------------------------------------------
# WasteRecord
# ---------------------------------------------------------------------------

class WasteRecord(Base):
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    food_item_id = Column(
        Integer, ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False
    )
    quantity = Column(Float, nullable=False, default=0.0)
    reason = Column(String(255), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="waste_records")
    food_item = relationship("FoodItem", back_populates="waste_records")

    def __repr__(self) -> str:
        return (
            f"<WasteRecord id={self.id} org={self.organization_id} "
            f"item={self.food_item_id} qty={self.quantity}>"
        )


# ---------------------------------------------------------------------------
# SurplusRecord
# ---------------------------------------------------------------------------

class SurplusRecord(Base):
    __tablename__ = "surplus_records"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    food_item_id = Column(
        Integer, ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False
    )
    quantity = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="available")
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="surplus_records")
    food_item = relationship("FoodItem", back_populates="surplus_records")

    def __repr__(self) -> str:
        return (
            f"<SurplusRecord id={self.id} org={self.organization_id} "
            f"item={self.food_item_id} qty={self.quantity}>"
        )


# ---------------------------------------------------------------------------
# RedistributionRecord
# ---------------------------------------------------------------------------

class RedistributionRecord(Base, TimestampMixin):
    __tablename__ = "redistribution_records"

    id = Column(Integer, primary_key=True, index=True)
    source_organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    destination_organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    food_item_id = Column(
        Integer, ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True
    )
    quantity = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="pending")

    source_organization = relationship(
        "Organization", foreign_keys=[source_organization_id]
    )
    destination_organization = relationship(
        "Organization", foreign_keys=[destination_organization_id]
    )
    food_item = relationship("FoodItem")

    def __repr__(self) -> str:
        return (
            f"<RedistributionRecord id={self.id} "
            f"{self.source_organization_id}->{self.destination_organization_id} "
            f"qty={self.quantity} status={self.status!r}>"
        )


# ---------------------------------------------------------------------------
# AIPrediction
# ---------------------------------------------------------------------------

class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    food_item_id = Column(
        Integer, ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True
    )
    model_type = Column(String(100), nullable=False)
    prediction = Column(Text, nullable=False)  # JSON string or serialized output
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization")
    food_item = relationship("FoodItem")

    def __repr__(self) -> str:
        return (
            f"<AIPrediction id={self.id} org={self.organization_id} "
            f"model={self.model_type!r}>"
        )


# ---------------------------------------------------------------------------
# Optional indexes for common query patterns
# ---------------------------------------------------------------------------

Index("ix_food_items_org_category", FoodItem.organization_id, FoodItem.category)
Index("ix_inventory_org_recorded", InventoryRecord.organization_id, InventoryRecord.recorded_at)
Index("ix_waste_org_recorded", WasteRecord.organization_id, WasteRecord.recorded_at)
Index("ix_surplus_org_status", SurplusRecord.organization_id, SurplusRecord.status)
