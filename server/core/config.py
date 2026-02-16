from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Donki-Wonki API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    FIREBASE_CREDENTIALS_JSON: str | None = None
    FIREBASE_CREDENTIALS_PATH: str = "firebaseServiceAccountKey.json"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
