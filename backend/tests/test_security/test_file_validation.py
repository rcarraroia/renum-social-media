"""
Testes de validação de upload de arquivos
"""
import pytest
import io
from fastapi import UploadFile
from app.core.file_validation import (
    validate_video_upload,
    FileValidationError,
    _validate_video_magic_bytes,
    get_file_extension,
    format_file_size
)


class TestFileValidation:
    """Testes de validação de arquivos"""
    
    @pytest.mark.asyncio
    async def test_valid_mp4_upload(self):
        """Testa que arquivo MP4 válido é aceito"""
        # Magic bytes de MP4
        content = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 1000
        
        file = UploadFile(
            filename="test.mp4",
            file=io.BytesIO(content)
        )
        
        result = await validate_video_upload(file, validate_mime_type=False)
        assert result == content
    
    @pytest.mark.asyncio
    async def test_file_too_large_rejected(self):
        """Testa que arquivo muito grande é rejeitado"""
        # 600MB de dados (excede limite de 500MB)
        content = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * (600 * 1024 * 1024)
        
        file = UploadFile(
            filename="large.mp4",
            file=io.BytesIO(content)
        )
        
        with pytest.raises(FileValidationError) as exc:
            await validate_video_upload(file, validate_mime_type=False)
        
        assert "muito grande" in str(exc.value.detail).lower()
    
    @pytest.mark.asyncio
    async def test_invalid_extension_rejected(self):
        """Testa que extensão inválida é rejeitada"""
        content = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 1000
        
        file = UploadFile(
            filename="test.exe",  # Extensão não permitida
            file=io.BytesIO(content)
        )
        
        with pytest.raises(FileValidationError) as exc:
            await validate_video_upload(file, validate_mime_type=False)
        
        assert "extensão" in str(exc.value.detail).lower()
    
    @pytest.mark.asyncio
    async def test_empty_file_rejected(self):
        """Testa que arquivo vazio é rejeitado"""
        file = UploadFile(
            filename="empty.mp4",
            file=io.BytesIO(b"")
        )
        
        with pytest.raises(FileValidationError) as exc:
            await validate_video_upload(file, validate_mime_type=False)
        
        assert "vazio" in str(exc.value.detail).lower()
    
    @pytest.mark.asyncio
    async def test_missing_filename_rejected(self):
        """Testa que arquivo sem nome é rejeitado"""
        content = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 1000
        
        file = UploadFile(
            filename="",
            file=io.BytesIO(content)
        )
        
        with pytest.raises(FileValidationError) as exc:
            await validate_video_upload(file, validate_mime_type=False)
        
        assert "nome" in str(exc.value.detail).lower()
    
    def test_mp4_magic_bytes_valid(self):
        """Testa que magic bytes de MP4 são reconhecidos"""
        content = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 100
        assert _validate_video_magic_bytes(content) is True
    
    def test_mov_magic_bytes_valid(self):
        """Testa que magic bytes de MOV são reconhecidos"""
        content = b"\x00\x00\x00\x14ftypqt  " + b"\x00" * 100
        assert _validate_video_magic_bytes(content) is True
    
    def test_avi_magic_bytes_valid(self):
        """Testa que magic bytes de AVI são reconhecidos"""
        content = b"RIFF\x00\x00\x00\x00AVI " + b"\x00" * 100
        assert _validate_video_magic_bytes(content) is True
    
    def test_mkv_magic_bytes_valid(self):
        """Testa que magic bytes de MKV são reconhecidos"""
        content = b"\x1a\x45\xdf\xa3" + b"\x00" * 100
        assert _validate_video_magic_bytes(content) is True
    
    def test_invalid_magic_bytes_rejected(self):
        """Testa que magic bytes inválidos são rejeitados"""
        content = b"INVALID_MAGIC_BYTES" + b"\x00" * 100
        assert _validate_video_magic_bytes(content) is False
    
    def test_too_short_content_rejected(self):
        """Testa que conteúdo muito curto é rejeitado"""
        content = b"SHORT"
        assert _validate_video_magic_bytes(content) is False
    
    @pytest.mark.asyncio
    async def test_custom_max_size(self):
        """Testa que tamanho máximo customizado funciona"""
        # 2MB de dados
        content = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * (2 * 1024 * 1024)
        
        file = UploadFile(
            filename="test.mp4",
            file=io.BytesIO(content)
        )
        
        # Deve falhar com limite de 1MB
        with pytest.raises(FileValidationError):
            await validate_video_upload(file, max_size_mb=1, validate_mime_type=False)
    
    @pytest.mark.asyncio
    async def test_custom_allowed_extensions(self):
        """Testa que extensões customizadas funcionam"""
        content = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 1000
        
        file = UploadFile(
            filename="test.mp4",
            file=io.BytesIO(content)
        )
        
        # Deve falhar se MP4 não estiver na lista
        with pytest.raises(FileValidationError):
            await validate_video_upload(
                file,
                allowed_extensions=[".mov", ".avi"],
                validate_mime_type=False
            )
    
    def test_get_file_extension(self):
        """Testa extração de extensão"""
        assert get_file_extension("video.mp4") == ".mp4"
        assert get_file_extension("video.MOV") == ".mov"
        assert get_file_extension("path/to/video.avi") == ".avi"
    
    def test_format_file_size(self):
        """Testa formatação de tamanho de arquivo"""
        assert format_file_size(500) == "500.0B"
        assert format_file_size(1024) == "1.0KB"
        assert format_file_size(1024 * 1024) == "1.0MB"
        assert format_file_size(1024 * 1024 * 1024) == "1.0GB"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
