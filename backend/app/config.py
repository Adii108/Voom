import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application configuration loaded from environment variables."""

    APP_NAME: str = "Voom"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite:///./voom.db"
    )

    # CORS — allowed origins for the frontend
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000"
    ).split(",")

    # Base URL used to construct shareable meeting links
    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL", "http://localhost:3000"
    )


settings = Settings()
