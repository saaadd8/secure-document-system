from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# Engine = the actual connection pool to PostgreSQL.
engine = create_engine(settings.database_url, pool_pre_ping=True)

# SessionLocal = how we open a database session in request handlers later.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models (tables will inherit this later)."""


def get_db():
    """Yield a database session, then close it. FastAPI will use this later."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> None:
    """Run a simple SELECT 1 query to verify PostgreSQL is reachable."""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def init_db() -> None:
    """Create missing tables from SQLAlchemy models. Safe to run more than once."""
    # Import models here so User is registered on Base.metadata before create_all.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
