import json
import os
from typing import List
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_INSECURE_SECRET_PLACEHOLDERS = {
    "talentmatch-ai-insecure-default-change-in-production-super-secret-key",
    "replace-with-secure-random-secret-key",
    "replace-with-a-cryptographically-random-secret-key",
    "change_me_in_production_secure_random_secret_key",
    "change-me",
    "changeme",
    "secret",
}

_LOCAL_DEV_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def _parse_cors_origins(raw_value: str) -> List[str]:
    """Parses comma-separated or JSON-formatted CORS origin strings."""
    cleaned = (raw_value or "").strip()
    if not cleaned:
        return []

    if cleaned.startswith("["):
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return [str(item).strip().rstrip("/") for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            pass

    return [origin.strip().rstrip("/") for origin in cleaned.split(",") if origin.strip()]


class Settings(BaseSettings):
    PROJECT_NAME: str = "HireMatch AI"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./talentmatch.db"

    # CORS
    CORS_ORIGINS: str = ""

    # Uploads
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")

    # AI Matching Engine Weights
    WEIGHT_SKILLS: float = 0.50
    WEIGHT_KEYWORDS: float = 0.30
    WEIGHT_EXPERIENCE: float = 0.20

    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        cleaned = value.strip()
        if cleaned.startswith("postgres://"):
            return cleaned.replace("postgres://", "postgresql://", 1)
        return cleaned

    @property
    def cors_origins_list(self) -> List[str]:
        origins = _parse_cors_origins(self.CORS_ORIGINS)
        if self.is_production:
            return [origin for origin in origins if origin != "*"]
        return origins if origins else list(_LOCAL_DEV_CORS_ORIGINS)

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        secret = (self.SECRET_KEY or "").strip()
        if not secret:
            raise ValueError("SECRET_KEY must be configured and non-empty.")

        if self.is_production:
            if secret.lower() in _INSECURE_SECRET_PLACEHOLDERS or len(secret) < 32:
                raise ValueError(
                    "A secure SECRET_KEY (at least 32 characters, non-placeholder) is required in production."
                )

            raw_origins = _parse_cors_origins(self.CORS_ORIGINS)
            if "*" in raw_origins:
                raise ValueError("Wildcard CORS_ORIGINS ('*') is not permitted in production.")

        return self


settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
