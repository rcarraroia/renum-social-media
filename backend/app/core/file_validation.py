"""
Validação de arquivos de upload
"""
import magic
from fastapi import UploadFile, HTTPException
from typing import List, Optional


# Configurações de validação
MAX_FILE_SIZE_MB = 500  # 500MB máximo
ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
ALLOWED_VIDEO_MIMETYPES = [
    "video/mp4",
    "video/quicktime",  # .mov
    "video/x-msvideo",  # .avi
    "video/x-matroska",  # .mkv
    "video/webm",
]


class FileValidationError(HTTPException):
    """Erro de validação de arquivo"""
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)


async def validate_video_upload(
    file: UploadFile,
    max_size_mb: Optional[int] = None,
    allowed_extensions: Optional[List[str]] = None,
    allowed_mimetypes: Optional[List[str]] = None,
    validate_mime_type: bool = True
) -> bytes:
    """
    Valida arquivo de vídeo antes do upload
    
    Args:
        file: Arquivo enviado
        max_size_mb: Tamanho máximo em MB (default: 500MB)
        allowed_extensions: Extensões permitidas (default: mp4, mov, avi, mkv, webm)
        allowed_mimetypes: MIME types permitidos
        validate_mime_type: Se True, valida MIME type real do arquivo
    
    Returns:
        bytes: Conteúdo do arquivo validado
    
    Raises:
        FileValidationError: Se validação falhar
    """
    # Configurações padrão
    max_size = max_size_mb or MAX_FILE_SIZE_MB
    extensions = allowed_extensions or ALLOWED_VIDEO_EXTENSIONS
    mimetypes = allowed_mimetypes or ALLOWED_VIDEO_MIMETYPES
    
    # 1. Validar nome do arquivo
    if not file.filename:
        raise FileValidationError("Nome do arquivo é obrigatório")
    
    # 2. Validar extensão
    file_ext = "." + file.filename.split(".")[-1].lower()
    if file_ext not in extensions:
        raise FileValidationError(
            f"Extensão não permitida. Use: {', '.join(extensions)}"
        )
    
    # 3. Ler conteúdo do arquivo
    try:
        content = await file.read()
    except Exception as e:
        raise FileValidationError(f"Erro ao ler arquivo: {str(e)}")
    
    # 4. Validar tamanho
    file_size_mb = len(content) / (1024 * 1024)
    if file_size_mb > max_size:
        raise FileValidationError(
            f"Arquivo muito grande ({file_size_mb:.1f}MB). "
            f"Máximo permitido: {max_size}MB"
        )
    
    if file_size_mb == 0:
        raise FileValidationError("Arquivo está vazio")
    
    # 5. Validar MIME type real (não confiar no header)
    if validate_mime_type:
        try:
            # Usar python-magic para detectar tipo real
            mime = magic.Magic(mime=True)
            detected_mime = mime.from_buffer(content[:2048])  # Primeiros 2KB
            
            if detected_mime not in mimetypes:
                raise FileValidationError(
                    f"Tipo de arquivo não permitido. "
                    f"Detectado: {detected_mime}. "
                    f"Permitidos: {', '.join(mimetypes)}"
                )
        except Exception as e:
            # Se python-magic não estiver disponível, apenas avisar
            import logging
            logging.warning(f"MIME type validation skipped: {e}")
    
    # 6. Validar header do arquivo (magic bytes)
    if not _validate_video_magic_bytes(content):
        raise FileValidationError(
            "Arquivo não parece ser um vídeo válido (magic bytes inválidos)"
        )
    
    return content


def _validate_video_magic_bytes(content: bytes) -> bool:
    """
    Valida magic bytes do arquivo para garantir que é um vídeo
    
    Args:
        content: Conteúdo do arquivo
    
    Returns:
        bool: True se magic bytes são válidos
    """
    if len(content) < 12:
        return False
    
    # Magic bytes conhecidos para formatos de vídeo
    magic_bytes = {
        # MP4
        b"\x00\x00\x00\x18ftypmp42": "mp4",
        b"\x00\x00\x00\x1cftypmp42": "mp4",
        b"\x00\x00\x00\x20ftypmp42": "mp4",
        b"\x00\x00\x00\x18ftypisom": "mp4",
        b"\x00\x00\x00\x20ftypisom": "mp4",
        
        # MOV (QuickTime)
        b"\x00\x00\x00\x14ftypqt  ": "mov",
        b"\x00\x00\x00\x20ftypqt  ": "mov",
        
        # AVI
        b"RIFF": "avi",  # Primeiros 4 bytes
        
        # MKV (Matroska)
        b"\x1a\x45\xdf\xa3": "mkv",
        
        # WebM
        b"\x1a\x45\xdf\xa3": "webm",  # Mesmo que MKV
    }
    
    # Verificar primeiros bytes
    header = content[:28]
    
    for magic, format_name in magic_bytes.items():
        if header.startswith(magic):
            return True
    
    # Verificar AVI (RIFF...AVI)
    if header.startswith(b"RIFF") and b"AVI" in header[:12]:
        return True
    
    return False


def get_file_extension(filename: str) -> str:
    """Extrai extensão do arquivo"""
    return "." + filename.split(".")[-1].lower()


def format_file_size(size_bytes: int) -> str:
    """Formata tamanho do arquivo para exibição"""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f}TB"
