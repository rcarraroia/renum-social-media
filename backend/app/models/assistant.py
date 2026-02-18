"""
Modelos Pydantic para AI Assistant API.

Este módulo define os schemas de dados para:
- Chat request/response (ChatRequest, ChatResponse)
- Page context (PageContextModel)
- Message history (MessageModel)
- Tool calls (ToolCallModel, TokenUsage)

Validates: Requirements 6.1-6.5, 7.1-7.5, 14.6
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ===== PAGE CONTEXT MODEL =====

class PageContextModel(BaseModel):
    """
    Contexto da página atual do usuário.
    
    Validates: Requirement 6.2
    """
    page_name: str = Field(
        ...,
        description="Nome da página atual"
    )
    page_path: str = Field(
        ...,
        description="Path da página (ex: /analytics)"
    )
    additional_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Contexto adicional específico da página"
    )


# ===== MESSAGE HISTORY MODEL =====

class MessageModel(BaseModel):
    """
    Mensagem no histórico de conversação.
    
    Validates: Requirement 7.2
    """
    role: str = Field(
        ...,
        description="Papel da mensagem: 'user' ou 'assistant'"
    )
    content: str = Field(
        ...,
        description="Conteúdo da mensagem"
    )
    timestamp: datetime = Field(
        ...,
        description="Timestamp da mensagem"
    )


# ===== CHAT REQUEST MODEL =====

class ChatRequest(BaseModel):
    """
    Request para enviar mensagem ao assistente.
    
    Validates: Requirements 6.1, 6.2, 7.2
    """
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Mensagem do usuário"
    )
    context: PageContextModel = Field(
        ...,
        description="Contexto da página atual"
    )
    history: List[MessageModel] = Field(
        default_factory=list,
        max_length=50,
        description="Histórico de conversação (últimas 50 mensagens)"
    )


# ===== TOOL CALL MODEL =====

class TokenUsage(BaseModel):
    """
    Uso de tokens da API Claude.
    
    Validates: Requirement 13.5
    """
    input_tokens: int = Field(
        ...,
        ge=0,
        description="Tokens de input consumidos"
    )
    output_tokens: int = Field(
        ...,
        ge=0,
        description="Tokens de output gerados"
    )


class ToolCallModel(BaseModel):
    """
    Tool executada ou sugerida pelo assistente.
    
    Validates: Requirements 8.1, 8.3, 8.5
    """
    tool_name: str = Field(
        ...,
        description="Nome da tool executada"
    )
    arguments: Dict[str, Any] = Field(
        ...,
        description="Argumentos passados para a tool"
    )
    result: Optional[Any] = Field(
        None,
        description="Resultado da execução da tool"
    )
    executed: bool = Field(
        False,
        description="True se tool foi executada, False se apenas sugerida"
    )


# ===== CHAT RESPONSE MODEL =====

class ChatResponse(BaseModel):
    """
    Resposta do assistente.
    
    Validates: Requirements 6.4, 6.5, 8.3, 9.6
    """
    message: str = Field(
        ...,
        description="Mensagem de resposta do assistente"
    )
    tool_calls: Optional[List[ToolCallModel]] = Field(
        None,
        description="Tools executadas (se houver)"
    )
    requires_confirmation: bool = Field(
        False,
        description="True se ação requer confirmação do usuário"
    )
    tokens_used: Optional[TokenUsage] = Field(
        None,
        description="Uso de tokens da API Claude"
    )
