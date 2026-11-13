import logging
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.routers import analytics, applications, auth, jobs, resumes, users
from app.seed_data import seed_database

logger = logging.getLogger("hirematch.startup")


def init_database() -> None:
    """Create database tables and seed initial demonstration data."""
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed_database(db)
    except Exception as exc:
        logger.error("Database initialization failed during startup: %s", type(exc).__name__)
        raise RuntimeError(
            "Database initialization failed. Check database connectivity and schema configuration."
        ) from exc


init_database()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Explainable NLP-Based Resume Screening and Job Recommendation Portal API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup configured strictly via CORS_ORIGINS environment variable
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error("Health check database query failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity check failed",
        ) from exc

    return {
        "status": "healthy",
        "service": "hirematch-backend",
        "database": "connected",
    }


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=not settings.is_production)
