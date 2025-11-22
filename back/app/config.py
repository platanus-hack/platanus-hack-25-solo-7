from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # WorkOS Configuration
    workos_api_key: str = Field(..., alias="WORKOS_API_KEY")
    workos_client_id: str = Field(..., alias="WORKOS_CLIENT_ID")
    workos_redirect_uri: str = Field(..., alias="WORKOS_REDIRECT_URI")
    workos_cookie_password: str = Field(..., alias="WORKOS_COOKIE_PASSWORD")
    
    # Database Configuration
    database_url: str = Field(..., alias="DATABASE_URL")
    
    # Application Configuration
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"


# Create a singleton instance
settings = Settings()
