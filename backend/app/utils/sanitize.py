"""
Utilidades de sanitização de inputs

Este módulo fornece funções para sanitizar inputs do usuário,
prevenindo injection attacks e garantindo segurança.

Validates: Requirement 20.3
"""

import re
from typing import Any, Optional


def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """
    Sanitiza string removendo caracteres perigosos
    
    Args:
        value: String a ser sanitizada
        max_length: Comprimento máximo (opcional)
        
    Returns:
        String sanitizada
    """
    if not isinstance(value, str):
        return ""
    
    # Remover caracteres de controle (exceto newline e tab)
    sanitized = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)
    
    # Limitar comprimento se especificado
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    # Remover espaços extras
    sanitized = sanitized.strip()
    
    return sanitized


def sanitize_sql_like(value: str) -> str:
    """
    Sanitiza string para uso em LIKE queries SQL
    
    Args:
        value: String a ser sanitizada
        
    Returns:
        String sanitizada para SQL LIKE
    """
    # Escapar caracteres especiais do SQL LIKE
    sanitized = value.replace('\\', '\\\\')
    sanitized = sanitized.replace('%', '\\%')
    sanitized = sanitized.replace('_', '\\_')
    sanitized = sanitized.replace('[', '\\[')
    
    return sanitized


def sanitize_filename(value: str) -> str:
    """
    Sanitiza string para uso como nome de arquivo
    
    Args:
        value: String a ser sanitizada
        
    Returns:
        String sanitizada para nome de arquivo
    """
    # Remover caracteres não permitidos em nomes de arquivo
    sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '', value)
    
    # Remover pontos no início/fim
    sanitized = sanitized.strip('.')
    
    # Limitar comprimento
    if len(sanitized) > 255:
        sanitized = sanitized[:255]
    
    return sanitized


def sanitize_html(value: str) -> str:
    """
    Sanitiza string removendo tags HTML
    
    Args:
        value: String a ser sanitizada
        
    Returns:
        String sem tags HTML
    """
    # Remover tags HTML
    sanitized = re.sub(r'<[^>]+>', '', value)
    
    # Escapar caracteres HTML especiais
    sanitized = sanitized.replace('&', '&amp;')
    sanitized = sanitized.replace('<', '&lt;')
    sanitized = sanitized.replace('>', '&gt;')
    sanitized = sanitized.replace('"', '&quot;')
    sanitized = sanitized.replace("'", '&#x27;')
    
    return sanitized


def sanitize_json_string(value: Any) -> str:
    """
    Sanitiza valor para uso em JSON
    
    Args:
        value: Valor a ser sanitizado
        
    Returns:
        String sanitizada
    """
    if not isinstance(value, str):
        value = str(value)
    
    # Remover caracteres de controle
    sanitized = re.sub(r'[\x00-\x1F\x7F]', '', value)
    
    return sanitized


def validate_date_format(value: str) -> bool:
    """
    Valida formato de data YYYY-MM-DD
    
    Args:
        value: String de data
        
    Returns:
        True se formato válido, False caso contrário
    """
    pattern = r'^\d{4}-\d{2}-\d{2}$'
    return bool(re.match(pattern, value))


def validate_datetime_format(value: str) -> bool:
    """
    Valida formato de datetime ISO 8601
    
    Args:
        value: String de datetime
        
    Returns:
        True se formato válido, False caso contrário
    """
    # Aceitar formatos: YYYY-MM-DDTHH:MM:SS, YYYY-MM-DDTHH:MM:SSZ, YYYY-MM-DDTHH:MM:SS+00:00
    pattern = r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$'
    return bool(re.match(pattern, value))


def sanitize_platform_name(value: str) -> str:
    """
    Sanitiza nome de plataforma social
    
    Args:
        value: Nome da plataforma
        
    Returns:
        Nome sanitizado (lowercase, apenas letras)
    """
    # Converter para lowercase
    sanitized = value.lower().strip()
    
    # Permitir apenas letras e números
    sanitized = re.sub(r'[^a-z0-9]', '', sanitized)
    
    return sanitized


def sanitize_enum_value(value: str, allowed_values: list) -> Optional[str]:
    """
    Valida que valor está em lista de valores permitidos
    
    Args:
        value: Valor a validar
        allowed_values: Lista de valores permitidos
        
    Returns:
        Valor se válido, None caso contrário
    """
    if value in allowed_values:
        return value
    return None
