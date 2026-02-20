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
    
    # Encryption
    encryption_key: str = Field(..., env="ENCRYPTION_KEY")
    
    # Webhook Secrets
    heygen_webhook_secret: str | None = Field(None, env="HEYGEN_WEBHOOK_SECRET")
    
    # Redis (for rate limiting and caching)
    redis_host: str = Field("localhost", env="REDIS_HOST")
    redis_port: int = Field(6379, env="REDIS_PORT")
    redis_db: int = Field(0, env="REDIS_DB")
    redis_password: str | None = Field(None, env="REDIS_PASSWORD")
    
    def get_redis_url(self) -> str:
        """Retorna URL de conexão do Redis"""
        # Ignorar senha se for None ou string vazia
        if self.redis_password and self.redis_password.strip():
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"
    
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
    
    def get_cors_origins(self) -> list[str]:
        """
        Retorna lista de origens permitidas baseado no ambiente.
        NUNCA retorna ["*"] para evitar vulnerabilidades de segurança.
        """
        # SEMPRE priorizar ALLOWED_ORIGINS se foi configurada
        if self.allowed_origins:
            # allowed_origins já é uma lista após o field_validator
            if isinstance(self.allowed_origins, list):
                return self.allowed_origins
            # Fallback se por algum motivo ainda for string
            return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        
        # Caso contrário, usar origens padrão baseadas no ambiente
        if self.environment == "production":
            return [
                "https://renum.app",
                "https://app.renum.com",
                "https://www.renum.com",
                "https://renum.vercel.app",
            ]
        elif self.environment == "staging":
            return [
                "https://staging.renum.app",
                "https://renum-staging.vercel.app",
                "http://localhost:5173",
            ]
        else:  # development
            return [
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000",
            ]
    
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
