"""
SQLAlchemy database connection and session management for Byte2Bite.

Uses SQLite for the prototype. The database file lives at
`backend/byte2bite.db` by default but can be overridden with the
`DATABASE_URL` environment variable.
"""

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Default: SQLite file inside the backend directory.
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_SQLITE_PATH = _BACKEND_DIR / "byte2bite.db"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_DEFAULT_SQLITE_PATH}")

# SQLite requires `check_same_thread=False` when used with FastAPI's threadpool.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# ---------------------------------------------------------------------------
# Engine & Session
# ---------------------------------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    echo=False,          # set to True for SQL debugging
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=Session,
    future=True,
)

Base = declarative_base()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def init_db() -> None:
    """
    Create all tables registered on `Base.metadata`.

    Safe to call multiple times: `create_all` is idempotent and only
    creates tables that do not yet exist. Importing `database.models`
    (done in `database/__init__.py`) ensures all models are registered.
    """
    # Import here to guarantee models are loaded before create_all runs.
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy session and closes it.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> dict:
    """
    Return a small dict describing DB connectivity and table presence.
    Used by the /api/db/health endpoint.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        # List existing tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        return {
            "status": "ok",
            "database_url": DATABASE_URL,
            "tables": sorted(tables),
            "table_count": len(tables),
        }
    except Exception as exc:  # pragma: no cover
        return {
            "status": "error",
            "database_url": DATABASE_URL,
            "error": str(exc),
        }
