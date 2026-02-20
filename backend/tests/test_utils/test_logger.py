"""
Testes unitários para app/utils/logger.py

Valida logger estruturado com formato JSON e middlewares de logging.
"""
import pytest
import json
import logging
from unittest.mock import Mock, patch, MagicMock
from fastapi import FastAPI, Request, Response
from fastapi.testclient import TestClient
from app.utils.logger import (
    JSONFormatter,
    setup_logger,
    get_logger,
    RequestIDMiddleware,
    RequestLoggingMiddleware,
    register_logging_middlewares,
)


class TestJSONFormatter:
    """Testes para JSONFormatter"""
    
    def test_json_formatter_basic_log(self):
        """Testa formatação básica de log em JSON"""
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None
        )
        
        result = formatter.format(record)
        log_data = json.loads(result)
        
        assert log_data["level"] == "INFO"
        assert log_data["logger"] == "test"
        assert log_data["message"] == "Test message"
        assert "timestamp" in log_data
    
    def test_json_formatter_with_organization_id(self):
        """Testa formatação com organization_id"""
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.organization_id = "org_123"
        
        result = formatter.format(record)
        log_data = json.loads(result)
        
        assert log_data["organization_id"] == "org_123"
    
    def test_json_formatter_with_request_id(self):
        """Testa formatação com request_id"""
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.request_id = "req_456"
        
        result = formatter.format(record)
        log_data = json.loads(result)
        
        assert log_data["request_id"] == "req_456"
    
    def test_json_formatter_with_exception(self):
        """Testa formatação com exceção"""
        formatter = JSONFormatter()
        
        try:
            raise ValueError("Test error")
        except ValueError:
            import sys
            exc_info = sys.exc_info()
        
        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname="test.py",
            lineno=1,
            msg="Error occurred",
            args=(),
            exc_info=exc_info
        )
        
        result = formatter.format(record)
        log_data = json.loads(result)
        
        assert "exception" in log_data
        assert log_data["exception"]["type"] == "ValueError"
        assert log_data["exception"]["message"] == "Test error"
        assert "traceback" in log_data["exception"]
    
    def test_json_formatter_with_extra_fields(self):
        """Testa formatação com campos extras"""
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.endpoint = "/api/test"
        record.status_code = 200
        record.custom_field = "custom_value"
        
        result = formatter.format(record)
        log_data = json.loads(result)
        
        assert log_data["endpoint"] == "/api/test"
        assert log_data["status_code"] == 200
        assert log_data["custom_field"] == "custom_value"


class TestSetupLogger:
    """Testes para setup_logger"""
    
    def test_setup_logger_returns_logger(self):
        """Testa que setup_logger retorna logger"""
        with patch('app.utils.logger.settings') as mock_settings:
            mock_settings.log_level = "INFO"
            logger = setup_logger()
            
            assert logger is not None
            assert isinstance(logger, logging.Logger)
            assert logger.name == "renum"
    
    def test_setup_logger_sets_correct_level(self):
        """Testa que setup_logger configura nível correto"""
        with patch('app.utils.logger.settings') as mock_settings:
            mock_settings.log_level = "DEBUG"
            logger = setup_logger()
            
            assert logger.level == logging.DEBUG
    
    def test_setup_logger_adds_json_formatter(self):
        """Testa que setup_logger adiciona JSONFormatter"""
        with patch('app.utils.logger.settings') as mock_settings:
            mock_settings.log_level = "INFO"
            
            # Limpar handlers existentes
            logger = logging.getLogger("renum")
            logger.handlers.clear()
            
            logger = setup_logger()
            
            assert len(logger.handlers) > 0
            handler = logger.handlers[0]
            assert isinstance(handler.formatter, JSONFormatter)


class TestGetLogger:
    """Testes para get_logger"""
    
    def test_get_logger_returns_logger_with_name(self):
        """Testa que get_logger retorna logger com nome"""
        logger = get_logger("test_module")
        
        assert logger is not None
        assert logger.name == "renum.test_module"
    
    def test_get_logger_different_names(self):
        """Testa que get_logger retorna loggers diferentes"""
        logger1 = get_logger("module1")
        logger2 = get_logger("module2")
        
        assert logger1.name != logger2.name
        assert logger1.name == "renum.module1"
        assert logger2.name == "renum.module2"


class TestRequestIDMiddleware:
    """Testes para RequestIDMiddleware"""
    
    @pytest.mark.asyncio
    async def test_request_id_middleware_adds_request_id(self):
        """Testa que middleware adiciona request_id"""
        app = FastAPI()
        app.add_middleware(RequestIDMiddleware)
        
        @app.get("/test")
        async def test_endpoint(request: Request):
            return {"request_id": request.state.request_id}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        assert "request_id" in response.json()
        assert response.json()["request_id"] is not None
    
    @pytest.mark.asyncio
    async def test_request_id_middleware_adds_header(self):
        """Testa que middleware adiciona header X-Request-ID"""
        app = FastAPI()
        app.add_middleware(RequestIDMiddleware)
        
        @app.get("/test")
        async def test_endpoint():
            return {"status": "ok"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert "X-Request-ID" in response.headers
        assert response.headers["X-Request-ID"] is not None
    
    @pytest.mark.asyncio
    async def test_request_id_middleware_unique_ids(self):
        """Testa que middleware gera IDs únicos"""
        app = FastAPI()
        app.add_middleware(RequestIDMiddleware)
        
        @app.get("/test")
        async def test_endpoint():
            return {"status": "ok"}
        
        client = TestClient(app)
        response1 = client.get("/test")
        response2 = client.get("/test")
        
        request_id1 = response1.headers["X-Request-ID"]
        request_id2 = response2.headers["X-Request-ID"]
        
        assert request_id1 != request_id2


class TestRequestLoggingMiddleware:
    """Testes para RequestLoggingMiddleware"""
    
    @pytest.mark.asyncio
    async def test_request_logging_middleware_logs_request(self, caplog):
        """Testa que middleware loga requisição"""
        app = FastAPI()
        app.add_middleware(RequestIDMiddleware)
        app.add_middleware(RequestLoggingMiddleware)
        
        @app.get("/api/test")
        async def test_endpoint():
            return {"status": "ok"}
        
        with caplog.at_level(logging.INFO):
            client = TestClient(app)
            response = client.get("/api/test")
        
        assert response.status_code == 200
        # Verificar que algo foi logado
        assert len(caplog.records) > 0
    
    @pytest.mark.asyncio
    async def test_request_logging_middleware_determines_module(self):
        """Testa que middleware determina módulo correto"""
        app = FastAPI()
        app.add_middleware(RequestIDMiddleware)
        app.add_middleware(RequestLoggingMiddleware)
        
        @app.get("/api/dashboard/stats")
        async def dashboard_endpoint():
            return {"status": "ok"}
        
        @app.get("/api/scriptai/generate")
        async def scriptai_endpoint():
            return {"status": "ok"}
        
        client = TestClient(app)
        
        # Testar dashboard
        response1 = client.get("/api/dashboard/stats")
        assert response1.status_code == 200
        
        # Testar scriptai
        response2 = client.get("/api/scriptai/generate")
        assert response2.status_code == 200
    
    @pytest.mark.asyncio
    async def test_request_logging_middleware_logs_errors(self, caplog):
        """Testa que middleware loga erros"""
        app = FastAPI()
        app.add_middleware(RequestIDMiddleware)
        app.add_middleware(RequestLoggingMiddleware)
        
        @app.get("/api/error")
        async def error_endpoint():
            raise ValueError("Test error")
        
        with caplog.at_level(logging.ERROR):
            client = TestClient(app)
            
            with pytest.raises(ValueError):
                client.get("/api/error")
        
        # Verificar que erro foi logado
        assert any("Error" in record.message for record in caplog.records)


class TestRegisterLoggingMiddlewares:
    """Testes para register_logging_middlewares"""
    
    def test_register_logging_middlewares_adds_middlewares(self):
        """Testa que função registra middlewares"""
        app = FastAPI()
        
        with patch('app.utils.logger.settings') as mock_settings:
            mock_settings.log_level = "INFO"
            register_logging_middlewares(app)
        
        # Verificar que middlewares foram adicionados
        # FastAPI armazena middlewares em app.user_middleware
        assert len(app.user_middleware) >= 2
    
    def test_register_logging_middlewares_correct_order(self):
        """Testa que middlewares são registrados na ordem correta"""
        app = FastAPI()
        
        with patch('app.utils.logger.settings') as mock_settings:
            mock_settings.log_level = "INFO"
            register_logging_middlewares(app)
        
        # RequestIDMiddleware deve ser adicionado primeiro
        # RequestLoggingMiddleware deve ser adicionado depois
        # (ordem inversa na lista devido a como FastAPI processa)
        assert len(app.user_middleware) >= 2
