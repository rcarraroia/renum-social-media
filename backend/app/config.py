from pydantic_settings import BaseSettings
from typing import List
from pydantic import Field, field_validator

class Settings(BaseSettings):
    # Supabase
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(None, env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")
    
    # AI Services
    anthropic_api_key: str | None = Field(None, env="ANTHROPIC_API_KEY")
    
    # Web Search
    tavily_api_key: str | None = Field(None, env="TAVILY_API_KEY")
    
    # Transcription
    deepgram_api_key: str | None = Field(None, env="DEEPGRAM_API_KEY")
    whisper_model: str = Field("base", env="WHISPER_MODEL")
    
    # Metricool
    metricool_access_token: str | None = Field(None, env="METRICOOL_ACCESS_TOKEN")
    
    # Encryption
    encryption_key: str = Field(..., env="ENCRYPTION_KEY")
    
    # CORS
    frontend_url: str = Field("https://renum.vercel.app", env="FRONTEND_URL")
    allowed_origins: str = Field("http://localhost:5173,https://renum.vercel.app", env="ALLOWED_ORIGINS")
    
    # Storage
    temp_video_path: str = Field("/tmp/videos", env="TEMP_VIDEO_PATH")
    
    # Server
    host: str = Field("0.0.0.0", env="HOST")
    port: int = Field(8000, env="PORT")
    environment: str = Field("production", env="ENVIRONMENT")
    debug: bool = Field(False, env="DEBUG")
    
    # Logs
    log_level: str = Field("INFO", env="LOG_LEVEL")
    
    @field_validator("allowed_origins")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def validate_critical_vars(self):
        """Validate that critical environment variables are set"""
        errors = []
        
        if not self.supabase_url:
            errors.append("SUPABASE_URL is required")
        if not self.supabase_service_role_key:
            errors.append("SUPABASE_SERVICE_ROLE_KEY is required")
        if not self.encryption_key:
            errors.append("ENCRYPTION_KEY is required")
        
        if errors:
            raise ValueError(f"Missing critical environment variables: {', '.join(errors)}")

settings = Settings()
settings.validate_critical_vars()