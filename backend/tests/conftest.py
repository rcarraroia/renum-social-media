"""
Configuração global de testes e fixtures compartilhadas
"""
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from httpx import AsyncClient
from app.main import app
from app.database import supabase
from app.core.cache import cache


# ============================================================================
# FIXTURES DE CONFIGURAÇÃO
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Cria event loop para testes assíncronos"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def test_client() -> Generator[TestClient, None, None]:
    """
    Cliente de teste síncrono para FastAPI
    
    Usage:
        def test_endpoint(test_client):
            response = test_client.get("/health")
            assert response.status_code == 200
    """
    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="function")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Cliente de teste assíncrono para FastAPI
    
    Usage:
        @pytest.mark.asyncio
        async def test_endpoint(async_client):
            response = await async_client.get("/health")
            assert response.status_code == 200
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


# ============================================================================
# FIXTURES DE DADOS DE TESTE
# ============================================================================

@pytest.fixture
def test_user_data():
    """Dados de usuário para testes"""
    return {
        "id": "test-user-123",
        "email": "test@example.com",
        "full_name": "Test User",
        "role": "owner",
        "organization_id": "test-org-123"
    }


@pytest.fixture
def test_organization_data():
    """Dados de organização para testes"""
    return {
        "id": "test-org-123",
        "name": "Test Organization",
        "plan": "free",
        "heygen_api_key": None
    }


@pytest.fixture
def test_video_data():
    """Dados de vídeo para testes"""
    return {
        "id": "test-video-123",
        "organization_id": "test-org-123",
        "user_id": "test-user-123",
        "title": "Test Video",
        "status": "pending",
        "video_url": "https://example.com/video.mp4"
    }


@pytest.fixture
def test_post_data():
    """Dados de post para testes"""
    return {
        "id": "test-post-123",
        "organization_id": "test-org-123",
        "user_id": "test-user-123",
        "video_id": "test-video-123",
        "platform": "instagram",
        "caption": "Test caption",
        "status": "draft"
    }


# ============================================================================
# FIXTURES DE AUTENTICAÇÃO
# ============================================================================

@pytest.fixture
def auth_headers(test_user_data):
    """
    Headers de autenticação para testes
    
    Usage:
        def test_protected_endpoint(test_client, auth_headers):
            response = test_client.get("/api/videos", headers=auth_headers)
    """
    # Mock JWT token (em produção, gerar token real)
    return {
        "Authorization": "Bearer test-token-123",
        "X-Organization-ID": test_user_data["organization_id"]
    }


@pytest.fixture
def mock_current_user(test_user_data, monkeypatch):
    """
    Mock da função get_current_user
    
    Usage:
        def test_endpoint(test_client, mock_current_user):
            # Endpoint que usa Depends(get_current_user) retornará test_user_data
    """
    from app.api.dependencies import get_current_user
    
    async def mock_get_user():
        return test_user_data
    
    monkeypatch.setattr("app.api.dependencies.get_current_user", mock_get_user)
    return test_user_data


# ============================================================================
# FIXTURES DE BANCO DE DADOS
# ============================================================================

@pytest.fixture(scope="function", autouse=True)
def cleanup_test_data():
    """
    Limpa dados de teste após cada teste
    
    Executa automaticamente após cada teste
    """
    yield
    
    # Limpar dados de teste do Supabase
    try:
        # Deletar dados de teste (prefixo "test-")
        supabase.table("posts").delete().like("id", "test-%").execute()
        supabase.table("videos").delete().like("id", "test-%").execute()
        supabase.table("users").delete().like("id", "test-%").execute()
        supabase.table("organizations").delete().like("id", "test-%").execute()
    except Exception as e:
        # Ignorar erros de limpeza
        pass


@pytest.fixture
def db_session():
    """
    Sessão de banco de dados para testes
    
    Usage:
        def test_database(db_session):
            result = db_session.query(User).first()
    """
    # TODO: Implementar quando migrar para SQLAlchemy
    return supabase


# ============================================================================
# FIXTURES DE CACHE
# ============================================================================

@pytest.fixture(scope="function", autouse=True)
def cleanup_cache():
    """
    Limpa cache de teste após cada teste
    
    Executa automaticamente após cada teste
    """
    yield
    
    # Limpar cache de teste
    if cache.enabled:
        try:
            cache.delete_pattern("test:*")
        except Exception:
            pass


@pytest.fixture
def mock_cache_disabled(monkeypatch):
    """
    Mock do cache desabilitado
    
    Usage:
        def test_without_cache(mock_cache_disabled):
            # Cache estará desabilitado neste teste
    """
    monkeypatch.setattr(cache, "enabled", False)
    return cache


# ============================================================================
# FIXTURES DE SERVIÇOS EXTERNOS
# ============================================================================

@pytest.fixture
def mock_supabase_storage(monkeypatch):
    """
    Mock do Supabase Storage
    
    Usage:
        def test_upload(mock_supabase_storage):
            # Upload não fará requisição real
    """
    class MockStorage:
        def upload(self, path, content, options=None):
            return {"path": path}
        
        def get_public_url(self, path):
            return f"https://mock-storage.com/{path}"
        
        def remove(self, paths):
            return {"removed": len(paths)}
    
    class MockStorageFrom:
        def __init__(self, bucket):
            self.bucket = bucket
        
        def upload(self, *args, **kwargs):
            return MockStorage().upload(*args, **kwargs)
        
        def get_public_url(self, *args, **kwargs):
            return MockStorage().get_public_url(*args, **kwargs)
        
        def remove(self, *args, **kwargs):
            return MockStorage().remove(*args, **kwargs)
    
    def mock_from(bucket):
        return MockStorageFrom(bucket)
    
    monkeypatch.setattr(supabase.storage, "from_", mock_from)
    return MockStorage()


@pytest.fixture
def mock_redis(monkeypatch):
    """
    Mock do Redis
    
    Usage:
        def test_rate_limiting(mock_redis):
            # Rate limiting usará Redis mockado
    """
    class MockRedis:
        def __init__(self):
            self.data = {}
        
        def get(self, key):
            return self.data.get(key)
        
        def set(self, key, value):
            self.data[key] = value
        
        def setex(self, key, ttl, value):
            self.data[key] = value
        
        def delete(self, *keys):
            for key in keys:
                self.data.pop(key, None)
        
        def exists(self, key):
            return key in self.data
        
        def keys(self, pattern):
            # Simples implementação de pattern matching
            import fnmatch
            return [k for k in self.data.keys() if fnmatch.fnmatch(k, pattern)]
        
        def ping(self):
            return True
    
    mock_redis_instance = MockRedis()
    monkeypatch.setattr(cache, "redis_client", mock_redis_instance)
    monkeypatch.setattr(cache, "enabled", True)
    return mock_redis_instance


# ============================================================================
# FIXTURES DE HELPERS
# ============================================================================

@pytest.fixture
def create_test_user(db_session):
    """
    Helper para criar usuário de teste
    
    Usage:
        def test_user_creation(create_test_user):
            user = create_test_user(email="custom@example.com")
    """
    def _create_user(**kwargs):
        user_data = {
            "id": kwargs.get("id", "test-user-123"),
            "email": kwargs.get("email", "test@example.com"),
            "full_name": kwargs.get("full_name", "Test User"),
            "role": kwargs.get("role", "member"),
            "organization_id": kwargs.get("organization_id", "test-org-123")
        }
        
        result = supabase.table("users").insert(user_data).execute()
        return result.data[0] if result.data else user_data
    
    return _create_user


@pytest.fixture
def create_test_organization(db_session):
    """
    Helper para criar organização de teste
    
    Usage:
        def test_org_creation(create_test_organization):
            org = create_test_organization(name="Custom Org")
    """
    def _create_org(**kwargs):
        org_data = {
            "id": kwargs.get("id", "test-org-123"),
            "name": kwargs.get("name", "Test Organization"),
            "plan": kwargs.get("plan", "free")
        }
        
        result = supabase.table("organizations").insert(org_data).execute()
        return result.data[0] if result.data else org_data
    
    return _create_org


# ============================================================================
# MARKERS
# ============================================================================

def pytest_configure(config):
    """Configuração adicional do pytest"""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "e2e: mark test as an end-to-end test"
    )
    config.addinivalue_line(
        "markers", "security: mark test as a security test"
    )
    config.addinivalue_line(
        "markers", "performance: mark test as a performance test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow"
    )
