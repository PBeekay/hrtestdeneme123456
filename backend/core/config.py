import os
from pydantic_settings import BaseSettings
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "HR Dashboard API"
    API_V1_STR: str = "/api"
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://eskidc.com",
        "https://www.eskidc.com",
        "https://api.eskidc.com"
    ]

    # Veritabanı Ayarları
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "hr_db")
    SQLALCHEMY_DATABASE_URL: Optional[str] = None

    # JWT Ayarları
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.SQLALCHEMY_DATABASE_URL:
            self.SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    class Config:
        case_sensitive = True

settings = Settings()
