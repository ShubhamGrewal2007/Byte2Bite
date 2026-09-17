"""
Database package for Byte2Bite.

Exposes the SQLAlchemy engine, session factory, declarative Base,
and a helper for FastAPI dependency injection.
"""

from .connection import (
    Base,
    engine,
    SessionLocal,
    get_db,
    init_db,
    check_db_health,
)
from . import models  # noqa: F401  (ensures models are registered on Base)

__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "init_db",
    "check_db_health",
]
