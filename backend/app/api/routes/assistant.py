"""
Router de AI Assistant - Assistente conversacional context-aware

Este módulo implementa endpoint para:
- Chat com assistente AI (function calling, context awareness)

Validates: Requirements 6.1-6.5, 7.1-7.5, 8.1-8.5, 9.1-9.6, 10.1-10.6, 11.1-11.6, 14.5
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_organization
from app.services.ai_assistant import (
    AIAssistantService,
    PageContext,
    Message as ServiceMessage
)
from app.models.assistant import (
    ChatRequest,
    ChatResponse,
    ToolCallModel,
    TokenUsage
)
from app.database import supabase
from app.utils.logger import get_logger
from app.utils.sanitize import sanitize_string, sanitize_html
import asyncio

router = APIRouter()
logger = get_logger("assistant")


async def _get_blog_id(org_id: str) -> int:
    """
    Obtém blog_id do Metricool para a organização
    
    Args:
        org_id: ID da organização
    
    Returns:
        blog_id do Metricool (pode ser None se não configurado)
    """
    def _sync():
        return supabase.table("organizations").select("metricool_blog_id").eq("id", org_id).single().execute()
    
    org_res = await asyncio.to_thread(_sync)
    org_data = org_res.data if hasattr(org_res, "data") else org_res.get("data")
    
    return org_data.get("metricool_blog_id") if org_data else None


@router.post("/api/assistant/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    org_id: str = Depends(get_current_organization)
) -> ChatResponse:
    """
    Processa mensagem do usuário e retorna resposta do assistente.
    
    O assistente é context-aware (adapta comportamento à página atual) e
    pode executar ações através de function calling (10 tools disponíveis).
    
    Request body:
    - message: Mensagem do usuário (1-5000 caracteres)
    - context: Contexto da página atual (page_name, page_path)
    - history: Histórico de conversação (últimas 50 mensagens)
    
    Response:
    - message: Resposta do assistente
    - tool_calls: Tools executadas (se houver)
    - requires_confirmation: Se ação requer confirmação do usuário
    - tokens_used: Uso de tokens da API Claude
    
    Tools disponíveis:
    1. generate_script - Gera script de vídeo
    2. regenerate_script - Regenera script com feedback
    3. schedule_post - Agenda post (requer confirmação)
    4. reschedule_post - Reagenda post (requer confirmação)
    5. cancel_post - Cancela post (requer confirmação)
    6. get_analytics - Consulta métricas de desempenho
    7. get_best_times - Consulta melhores horários
    8. generate_descriptions - Gera descrições para múltiplas plataformas
    9. search_web - Pesquisa informações na web
    10. navigate - Navega para página do sistema
    
    Args:
        request: ChatRequest com mensagem, contexto e histórico
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        ChatResponse com resposta do assistente
    
    Raises:
        HTTPException 400: Se request inválido
        HTTPException 500: Se erro ao processar mensagem
    
    Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5,
               8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6,
               10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6,
               14.5, 20.3
    """
    logger.info(
        "Processing chat message",
        extra={
            "organization_id": org_id,
            "page": request.context.page_name,
            "message_length": len(request.message),
            "history_length": len(request.history)
        }
    )
    
    try:
        # Sanitizar mensagem do usuário
        message = sanitize_string(request.message, max_length=5000)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mensagem não pode estar vazia"
            )
        
        # Sanitizar contexto da página
        page_name = sanitize_string(request.context.page_name, max_length=100)
        page_path = sanitize_string(request.context.page_path, max_length=500)
        
        # Sanitizar contexto adicional (se houver)
        additional_context = {}
        if request.context.additional_context:
            for key, value in request.context.additional_context.items():
                sanitized_key = sanitize_string(str(key), max_length=100)
                sanitized_value = sanitize_string(str(value), max_length=1000)
                additional_context[sanitized_key] = sanitized_value
        
        # Obter blog_id (pode ser None se Metricool não configurado)
        blog_id = await _get_blog_id(org_id)
        
        # Converter Pydantic models para dataclasses do service
        context = PageContext(
            page_name=page_name,
            page_path=page_path,
            additional_context=additional_context
        )
        
        # Sanitizar histórico
        history = []
        for msg in request.history:
            sanitized_content = sanitize_string(msg.content, max_length=5000)
            history.append(
                ServiceMessage(
                    role=msg.role,
                    content=sanitized_content,
                    timestamp=msg.timestamp
                )
            )
        
        # Processar mensagem via AI Assistant Service
        async with AIAssistantService() as assistant:
            response = await assistant.process_message(
                message=message,
                context=context,
                history=history,
                org_id=org_id,
                blog_id=blog_id
            )
        
        # Converter dataclasses para Pydantic models
        tool_calls = None
        if response.tool_calls:
            tool_calls = [
                ToolCallModel(
                    tool_name=tc.tool_name,
                    arguments=tc.arguments,
                    result=tc.result,
                    executed=tc.executed
                )
                for tc in response.tool_calls
            ]
        
        tokens_used = None
        if response.tokens_used:
            tokens_used = TokenUsage(
                input_tokens=response.tokens_used.input_tokens,
                output_tokens=response.tokens_used.output_tokens
            )
        
        logger.info(
            "Chat message processed successfully",
            extra={
                "organization_id": org_id,
                "tools_executed": len(tool_calls) if tool_calls else 0,
                "requires_confirmation": response.requires_confirmation,
                "tokens_used": tokens_used.input_tokens + tokens_used.output_tokens if tokens_used else 0
            }
        )
        
        return ChatResponse(
            message=response.message,
            tool_calls=tool_calls,
            requires_confirmation=response.requires_confirmation,
            tokens_used=tokens_used
        )
    
    except ValueError as e:
        logger.warning(
            f"Invalid request: {e}",
            extra={"organization_id": org_id}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(
            f"Error processing chat message: {e}",
            extra={"organization_id": org_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar mensagem. Tente novamente."
        )
