from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

# Project root directory: E:\Main_Projects\GarudaA.S.T.R.A
ROOT_DIR = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    PROJECT_NAME: str = "GARUDA A.S.T.R.A Backend"
    API_V1_STR: str = "/api/v1"
    
    # Environment profile: 'local', 'hybrid', or 'deployed'
    APP_PROFILE: str = "hybrid"
    APP_ENV: str = "development"
    
    # Database
    LOCAL_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/astra_db"
    CLOUD_DATABASE_URL: str = ""
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/astra_db"
    
    @property
    def sync_database_uri(self) -> str:
        return self.DATABASE_URL
        
    @property
    def async_database_uri(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://frontend.garudaastra.dpdns.org"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Security
    SECRET_KEY: str = "astra-tactical-secret-key-2026-v2"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours (prevents premature session expiration during dev/demo)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_DIR / ".env"), ".env", "database/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
