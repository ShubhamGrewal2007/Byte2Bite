"""
Database health/status route for Byte2Bite.

Mounted at /api/db by main.py.
"""

from fastapi import APIRouter

from database import check_db_health

router = APIRouter(prefix="/api/db", tags=["database"])


@router.get("/health")
def db_health() -> dict:
    """Return database connectivity + table listing."""
    return check_db_health()
