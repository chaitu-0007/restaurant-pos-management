"""SQLite database setup using SQLAlchemy 2.0.

The database file lives inside the project folder (backend/pos.db) so the whole
app is self-contained. The .db file is gitignored; demo data ships in seed.py
and is loaded automatically on first run.
"""
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Absolute path to backend/pos.db, regardless of the current working directory.
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "pos.db"

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},  # FastAPI may use multiple threads
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def get_db():
    """FastAPI dependency that yields a database session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
