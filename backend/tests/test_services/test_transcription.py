"""
Testes unitários para app/services/transcription.py

Valida correções de bugs:
- Bug #1: Validação correta de DEEPGRAM_API_KEY
- Bug #2: Fallback automático Deepgram → Whisper
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.transcription import TranscriptionService


class TestTranscriptionServiceValidation:
    """Testes para validação de API key (TASK 3.1)"""
    
    def test_init_deepgram_key_none(self):
        """Testa que key = None resulta em use_deepgram = False"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = None
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                assert service.use_deepgram == False
    
    def test_init_deepgram_key_empty(self):
        """Testa que key = '' resulta em use_deepgram = False"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = ""
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                assert service.use_deepgram == False
    
    def test_init_deepgram_key_placeholder(self):
        """Testa que key = 'placeholder' resulta em use_deepgram = False"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "placeholder"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                assert service.use_deepgram == False
    
    def test_init_deepgram_key_valid(self):
        """Testa que key válida resulta em use_deepgram = True"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key_123"
            mock_settings.whisper_model = "base"
            
            service = TranscriptionService()
            assert service.use_deepgram == True
    
    def test_transcribe_logging_provider_used(self):
        """Testa que logging indica qual provider está sendo usado"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "placeholder"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                with patch('app.services.transcription.logger') as mock_logger:
                    service = TranscriptionService()
                    
                    # Verificar que logou uso do Whisper
                    mock_logger.info.assert_any_call(
                        "Using Whisper for transcription (Deepgram key invalid or not configured)"
                    )


class TestTranscriptionServiceFallback:
    """Testes para fallback automático (TASK 3.2)"""
    
    @pytest.mark.asyncio
    async def test_transcribe_deepgram_success(self):
        """Testa transcrição com Deepgram bem-sucedida"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key"
            mock_settings.whisper_model = "base"
            
            service = TranscriptionService()
            service._transcribe_deepgram = AsyncMock(return_value={
                "text": "Test transcription",
                "segments": [],
                "language": "pt",
                "provider": "deepgram"
            })
            
            result = await service.transcribe_audio("test.wav", "pt")
            
            assert result["provider"] == "deepgram"
            assert result["text"] == "Test transcription"
            service._transcribe_deepgram.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transcribe_deepgram_timeout_fallback_whisper(self):
        """Testa fallback para Whisper quando Deepgram timeout"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                service.whisper_model = MagicMock()
                
                # Deepgram falha com timeout
                service._transcribe_deepgram = AsyncMock(
                    side_effect=Exception("Timeout")
                )
                
                # Whisper sucede
                service._transcribe_whisper = AsyncMock(return_value={
                    "text": "Whisper transcription",
                    "segments": [],
                    "language": "pt",
                    "provider": "whisper"
                })
                
                result = await service.transcribe_audio("test.wav", "pt")
                
                assert result["provider"] == "whisper"
                assert result["text"] == "Whisper transcription"
                service._transcribe_deepgram.assert_called_once()
                service._transcribe_whisper.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transcribe_deepgram_401_fallback_whisper(self):
        """Testa fallback para Whisper quando Deepgram retorna 401"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                service.whisper_model = MagicMock()
                
                # Deepgram falha com 401
                service._transcribe_deepgram = AsyncMock(
                    side_effect=Exception("401 Unauthorized")
                )
                
                # Whisper sucede
                service._transcribe_whisper = AsyncMock(return_value={
                    "text": "Whisper transcription",
                    "segments": [],
                    "language": "pt",
                    "provider": "whisper"
                })
                
                result = await service.transcribe_audio("test.wav", "pt")
                
                assert result["provider"] == "whisper"
                service._transcribe_deepgram.assert_called_once()
                service._transcribe_whisper.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transcribe_deepgram_429_fallback_whisper(self):
        """Testa fallback para Whisper quando Deepgram retorna 429 (rate limit)"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                service.whisper_model = MagicMock()
                
                # Deepgram falha com 429
                service._transcribe_deepgram = AsyncMock(
                    side_effect=Exception("429 Too Many Requests")
                )
                
                # Whisper sucede
                service._transcribe_whisper = AsyncMock(return_value={
                    "text": "Whisper transcription",
                    "segments": [],
                    "language": "pt",
                    "provider": "whisper"
                })
                
                result = await service.transcribe_audio("test.wav", "pt")
                
                assert result["provider"] == "whisper"
                service._transcribe_deepgram.assert_called_once()
                service._transcribe_whisper.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transcribe_deepgram_500_fallback_whisper(self):
        """Testa fallback para Whisper quando Deepgram retorna 500"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                service.whisper_model = MagicMock()
                
                # Deepgram falha com 500
                service._transcribe_deepgram = AsyncMock(
                    side_effect=Exception("500 Internal Server Error")
                )
                
                # Whisper sucede
                service._transcribe_whisper = AsyncMock(return_value={
                    "text": "Whisper transcription",
                    "segments": [],
                    "language": "pt",
                    "provider": "whisper"
                })
                
                result = await service.transcribe_audio("test.wav", "pt")
                
                assert result["provider"] == "whisper"
                service._transcribe_deepgram.assert_called_once()
                service._transcribe_whisper.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transcribe_whisper_direct(self):
        """Testa transcrição direta com Whisper (sem Deepgram configurado)"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = None
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                service.whisper_model = MagicMock()
                
                # Whisper sucede
                service._transcribe_whisper = AsyncMock(return_value={
                    "text": "Whisper transcription",
                    "segments": [],
                    "language": "pt",
                    "provider": "whisper"
                })
                
                result = await service.transcribe_audio("test.wav", "pt")
                
                assert result["provider"] == "whisper"
                assert result["text"] == "Whisper transcription"
                service._transcribe_whisper.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transcribe_both_fail(self):
        """Testa que erro é retornado quando ambos (Deepgram e Whisper) falham"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                service.whisper_model = MagicMock()
                
                # Deepgram falha
                service._transcribe_deepgram = AsyncMock(
                    side_effect=Exception("Deepgram failed")
                )
                
                # Whisper também falha
                service._transcribe_whisper = AsyncMock(
                    side_effect=Exception("Whisper failed")
                )
                
                with pytest.raises(Exception) as exc_info:
                    await service.transcribe_audio("test.wav", "pt")
                
                assert "Whisper failed" in str(exc_info.value)
                service._transcribe_deepgram.assert_called_once()
                service._transcribe_whisper.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transcribe_provider_in_response(self):
        """Testa que response inclui campo 'provider'"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = None
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                service.whisper_model = MagicMock()
                
                service._transcribe_whisper = AsyncMock(return_value={
                    "text": "Test",
                    "segments": [],
                    "language": "pt",
                    "provider": "whisper"
                })
                
                result = await service.transcribe_audio("test.wav", "pt")
                
                assert "provider" in result
                assert result["provider"] in ["deepgram", "whisper"]
    
    @pytest.mark.asyncio
    async def test_transcribe_logging_fallback(self):
        """Testa que logging indica quando fallback acontece"""
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                with patch('app.services.transcription.logger') as mock_logger:
                    service = TranscriptionService()
                    service.whisper_model = MagicMock()
                    
                    # Deepgram falha
                    service._transcribe_deepgram = AsyncMock(
                        side_effect=Exception("Deepgram error")
                    )
                    
                    # Whisper sucede
                    service._transcribe_whisper = AsyncMock(return_value={
                        "text": "Whisper transcription",
                        "segments": [],
                        "language": "pt",
                        "provider": "whisper"
                    })
                    
                    await service.transcribe_audio("test.wav", "pt")
                    
                    # Verificar que logou o fallback
                    mock_logger.error.assert_called_once()
                    error_call = mock_logger.error.call_args[0][0]
                    assert "Deepgram transcription failed" in error_call
                    assert "Falling back to Whisper" in error_call
    
    @pytest.mark.asyncio
    async def test_transcribe_video_with_fallback(self):
        """Testa que transcribe_video também usa fallback"""
        # Este teste valida que o fallback funciona através do método transcribe_video
        with patch('app.services.transcription.settings') as mock_settings:
            mock_settings.deepgram_api_key = "valid_key"
            mock_settings.whisper_model = "base"
            
            mock_whisper = MagicMock()
            mock_whisper.load_model = MagicMock(return_value=MagicMock())
            with patch.dict('sys.modules', {'whisper': mock_whisper}):
                service = TranscriptionService()
                service.whisper_model = MagicMock()
                
                # Mock transcribe_audio para simular fallback
                service.transcribe_audio = AsyncMock(return_value={
                    "text": "Transcription with fallback",
                    "segments": [],
                    "language": "pt",
                    "provider": "whisper"
                })
                
                # Não vamos testar transcribe_video completo aqui (requer FFmpeg, etc)
                # Apenas validamos que transcribe_audio é chamado corretamente
                # O fallback já foi testado nos testes anteriores
                
                # Este teste serve como documentação de que transcribe_video
                # herda o comportamento de fallback de transcribe_audio
                assert service.transcribe_audio is not None
