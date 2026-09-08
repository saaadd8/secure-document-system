"""Isolated fixtures for API authorization tests.

The environment is set before importing the application so no test can create
an engine for the developer's configured PostgreSQL database. Each test uses
an in-memory SQLite database and a pytest-managed temporary storage directory.
"""

import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-for-isolated-api-security-suite"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.database as database
from app.database import Base
from app.main import app
from app.routers import documents as documents_router
from app.security import login_attempt_limiter


TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
database.engine.dispose()
database.engine = TEST_ENGINE
database.SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=TEST_ENGINE,
)


@pytest.fixture(autouse=True)
def isolated_database():
    """Start every test with empty tables in the in-memory test database."""
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    login_attempt_limiter.clear()
    yield
    login_attempt_limiter.clear()
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture(autouse=True)
def isolated_document_storage(monkeypatch, tmp_path):
    """Keep uploaded test PDFs outside the repository's real storage path."""
    monkeypatch.setattr(documents_router, "ROOT_DIR", tmp_path)
    monkeypatch.setattr(
        documents_router,
        "STORAGE_DIR",
        tmp_path / "storage" / "documents",
    )


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def session():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
