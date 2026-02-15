"""
Logger Estruturado - Configuração de logging com formato JSON

Este módulo implementa:
- Logger com formato JSON estruturado
- Middleware para adicionar request_id único
- Middleware para logar requisições com organization_id, module, endpoint, status_code

Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
"""

import logging
import sys
import json
import uuid
from datetime import datetime
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings


class JSONFormatter(logging.Formatter):
    """
    Formatter que converte logs para formato JSON estruturado.
    
    Validates: Requirement 10.4
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Formata log record como JSON estruturado.
        
        Args:
            record: Log record do Python logging
        
        Returns:
            String JSON com campos estruturados
        """
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Adicionar campos extras se presentes
        if hasattr(record, "organization_id"):
            log_data["organization_id"] = record.organization_id
        if hasattr(record, "module"):
            log_data["module"] = record.module
        if hasattr(record, "endpoint"):
            log_data["endpoint"] = record.endpoint
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        # Adicionar informações de exceção se presente
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info) if record.exc_info else None
            }
        
        # Adicionar campos extras do record.extra
        for key, value in record.__dict__.items():
            if key not in ["name", "msg", "args", "created", "filename", "funcName", 
                          "levelname", "levelno", "lineno", "module", "msecs", 
                          "message", "pathname", "process", "processName", "relativeCreated",
                          "thread", "threadName", "exc_info", "exc_text", "stack_info",
                          "organization_id", "endpoint", "status_code", "request_id"]:
                if not key.startswith("_"):
                    log_data[key] = value
        
        return json.dumps(log_data, ensure_ascii=False)


def setup_logger():
    """
    Configura logger global com formato JSON estruturado.
    
    Validates: Requirements 10.4
    """
    logger = logging.getLogger("renum")
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logger.setLevel(level)
    
    # Avoid duplicate handlers
    if not logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        
        # Usar JSONFormatter para logs estruturados
        formatter = JSONFormatter()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Retorna logger com nome específico.
    
    Args:
        name: Nome do módulo/componente
    
    Returns:
        Logger configurado
    """
    return logging.getLogger(f"renum.{name}")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware que adiciona request_id único a cada requisição.
    
    O request_id é gerado usando UUID4 e armazenado no state da requisição
    para ser usado em logs.
    
    Validates: Requirements 10.3, 10.5
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Adiciona request_id único à requisição.
        
        Args:
            request: Requisição FastAPI
            call_next: Próximo middleware/handler
        
        Returns:
            Response com header X-Request-ID
        """
        # Gerar request_id único
        request_id = str(uuid.uuid4())
        
        # Armazenar no state da requisição
        request.state.request_id = request_id
        
        # Processar requisição
        response = await call_next(request)
        
        # Adicionar request_id ao header da resposta
        response.headers["X-Request-ID"] = request_id
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que loga todas as requisições com informações estruturadas.
    
    Loga: organization_id, module, endpoint, status_code, request_id
    
    Validates: Requirements 10.1, 10.2, 10.3
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Loga requisição com informações estruturadas.
        
        Args:
            request: Requisição FastAPI
            call_next: Próximo middleware/handler
        
        Returns:
            Response processada
        """
        logger = get_logger("request")
        
        # Obter request_id do state (adicionado por RequestIDMiddleware)
        request_id = getattr(request.state, "request_id", None)
        
        # Extrair informações da requisição
        method = request.method
        path = request.url.path
        
        # Determinar módulo baseado no path
        module = "unknown"
        if "/api/dashboard" in path:
            module = "dashboard"
        elif "/api/calendar" in path:
            module = "calendar"
        elif "/api/integrations" in path:
            module = "integrations"
        elif "/api/scriptai" in path:
            module = "scriptai"
        elif "/api/postrapido" in path:
            module = "postrapido"
        elif "/api/avatarai" in path:
            module = "avatarai"
        
        try:
            # Processar requisição
            response = await call_next(request)
            
            # Obter organization_id do state se disponível
            organization_id = getattr(request.state, "organization_id", None)
            
            # Logar requisição bem-sucedida
            logger.info(
                f"{method} {path} - {response.status_code}",
                extra={
                    "organization_id": organization_id,
                    "service_module": module,
                    "endpoint": path,
                    "status_code": response.status_code,
                    "request_id": request_id,
                    "method": method
                }
            )
            
            return response
            
        except Exception as e:
            # Logar erro com stack trace
            logger.error(
                f"{method} {path} - Error: {str(e)}",
                extra={
                    "service_module": module,
                    "endpoint": path,
                    "status_code": 500,
                    "request_id": request_id,
                    "method": method
                },
                exc_info=True
            )
            raise


def register_logging_middlewares(app):
    """
    Registra middlewares de logging na aplicação FastAPI.
    
    Deve ser chamado no main.py após criar a instância do app.
    
    Args:
        app: Instância FastAPI
    
    Example:
        from app.utils.logger import register_logging_middlewares
        
        app = FastAPI()
        register_logging_middlewares(app)
    
    Validates: Requirements 10.3, 10.5
    """
    # Adicionar RequestIDMiddleware primeiro (para gerar request_id)
    app.add_middleware(RequestIDMiddleware)
    
    # Adicionar RequestLoggingMiddleware depois (para usar request_id)
    app.add_middleware(RequestLoggingMiddleware)
    
    logger = get_logger("logging")
    logger.info(
        "Logging middlewares registered successfully",
        extra={
            "service_module": "logging",
            "middlewares": ["RequestIDMiddleware", "RequestLoggingMiddleware"]
        }
    )
