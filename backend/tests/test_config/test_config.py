"""
Testes unitários para app/config.py

Valida configurações da aplicação e variáveis de ambiente.
"""
import pytest
from unittest.mock import patch, MagicMock
from pydantic import ValidationError


class TestSettings:
    """Testes para classe Settings"""
    
    def test_get_redis_url_without_password(self):
        """Testa geração de URL Redis sem senha"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
            'REDIS_HOST': 'localhost',
            'REDIS_PORT': '6379',
            'REDIS_DB': '0',
        }, clear=True):
            settings = Settings()
            url = settings.get_redis_url()
            
            assert url == "redis://localhost:6379/0"
    
    def test_get_redis_url_with_password(self):
        """Testa geração de URL Redis com senha"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
            'REDIS_HOST': 'redis.example.com',
            'REDIS_PORT': '6380',
            'REDIS_DB': '1',
            'REDIS_PASSWORD': 'secret_password',
        }, clear=True):
            settings = Settings()
            url = settings.get_redis_url()
            
            assert url == "redis://:secret_password@redis.example.com:6380/1"
    
    def test_get_cors_origins_production(self):
        """Testa origens CORS em produção"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
            'ENVIRONMENT': 'production',
            'ALLOWED_ORIGINS': '',
        }, clear=True):
            settings = Settings()
            origins = settings.get_cors_origins()
            
            assert "https://renum.app" in origins
            assert "https://app.renum.com" in origins
            assert "https://www.renum.com" in origins
            assert "http://localhost:5173" not in origins
    
    def test_get_cors_origins_staging(self):
        """Testa origens CORS em staging"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
            'ENVIRONMENT': 'staging',
            'ALLOWED_ORIGINS': '',
        }, clear=True):
            settings = Settings()
            origins = settings.get_cors_origins()
            
            assert "https://staging.renum.app" in origins
            assert "http://localhost:5173" in origins
    
    def test_get_cors_origins_development(self):
        """Testa origens CORS em desenvolvimento"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
            'ENVIRONMENT': 'development',
            'ALLOWED_ORIGINS': '',
        }, clear=True):
            settings = Settings()
            origins = settings.get_cors_origins()
            
            assert "http://localhost:5173" in origins
            assert "http://localhost:3000" in origins
            assert "http://127.0.0.1:5173" in origins
    
    def test_get_cors_origins_never_returns_wildcard(self):
        """Testa que CORS nunca retorna wildcard"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
            'ENVIRONMENT': 'production',
        }, clear=True):
            settings = Settings()
            origins = settings.get_cors_origins()
            
            assert "*" not in origins
            assert ["*"] != origins
    
    def test_get_cors_origins_with_custom_allowed_origins(self):
        """Testa origens CORS customizadas"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
            'ALLOWED_ORIGINS': 'https://custom1.com,https://custom2.com',
        }, clear=True):
            settings = Settings()
            origins = settings.get_cors_origins()
            
            assert "https://custom1.com" in origins
            assert "https://custom2.com" in origins
    
    def test_parse_origins_validator(self):
        """Testa validador de origens"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
            'ALLOWED_ORIGINS': 'https://site1.com, https://site2.com , https://site3.com',
        }, clear=True):
            settings = Settings()
            
            # Verificar que espaços foram removidos
            assert isinstance(settings.allowed_origins, list)
            assert "https://site1.com" in settings.allowed_origins
            assert "https://site2.com" in settings.allowed_origins
            assert "https://site3.com" in settings.allowed_origins
    
    def test_validate_critical_vars_missing_supabase_url(self):
        """Testa validação com SUPABASE_URL faltando"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
        }, clear=True):
            with pytest.raises(ValidationError):
                Settings()
    
    def test_validate_critical_vars_missing_service_role_key(self):
        """Testa validação com SERVICE_ROLE_KEY faltando"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'ENCRYPTION_KEY': 'test_encryption_key',
        }, clear=True):
            with pytest.raises(ValidationError):
                Settings()
    
    def test_validate_critical_vars_missing_encryption_key(self):
        """Testa validação com ENCRYPTION_KEY faltando"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
        }, clear=True):
            with pytest.raises(ValidationError):
                Settings()
    
    def test_default_values(self):
        """Testa valores padrão das configurações"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
        }, clear=True):
            settings = Settings()
            
            assert settings.redis_host == "localhost"
            assert settings.redis_port == 6379
            assert settings.redis_db == 0
            assert settings.host == "0.0.0.0"
            assert settings.port == 8000
            assert settings.environment == "production"
            assert settings.debug is False
            assert settings.log_level == "INFO"
            assert settings.whisper_model == "base"
    
    def test_optional_api_keys_can_be_none(self):
        """Testa que API keys opcionais podem ser None"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'ENCRYPTION_KEY': 'test_encryption_key',
        }, clear=True):
            settings = Settings()
            
            assert settings.anthropic_api_key is None
            assert settings.tavily_api_key is None
            assert settings.deepgram_api_key is None
            assert settings.heygen_webhook_secret is None
    
    def test_case_insensitive_env_vars(self):
        """Testa que variáveis de ambiente são case-insensitive"""
        from app.config import Settings
        
        with patch.dict('os.environ', {
            'supabase_url': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test_key',
            'encryption_key': 'test_encryption_key',
        }, clear=True):
            settings = Settings()
            
            assert settings.supabase_url == 'https://test.supabase.co'
            assert settings.encryption_key == 'test_encryption_key'
