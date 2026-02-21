"""
Testes unitários para app/services/openrouter.py

Valida inicialização e validação de API keys do OpenRouterService.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.services.openrouter import OpenRouterService


class TestOpenRouterServiceInitialization:
    """Testes para inicialização do OpenRouterService (TASK 2.1)"""
    
    def test_init_with_valid_key(self):
        """Testa inicialização com API key válida"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key-123"
            mock_settings.openrouter_script_model = "anthropic/claude-sonnet-4"
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = "x-ai/grok-beta"
            
            with patch('app.services.openrouter.OpenAI') as mock_openai:
                service = OpenRouterService()
                
                assert service.client is not None
                assert service.script_model == "anthropic/claude-sonnet-4"
                assert service.description_model == "google/gemini-flash-1.5"
                assert service.assistant_model == "x-ai/grok-beta"
                
                # Verificar que OpenAI foi inicializado corretamente
                mock_openai.assert_called_once_with(
                    base_url="https://openrouter.ai/api/v1",
                    api_key="sk-or-valid-key-123"
                )
    
    def test_init_with_none_key(self):
        """Testa que key = None resulta em client = None"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = None
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            service = OpenRouterService()
            
            assert service.client is None
    
    def test_init_with_empty_key(self):
        """Testa que key = '' resulta em client = None"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = ""
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            service = OpenRouterService()
            
            assert service.client is None
    
    def test_init_with_placeholder_key(self):
        """Testa que key = 'placeholder' resulta em client = None"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "placeholder"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            service = OpenRouterService()
            
            assert service.client is None
    
    def test_init_with_whitespace_key(self):
        """Testa que key com apenas espaços resulta em client = None"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "   "
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            service = OpenRouterService()
            
            assert service.client is None
    
    def test_init_logging_provider_used(self):
        """Testa que logging indica modelos configurados"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = "anthropic/claude-sonnet-4"
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = "x-ai/grok-beta"
            
            with patch('app.services.openrouter.OpenAI'):
                with patch('app.services.openrouter.logger') as mock_logger:
                    service = OpenRouterService()
                    
                    # Verificar que logou inicialização
                    mock_logger.info.assert_called_once()
                    call_args = mock_logger.info.call_args
                    assert "OpenRouter service initialized" in call_args[0][0]
    
    def test_validate_model_configured_with_model(self):
        """Testa validação quando modelo está configurado"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = "anthropic/claude-sonnet-4"
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI'):
                service = OpenRouterService()
                
                # Não deve lançar exceção
                service._validate_model_configured("anthropic/claude-sonnet-4", "script")
    
    def test_validate_model_configured_without_model(self):
        """Testa validação quando modelo NÃO está configurado"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI'):
                service = OpenRouterService()
                
                # Deve lançar exceção com mensagem clara
                with pytest.raises(Exception) as exc_info:
                    service._validate_model_configured(None, "script")
                
                assert "script model not configured" in str(exc_info.value).lower()
                assert "OPENROUTER_SCRIPT_MODEL" in str(exc_info.value)
                assert "admin panel" in str(exc_info.value).lower()


class TestOpenRouterServiceValidation:
    """Testes para métodos de validação"""
    
    def test_is_valid_api_key_with_valid_key(self):
        """Testa validação de key válida"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI'):
                service = OpenRouterService()
                
                assert service._is_valid_api_key("sk-or-valid-key") == True
                assert service._is_valid_api_key("any-non-empty-string") == True
    
    def test_is_valid_api_key_with_invalid_keys(self):
        """Testa validação de keys inválidas"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI'):
                service = OpenRouterService()
                
                assert service._is_valid_api_key(None) == False
                assert service._is_valid_api_key("") == False
                assert service._is_valid_api_key("   ") == False
                assert service._is_valid_api_key("placeholder") == False
                assert service._is_valid_api_key("PLACEHOLDER") == False
                assert service._is_valid_api_key("PlAcEhOlDeR") == False



class TestOpenRouterServiceScriptGeneration:
    """Testes para geração de scripts (TASK 2.2)"""
    
    @pytest.mark.asyncio
    async def test_generate_script_success(self):
        """Testa geração de script com sucesso"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = "anthropic/claude-sonnet-4"
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                # Mock da resposta do OpenRouter
                mock_response = MagicMock()
                mock_response.choices = [MagicMock()]
                mock_response.choices[0].message.content = "Este é um script de teste gerado pelo modelo."
                mock_client.chat.completions.create = MagicMock(return_value=mock_response)
                
                service = OpenRouterService()
                
                result = await service.generate_script_from_research(
                    topic="Inteligência Artificial",
                    research_context="IA está transformando o mundo...",
                    audience="general",
                    tone="professional",
                    duration_seconds=60,
                    language="pt-BR"
                )
                
                assert result["success"] == True
                assert "script" in result
                assert result["script"] == "Este é um script de teste gerado pelo modelo."
                assert result["model"] == "anthropic/claude-sonnet-4"
                assert "word_count" in result
                assert "estimated_duration" in result
    
    @pytest.mark.asyncio
    async def test_generate_script_without_api_key(self):
        """Testa geração sem API key configurada"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = None
            mock_settings.openrouter_script_model = "anthropic/claude-sonnet-4"
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            service = OpenRouterService()
            
            result = await service.generate_script_from_research(
                topic="Test",
                research_context="Context",
                audience="general",
                tone="professional",
                duration_seconds=60,
                language="pt-BR"
            )
            
            assert result["success"] == False
            assert "not configured" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_generate_script_without_model_configured(self):
        """Testa geração sem modelo configurado"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI'):
                service = OpenRouterService()
                
                with pytest.raises(Exception) as exc_info:
                    await service.generate_script_from_research(
                        topic="Test",
                        research_context="Context",
                        audience="general",
                        tone="professional",
                        duration_seconds=60,
                        language="pt-BR"
                    )
                
                assert "script model not configured" in str(exc_info.value).lower()


class TestOpenRouterServiceDescriptions:
    """Testes para geração de descrições (TASK 2.3 e 2.4)"""
    
    @pytest.mark.asyncio
    async def test_generate_descriptions_success(self):
        """Testa geração de descrições para múltiplas plataformas"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                # Mock da resposta
                mock_response = MagicMock()
                mock_response.choices = [MagicMock()]
                mock_response.choices[0].message.content = "Descrição otimizada para a plataforma #teste #ai"
                mock_client.chat.completions.create = MagicMock(return_value=mock_response)
                
                service = OpenRouterService()
                
                result = await service.generate_descriptions(
                    transcription="Transcrição do vídeo sobre IA",
                    platforms=["instagram", "linkedin"],
                    tone="profissional",
                    include_hashtags=True
                )
                
                assert "instagram" in result
                assert "linkedin" in result
                assert result["instagram"]["text"] == "Descrição otimizada para a plataforma #teste #ai"
                assert result["instagram"]["characterCount"] > 0
                assert len(result["instagram"]["hashtags"]) == 2
    
    @pytest.mark.asyncio
    async def test_generate_descriptions_single_platform(self):
        """Testa geração de descrição para uma única plataforma"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                mock_response = MagicMock()
                mock_response.choices = [MagicMock()]
                mock_response.choices[0].message.content = "Descrição para X"
                mock_client.chat.completions.create = MagicMock(return_value=mock_response)
                
                service = OpenRouterService()
                
                result = await service.generate_descriptions(
                    transcription="Transcrição",
                    platforms=["x"],
                    tone="profissional"
                )
                
                assert "x" in result
                assert result["x"]["maxCharacters"] == 280
    
    @pytest.mark.asyncio
    async def test_generate_descriptions_without_hashtags(self):
        """Testa geração sem hashtags"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                mock_response = MagicMock()
                mock_response.choices = [MagicMock()]
                mock_response.choices[0].message.content = "Descrição sem hashtags"
                mock_client.chat.completions.create = MagicMock(return_value=mock_response)
                
                service = OpenRouterService()
                
                result = await service.generate_descriptions(
                    transcription="Transcrição",
                    platforms=["instagram"],
                    include_hashtags=False
                )
                
                assert result["instagram"]["hashtags"] == []
    
    @pytest.mark.asyncio
    async def test_generate_descriptions_without_api_key(self):
        """Testa geração sem API key"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = None
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            service = OpenRouterService()
            
            with pytest.raises(Exception) as exc_info:
                await service.generate_descriptions(
                    transcription="Transcrição",
                    platforms=["instagram"]
                )
            
            assert "not configured" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_generate_descriptions_without_model_configured(self):
        """Testa geração sem modelo configurado"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = None
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI'):
                service = OpenRouterService()
                
                with pytest.raises(Exception) as exc_info:
                    await service.generate_descriptions(
                        transcription="Transcrição",
                        platforms=["instagram"]
                    )
                
                assert "description model not configured" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_generate_descriptions_partial_failure(self):
        """Testa quando uma plataforma falha mas outras sucedem"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                # Primeira chamada sucesso, segunda falha
                call_count = [0]
                def side_effect(*args, **kwargs):
                    call_count[0] += 1
                    if call_count[0] == 1:
                        mock_response = MagicMock()
                        mock_response.choices = [MagicMock()]
                        mock_response.choices[0].message.content = "Sucesso"
                        return mock_response
                    else:
                        raise Exception("API Error")
                
                mock_client.chat.completions.create = MagicMock(side_effect=side_effect)
                
                service = OpenRouterService()
                
                result = await service.generate_descriptions(
                    transcription="Transcrição",
                    platforms=["instagram", "linkedin"]
                )
                
                # Instagram sucesso
                assert result["instagram"]["text"] == "Sucesso"
                # LinkedIn falha
                assert "Erro ao gerar descrição" in result["linkedin"]["text"]
    
    @pytest.mark.asyncio
    async def test_generate_descriptions_character_limits(self):
        """Testa limites de caracteres por plataforma"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                mock_response = MagicMock()
                mock_response.choices = [MagicMock()]
                mock_response.choices[0].message.content = "Descrição"
                mock_client.chat.completions.create = MagicMock(return_value=mock_response)
                
                service = OpenRouterService()
                
                result = await service.generate_descriptions(
                    transcription="Transcrição",
                    platforms=["x", "linkedin", "youtube"]
                )
                
                assert result["x"]["maxCharacters"] == 280
                assert result["linkedin"]["maxCharacters"] == 3000
                assert result["youtube"]["maxCharacters"] == 5000
    
    @pytest.mark.asyncio
    async def test_regenerate_description_success(self):
        """Testa regeneração de descrição"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                mock_response = MagicMock()
                mock_response.choices = [MagicMock()]
                mock_response.choices[0].message.content = "Nova descrição regenerada"
                mock_client.chat.completions.create = MagicMock(return_value=mock_response)
                
                service = OpenRouterService()
                
                result = await service.regenerate_description(
                    transcription="Transcrição",
                    platform="instagram",
                    instructions="Adicione mais emojis",
                    current_description="Descrição antiga"
                )
                
                assert result["text"] == "Nova descrição regenerada"
                assert result["characterCount"] > 0
                assert "maxCharacters" in result
    
    @pytest.mark.asyncio
    async def test_regenerate_description_without_current(self):
        """Testa regeneração sem descrição atual"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                mock_response = MagicMock()
                mock_response.choices = [MagicMock()]
                mock_response.choices[0].message.content = "Nova descrição"
                mock_client.chat.completions.create = MagicMock(return_value=mock_response)
                
                service = OpenRouterService()
                
                result = await service.regenerate_description(
                    transcription="Transcrição",
                    platform="instagram",
                    instructions="Seja mais criativo"
                )
                
                assert result["text"] == "Nova descrição"
    
    @pytest.mark.asyncio
    async def test_regenerate_description_without_api_key(self):
        """Testa regeneração sem API key"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = None
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            service = OpenRouterService()
            
            with pytest.raises(Exception) as exc_info:
                await service.regenerate_description(
                    transcription="Transcrição",
                    platform="instagram",
                    instructions="Teste"
                )
            
            assert "not configured" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_regenerate_description_api_error(self):
        """Testa regeneração com erro da API"""
        with patch('app.services.openrouter.settings') as mock_settings:
            mock_settings.openrouter_api_key = "sk-or-valid-key"
            mock_settings.openrouter_script_model = None
            mock_settings.openrouter_description_model = "google/gemini-flash-1.5"
            mock_settings.openrouter_assistant_model = None
            
            with patch('app.services.openrouter.OpenAI') as mock_openai_class:
                mock_client = MagicMock()
                mock_openai_class.return_value = mock_client
                
                mock_client.chat.completions.create = MagicMock(side_effect=Exception("API Error"))
                
                service = OpenRouterService()
                
                with pytest.raises(Exception) as exc_info:
                    await service.regenerate_description(
                        transcription="Transcrição",
                        platform="instagram",
                        instructions="Teste"
                    )
                
                assert "API Error" in str(exc_info.value)
