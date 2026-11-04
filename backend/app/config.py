import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TalentMatch AI"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "talentmatch-ai-insecure-default-change-in-production-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./talentmatch.db"
    
    # Uploads
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    
    # AI Matching Engine Weights
    WEIGHT_SKILLS: float = 0.50
    WEIGHT_KEYWORDS: float = 0.30
    WEIGHT_EXPERIENCE: float = 0.20
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
