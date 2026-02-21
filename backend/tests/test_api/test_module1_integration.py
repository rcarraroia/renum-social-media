"""
Testes de integração para module1 (ScriptAI) com dual mode OpenRouter/Anthropic

Valida que as rotas funcionam corretamente com ambos os providers.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient


@pytest.fixture
def mock_auth_user():
    """Mock do usuário autenticado"""
    user = MagicMock()
    user.id = "550e8400-e29b-41d4-a716-446655440000"  # UUID válido
    user.email = "test@example.com"
    return user


@pytest.fixture
def mock_get_current_user(mock_auth_user):
    """Mock da função get_current_user"""
    async def _mock_user():
        return mock_auth_user
    
    with patch('app.api.deps.get_current_user', return_value=_mock_user()):
        yield mock_auth_user


@pytest.fixture
def mock_get_organization():
    """Mock da função get_organization_by_user_id"""
    with patch('app.api.deps.get_organization_by_user_id', new_callable=AsyncMock) as mock:
        mock.return_value = "test-org-123"
        yield mock


@pytest.fixture
def mock_tavily_search():
    """Mock do Tavily search para testes"""
    with patch('app.services.tavily.TavilyService.search') as mock:
        mock.return_value = {
            "results": [
                {
                    "title": "Test Result",
                    "url": "https://example.com",
                    "content": "Test content about the topic"
                }
            ]
        }
        yield mock


@pytest.fixture
def mock_anthropic_generate():
    """Mock do ClaudeService.generate_script_from_research"""
    with patch('app.services.claude.ClaudeService.generate_script_from_research') as mock:
        mock.return_value = {
            "success": True,
            "script": "Test script content",
            "word_count": 150,
            "estimated_duration": 60,
            "model": "claude-sonnet-4"
        }
        yield mock


@pytest.fixture
def mock_openrouter_generate():
    """Mock do OpenRouterService.generate_script_from_research"""
    with patch('app.services.openrouter.OpenRouterService.generate_script_from_research') as mock:
        mock.return_value = {
            "success": True,
            "script": "Test script content from OpenRouter",
            "word_count": 150,
            "estimated_duration": 60,
            "model": "anthropic/claude-sonnet-4"
        }
        yield mock


@pytest.mark.integration
class TestScriptAIWithAnthropic:
    """Testes de integração do ScriptAI usando Anthropic (USE_OPENROUTER=false)"""
    
    def test_generate_with_anthropic(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_tavily_search, 
        mock_anthropic_generate, 
        auth_headers
    ):
        """Testa geração de script com Anthropic"""
        with patch('app.config.settings.use_openrouter', False):
            with patch('app.config.settings.anthropic_api_key', 'test-key'):
                # Override dependency
                from app.main import app
                from app.api.deps import get_current_user
                
                async def override_get_current_user():
                    return mock_auth_user
                
                app.dependency_overrides[get_current_user] = override_get_current_user
                
                try:
                    response = test_client.post(
                        "/api/scriptai/generate",
                        json={
                            "topic": "Test topic",
                            "audience": "general",
                            "tone": "informal",
                            "duration": 60
                        },
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert data["success"] is True
                    assert "script" in data
                    assert data["script"] == "Test script content"
                    assert mock_tavily_search.called
                    assert mock_anthropic_generate.called
                finally:
                    app.dependency_overrides.clear()
    
    def test_regenerate_with_anthropic(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_anthropic_generate, 
        auth_headers
    ):
        """Testa regeneração de script com Anthropic"""
        with patch('app.config.settings.use_openrouter', False):
            with patch('app.config.settings.anthropic_api_key', 'test-key'):
                from app.main import app
                from app.api.deps import get_current_user
                
                async def override_get_current_user():
                    return mock_auth_user
                
                app.dependency_overrides[get_current_user] = override_get_current_user
                
                try:
                    response = test_client.post(
                        "/api/scriptai/regenerate",
                        json={
                            "scriptId": "test-script-123",
                            "feedback": "Make it more engaging"
                        },
                        headers=auth_headers
                    )
                    
                    # Pode retornar 404 se script não existe, mas não deve dar erro 500
                    assert response.status_code in [200, 404]
                finally:
                    app.dependency_overrides.clear()


@pytest.mark.integration
class TestScriptAIWithOpenRouter:
    """Testes de integração do ScriptAI usando OpenRouter (USE_OPENROUTER=true)"""
    
    def test_generate_with_openrouter(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_tavily_search, 
        mock_openrouter_generate, 
        auth_headers
    ):
        """Testa geração de script com OpenRouter"""
        with patch('app.config.settings.use_openrouter', True):
            with patch('app.config.settings.openrouter_api_key', 'sk-or-test-key'):
                with patch('app.config.settings.openrouter_script_model', 'anthropic/claude-sonnet-4'):
                    from app.main import app
                    from app.api.deps import get_current_user
                    
                    async def override_get_current_user():
                        return mock_auth_user
                    
                    app.dependency_overrides[get_current_user] = override_get_current_user
                    
                    try:
                        response = test_client.post(
                            "/api/scriptai/generate",
                            json={
                                "topic": "Test topic",
                                "audience": "general",
                                "tone": "informal",
                                "duration": 60
                            },
                            headers=auth_headers
                        )
                        
                        assert response.status_code == 200
                        data = response.json()
                        assert data["success"] is True
                        assert "script" in data
                        assert data["script"] == "Test script content from OpenRouter"
                        assert mock_tavily_search.called
                        assert mock_openrouter_generate.called
                    finally:
                        app.dependency_overrides.clear()
    
    def test_regenerate_with_openrouter(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_openrouter_generate, 
        auth_headers
    ):
        """Testa regeneração de script com OpenRouter"""
        with patch('app.config.settings.use_openrouter', True):
            with patch('app.config.settings.openrouter_api_key', 'sk-or-test-key'):
                with patch('app.config.settings.openrouter_script_model', 'anthropic/claude-sonnet-4'):
                    from app.main import app
                    from app.api.deps import get_current_user
                    
                    async def override_get_current_user():
                        return mock_auth_user
                    
                    app.dependency_overrides[get_current_user] = override_get_current_user
                    
                    try:
                        response = test_client.post(
                            "/api/scriptai/regenerate",
                            json={
                                "scriptId": "test-script-123",
                                "feedback": "Make it more engaging"
                            },
                            headers=auth_headers
                        )
                        
                        # Pode retornar 404 se script não existe, mas não deve dar erro 500
                        assert response.status_code in [200, 404]
                    finally:
                        app.dependency_overrides.clear()


@pytest.mark.integration
class TestScriptAIErrorHandling:
    """Testes de tratamento de erros do ScriptAI"""
    
    def test_generate_with_invalid_anthropic_key(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_tavily_search, 
        auth_headers
    ):
        """Testa que API key inválida do Anthropic retorna HTTP 503"""
        with patch('app.config.settings.use_openrouter', False):
            with patch('app.config.settings.anthropic_api_key', None):
                from app.main import app
                from app.api.deps import get_current_user
                
                async def override_get_current_user():
                    return mock_auth_user
                
                app.dependency_overrides[get_current_user] = override_get_current_user
                
                try:
                    response = test_client.post(
                        "/api/scriptai/generate",
                        json={
                            "topic": "Test topic",
                            "audience": "general",
                            "tone": "informal",
                            "duration": 60
                        },
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 503
                    data = response.json()
                    assert "detail" in data
                finally:
                    app.dependency_overrides.clear()
    
    def test_generate_with_invalid_openrouter_key(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_tavily_search, 
        auth_headers
    ):
        """Testa que API key inválida do OpenRouter retorna HTTP 503"""
        with patch('app.config.settings.use_openrouter', True):
            with patch('app.config.settings.openrouter_api_key', None):
                from app.main import app
                from app.api.deps import get_current_user
                
                async def override_get_current_user():
                    return mock_auth_user
                
                app.dependency_overrides[get_current_user] = override_get_current_user
                
                try:
                    response = test_client.post(
                        "/api/scriptai/generate",
                        json={
                            "topic": "Test topic",
                            "audience": "general",
                            "tone": "informal",
                            "duration": 60
                        },
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 503
                    data = response.json()
                    assert "detail" in data
                finally:
                    app.dependency_overrides.clear()
    
    def test_generate_with_tavily_failure(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        auth_headers
    ):
        """Testa que falha do Tavily é tratada corretamente"""
        with patch('app.config.settings.use_openrouter', False):
            with patch('app.config.settings.anthropic_api_key', 'test-key'):
                with patch('app.services.tavily.TavilyService.search') as mock_tavily:
                    mock_tavily.side_effect = Exception("Tavily API error")
                    
                    from app.main import app
                    from app.api.deps import get_current_user
                    
                    async def override_get_current_user():
                        return mock_auth_user
                    
                    app.dependency_overrides[get_current_user] = override_get_current_user
                    
                    try:
                        response = test_client.post(
                            "/api/scriptai/generate",
                            json={
                                "topic": "Test topic",
                                "audience": "general",
                                "tone": "informal",
                                "duration": 60
                            },
                            headers=auth_headers
                        )
                        
                        # Deve retornar erro 500 ou 503
                        assert response.status_code in [500, 503]
                    finally:
                        app.dependency_overrides.clear()

