from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings


def _normalize_database_url(url: str) -> str:
    cleaned = url.strip()
    if cleaned.startswith("postgres://"):
        return cleaned.replace("postgres://", "postgresql://", 1)
    return cleaned


database_url = _normalize_database_url(settings.DATABASE_URL)
is_sqlite = database_url.startswith("sqlite")

# Handle SQLite vs PostgreSQL connection arguments
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=not is_sqlite,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
