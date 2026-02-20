"""
Error Handlers Globais - Tratamento centralizado de erros

Este módulo implementa handlers para:
- Erros de validação Pydantic (422)
- Exceções genéricas não-tratadas (500)

Validates: Requirements 12.1, 12.2, 12.3, 12.4
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
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
    
    # Handler genérico para exceções não-tratadas
    app.add_exception_handler(Exception, generic_exception_handler)
    
    logger.info(
        "Error handlers registered successfully",
        extra={
            "service_module": "error_handlers",
            "handlers": [
                "validation_exception_handler",
                "generic_exception_handler"
            ]
        }
    )
