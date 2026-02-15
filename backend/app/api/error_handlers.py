"""
Error Handlers Globais - Tratamento centralizado de erros

Este módulo implementa handlers para:
- Erros de validação Pydantic (422)
- Erros da API do Metricool (502)
- Rate limit do Metricool (429)
- Exceções genéricas não-tratadas (500)

Validates: Requirements 12.1, 12.2, 12.3, 12.4
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.services.metricool import (
    MetricoolAPIError,
    MetricoolAuthError,
    MetricoolRateLimitError,
    MetricoolNotFoundError
)
from app.utils.logger import get_logger

logger = get_logger("error_handlers")


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handler para erros de validação Pydantic (422).
    
    Retorna lista detalhada de campos inválidos com mensagens descritivas.
    
    Args:
        request: Requisição FastAPI
        exc: Exceção de validação
    
    Returns:
        JSONResponse com status 422 e detalhes dos erros
    
    Validates: Requirement 12.2
    """
    logger.warning(
        "Validation error",
        extra={
            "path": request.url.path,
            "method": request.method,
            "errors": exc.errors(),
            "service_module": "error_handlers",
            "endpoint": "validation_exception_handler"
        }
    )
    
    # Formatar erros de forma mais amigável
    formatted_errors = []
    for error in exc.errors():
        loc = " -> ".join(str(x) for x in error["loc"])
        formatted_errors.append({
            "loc": error["loc"],
            "msg": error["msg"],
            "type": error["type"],
            "field": loc
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": formatted_errors,
            "message": "Dados inválidos. Verifique os campos e tente novamente."
        }
    )


async def metricool_error_handler(request: Request, exc: MetricoolAPIError) -> JSONResponse:
    """
    Handler para erros da API do Metricool (502).
    
    Traduz erros técnicos do Metricool para mensagens amigáveis em português.
    
    Args:
        request: Requisição FastAPI
        exc: Exceção da API do Metricool
    
    Returns:
        JSONResponse com status 502 e mensagem amigável
    
    Validates: Requirement 12.1
    """
    logger.error(
        f"Metricool API error: {exc.message}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "status_code": exc.status_code,
            "response_data": exc.response_data,
            "service_module": "error_handlers",
            "endpoint": "metricool_error_handler"
        },
        exc_info=True
    )
    
    # Traduzir mensagens técnicas para português amigável
    friendly_message = "Serviço de agendamento temporariamente indisponível. Tente novamente em alguns minutos."
    
    # Mensagens específicas baseadas no erro
    if isinstance(exc, MetricoolAuthError):
        friendly_message = "Erro de autenticação com serviço de redes sociais. Verifique suas credenciais em Settings."
    elif isinstance(exc, MetricoolNotFoundError):
        friendly_message = "Recurso não encontrado no serviço de agendamento."
    elif "timeout" in str(exc.message).lower():
        friendly_message = "Tempo limite excedido ao comunicar com serviço de agendamento. Tente novamente."
    elif "connection" in str(exc.message).lower():
        friendly_message = "Erro de conexão com serviço de agendamento. Verifique sua internet."
    
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={
            "detail": friendly_message,
            "error_type": "metricool_api_error"
        }
    )


async def metricool_rate_limit_handler(request: Request, exc: MetricoolRateLimitError) -> JSONResponse:
    """
    Handler para rate limit do Metricool (429).
    
    Retorna tempo de espera em segundos no header Retry-After.
    
    Args:
        request: Requisição FastAPI
        exc: Exceção de rate limit
    
    Returns:
        JSONResponse com status 429 e header Retry-After
    
    Validates: Requirement 12.4
    """
    logger.warning(
        f"Metricool rate limit exceeded: retry after {exc.retry_after}s",
        extra={
            "path": request.url.path,
            "method": request.method,
            "retry_after": exc.retry_after,
            "service_module": "error_handlers",
            "endpoint": "metricool_rate_limit_handler"
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": f"Limite de requisições atingido. Tente novamente em {exc.retry_after} segundos.",
            "retry_after": exc.retry_after
        },
        headers={
            "Retry-After": str(exc.retry_after)
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handler para exceções genéricas não-tratadas (500).
    
    Registra stack trace completo e retorna mensagem genérica ao usuário.
    
    Args:
        request: Requisição FastAPI
        exc: Exceção não-tratada
    
    Returns:
        JSONResponse com status 500 e mensagem genérica
    
    Validates: Requirement 12.3
    """
    logger.exception(
        f"Unhandled exception: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "exception_type": type(exc).__name__,
            "service_module": "error_handlers",
            "endpoint": "generic_exception_handler"
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Erro interno do servidor. Nossa equipe foi notificada e está trabalhando na solução.",
            "error_type": "internal_server_error"
        }
    )


async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handler para recursos não encontrados (404).
    
    Args:
        request: Requisição FastAPI
        exc: Exceção
    
    Returns:
        JSONResponse com status 404 e mensagem descritiva
    
    Validates: Requirement 12.3
    """
    logger.warning(
        "Resource not found",
        extra={
            "path": request.url.path,
            "method": request.method,
            "service_module": "error_handlers",
            "endpoint": "not_found_handler"
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "detail": f"Recurso não encontrado: {request.url.path}",
            "error_type": "not_found"
        }
    )


def register_error_handlers(app):
    """
    Registra todos os error handlers na aplicação FastAPI.
    
    Deve ser chamado no main.py após criar a instância do app.
    
    Args:
        app: Instância FastAPI
    
    Example:
        from app.api.error_handlers import register_error_handlers
        
        app = FastAPI()
        register_error_handlers(app)
    """
    # Handler para erros de validação Pydantic
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # Handlers para erros do Metricool
    app.add_exception_handler(MetricoolAPIError, metricool_error_handler)
    app.add_exception_handler(MetricoolAuthError, metricool_error_handler)
    app.add_exception_handler(MetricoolNotFoundError, metricool_error_handler)
    app.add_exception_handler(MetricoolRateLimitError, metricool_rate_limit_handler)
    
    # Handler genérico para exceções não-tratadas
    app.add_exception_handler(Exception, generic_exception_handler)
    
    logger.info(
        "Error handlers registered successfully",
        extra={
            "service_module": "error_handlers",
            "handlers": [
                "validation_exception_handler",
                "metricool_error_handler",
                "metricool_rate_limit_handler",
                "generic_exception_handler"
            ]
        }
    )
