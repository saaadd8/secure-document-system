from fastapi import FastAPI, HTTPException

from app.config import settings
from app.database import check_database_connection, init_db
from app.routers import auth

app = FastAPI(title=settings.app_name)
app.include_router(auth.router)


@app.on_event("startup")
def on_startup():
    """Create database tables that do not exist yet (development helper)."""
    init_db()


@app.get("/health")
def health():
    """Basic liveness check: the API process is running."""
    return {"status": "ok", "app": settings.app_name}


@app.get("/health/db")
def health_db():
    """Simple PostgreSQL connection test."""
    try:
        check_database_connection()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {exc}",
        ) from exc

    return {"status": "ok", "database": "connected"}
