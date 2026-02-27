import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the directory of the current file (core/)
# Its parent is the server root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Settings(BaseSettings):
    PROJECT_NAME: str = "Donki-Wonki API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    FIREBASE_CREDENTIALS_JSON: str | None = None
    FIREBASE_CREDENTIALS_PATH: str = os.path.join(BASE_DIR, "firebaseServiceAccountKey.json")

    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_MAX_RETRIES: int = 3
    GEMINI_TIMEOUT_SECONDS: int = 30
    GEMINI_MIN_CONFIDENCE: float = 0.7

    GOOGLE_MAPS_API_KEY: str | None = None
    STATIONS_DATA_PATH: str = os.path.join(BASE_DIR, "data", "stations.json")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
