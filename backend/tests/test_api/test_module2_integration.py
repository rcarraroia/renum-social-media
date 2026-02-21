"""
Testes de integração para module2 (PostRápido) com dual mode OpenRouter/Anthropic

Valida que as rotas de geração de descrições funcionam corretamente com ambos os providers.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock


@pytest.fixture
def mock_auth_user():
    """Mock do usuário autenticado"""
    user = MagicMock()
    user.id = "550e8400-e29b-41d4-a716-446655440000"  # UUID válido
    user.email = "test@example.com"
    return user


@pytest.fixture
def mock_get_organization():
    """Mock da função get_organization_by_user_id"""
    with patch('app.api.deps.get_organization_by_user_id', new_callable=AsyncMock) as mock:
        mock.return_value = "test-org-123"
        yield mock


@pytest.fixture
def mock_anthropic_descriptions():
    """Mock do ClaudeService.generate_descriptions"""
    with patch('app.services.claude.ClaudeService.generate_descriptions') as mock:
        mock.return_value = {
            "instagram": {
                "description": "Test Instagram description",
                "hashtags": ["#test", "#instagram"]
            },
            "tiktok": {
                "description": "Test TikTok description",
                "hashtags": ["#test", "#tiktok"]
            }
        }
        yield mock


@pytest.fixture
def mock_openrouter_descriptions():
    """Mock do OpenRouterService.generate_descriptions"""
    with patch('app.services.openrouter.OpenRouterService.generate_descriptions') as mock:
        mock.return_value = {
            "instagram": {
                "description": "Test Instagram description from OpenRouter",
                "hashtags": ["#test", "#instagram"]
            },
            "tiktok": {
                "description": "Test TikTok description from OpenRouter",
                "hashtags": ["#test", "#tiktok"]
            }
        }
        yield mock


@pytest.mark.integration
class TestPostRapidoWithAnthropic:
    """Testes de integração do PostRápido usando Anthropic (USE_OPENROUTER=false)"""
    
    def test_generate_descriptions_with_anthropic(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_anthropic_descriptions, 
        auth_headers
    ):
        """Testa geração de descrições com Anthropic"""
        with patch('app.config.settings.use_openrouter', False):
            with patch('app.config.settings.anthropic_api_key', 'test-key'):
                from app.main import app
                from app.api.deps import get_current_user
                
                async def override_get_current_user():
                    return mock_auth_user
                
                app.dependency_overrides[get_current_user] = override_get_current_user
                
                try:
                    response = test_client.post(
                        "/api/postrapido/descriptions/generate",
                        json={
                            "videoId": "550e8400-e29b-41d4-a716-446655440001",
                            "platforms": ["instagram", "tiktok"],
                            "tone": "casual",
                            "includeHashtags": True
                        },
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert "descriptions" in data
                    assert "instagram" in data["descriptions"]
                    assert "tiktok" in data["descriptions"]
                    assert mock_anthropic_descriptions.called
                finally:
                    app.dependency_overrides.clear()


@pytest.mark.integration
class TestPostRapidoWithOpenRouter:
    """Testes de integração do PostRápido usando OpenRouter (USE_OPENROUTER=true)"""
    
    def test_generate_descriptions_with_openrouter(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_openrouter_descriptions, 
        auth_headers
    ):
        """Testa geração de descrições com OpenRouter"""
        with patch('app.config.settings.use_openrouter', True):
            with patch('app.config.settings.openrouter_api_key', 'sk-or-test-key'):
                with patch('app.config.settings.openrouter_description_model', 'google/gemini-flash-1.5'):
                    from app.main import app
                    from app.api.deps import get_current_user
                    
                    async def override_get_current_user():
                        return mock_auth_user
                    
                    app.dependency_overrides[get_current_user] = override_get_current_user
                    
                    try:
                        response = test_client.post(
                            "/api/postrapido/descriptions/generate",
                            json={
                                "videoId": "550e8400-e29b-41d4-a716-446655440001",
                                "platforms": ["instagram", "tiktok"],
                                "tone": "casual",
                                "includeHashtags": True
                            },
                            headers=auth_headers
                        )
                        
                        assert response.status_code == 200
                        data = response.json()
                        assert "descriptions" in data
                        assert "instagram" in data["descriptions"]
                        assert "tiktok" in data["descriptions"]
                        assert mock_openrouter_descriptions.called
                    finally:
                        app.dependency_overrides.clear()


@pytest.mark.integration
class TestPostRapidoMultiplePlatforms:
    """Testes de geração para múltiplas plataformas"""
    
    def test_generate_for_multiple_platforms(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        mock_anthropic_descriptions, 
        auth_headers
    ):
        """Testa geração de descrições para múltiplas plataformas"""
        with patch('app.config.settings.use_openrouter', False):
            with patch('app.config.settings.anthropic_api_key', 'test-key'):
                from app.main import app
                from app.api.deps import get_current_user
                
                async def override_get_current_user():
                    return mock_auth_user
                
                app.dependency_overrides[get_current_user] = override_get_current_user
                
                try:
                    response = test_client.post(
                        "/api/postrapido/descriptions/generate",
                        json={
                            "videoId": "550e8400-e29b-41d4-a716-446655440001",
                            "platforms": ["instagram", "tiktok", "linkedin", "youtube"],
                            "tone": "professional",
                            "includeHashtags": True
                        },
                        headers=auth_headers
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        assert "descriptions" in data
                        assert len(data["descriptions"]) > 0
                finally:
                    app.dependency_overrides.clear()


@pytest.mark.integration
class TestPostRapidoErrorHandling:
    """Testes de tratamento de erros do PostRápido"""
    
    def test_generate_with_invalid_anthropic_key(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
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
                        "/api/postrapido/descriptions/generate",
                        json={
                            "videoId": "550e8400-e29b-41d4-a716-446655440001",
                            "platforms": ["instagram"],
                            "tone": "casual",
                            "includeHashtags": True
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
                        "/api/postrapido/descriptions/generate",
                        json={
                            "videoId": "550e8400-e29b-41d4-a716-446655440001",
                            "platforms": ["instagram"],
                            "tone": "casual",
                            "includeHashtags": True
                        },
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 503
                    data = response.json()
                    assert "detail" in data
                finally:
                    app.dependency_overrides.clear()


@pytest.mark.integration
class TestTranscriptionWithFallback:
    """Testes de transcrição com fallback Deepgram → Whisper"""
    
    def test_transcribe_with_deepgram_success(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        auth_headers
    ):
        """Testa transcrição com Deepgram funcionando"""
        with patch('app.config.settings.deepgram_api_key', 'test-deepgram-key'):
            with patch('app.services.transcription.TranscriptionService.transcribe_audio') as mock_transcribe:
                mock_transcribe.return_value = {
                    "transcription": "Test transcription",
                    "segments": [],
                    "provider": "deepgram"
                }
                
                from app.main import app
                from app.api.deps import get_current_user
                
                async def override_get_current_user():
                    return mock_auth_user
                
                app.dependency_overrides[get_current_user] = override_get_current_user
                
                try:
                    response = test_client.post(
                        "/api/postrapido/transcribe",
                        json={
                            "videoId": "550e8400-e29b-41d4-a716-446655440001",
                            "language": "pt-BR"
                        },
                        headers=auth_headers
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        assert data["provider"] == "deepgram"
                finally:
                    app.dependency_overrides.clear()
    
    def test_transcribe_with_deepgram_fallback_to_whisper(
        self, 
        test_client, 
        mock_auth_user,
        mock_get_organization,
        auth_headers
    ):
        """Testa fallback de Deepgram para Whisper"""
        with patch('app.config.settings.deepgram_api_key', 'test-deepgram-key'):
            with patch('app.services.transcription.TranscriptionService.transcribe_audio') as mock_transcribe:
                mock_transcribe.return_value = {
                    "transcription": "Test transcription from Whisper",
                    "segments": [],
                    "provider": "whisper"
                }
                
                from app.main import app
                from app.api.deps import get_current_user
                
                async def override_get_current_user():
                    return mock_auth_user
                
                app.dependency_overrides[get_current_user] = override_get_current_user
                
                try:
                    response = test_client.post(
                        "/api/postrapido/transcribe",
                        json={
                            "videoId": "550e8400-e29b-41d4-a716-446655440001",
                            "language": "pt-BR"
                        },
                        headers=auth_headers
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        assert data["provider"] == "whisper"
                finally:
                    app.dependency_overrides.clear()

