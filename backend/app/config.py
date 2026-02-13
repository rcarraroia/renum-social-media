from pydantic_settings import BaseSettings
from typing import List
from pydantic import Field

class Settings(BaseSettings):
    # Supabase
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(None, env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")
    
    # Claude
    anthropic_api_key: str | None = Field(None, env="ANTHROPIC_API_KEY")
    
    # Tavily
    tavily_api_key: str | None = Field(None, env="TAVILY_API_KEY")
    
    # Server
    host: str = Field("0.0.0.0", env="HOST")
    port: int = Field(8000, env="PORT")
    environment: str = Field("production", env="ENVIRONMENT")
    debug: bool = Field(False, env="DEBUG")
    
    # CORS
    cors_origins: List[str] = Field([], env="CORS_ORIGINS")
    
    # Logs
    log_level: str = Field("INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()