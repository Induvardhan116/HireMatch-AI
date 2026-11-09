from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, users, resumes, jobs, applications, analytics
from app.seed_data import seed_database

# Create all database tables
Base.metadata.create_all(bind=engine)

# Seed demonstration data if DB is empty
try:
    with SessionLocal() as db:
        seed_database(db)
except Exception as e:
    print(f"[HireMatch AI] Seed check: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Explainable NLP-Based Resume Screening and Job Recommendation Portal API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "hirematch-backend",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

