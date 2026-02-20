"""
Testes unitários para app/utils/errors.py

Valida classes de exceção customizadas.
"""
import pytest
from app.utils.errors import IntegrationError


class TestIntegrationError:
    """Testes para IntegrationError"""
    
    def test_integration_error_can_be_raised(self):
        """Testa que IntegrationError pode ser levantada"""
        with pytest.raises(IntegrationError):
            raise IntegrationError("Test error")
    
    def test_integration_error_message(self):
        """Testa mensagem de erro"""
        error_message = "External API failed"
        with pytest.raises(IntegrationError) as exc_info:
            raise IntegrationError(error_message)
        
        assert str(exc_info.value) == error_message
    
    def test_integration_error_is_exception(self):
        """Testa que IntegrationError é uma Exception"""
        error = IntegrationError("Test")
        assert isinstance(error, Exception)
    
    def test_integration_error_can_be_caught_as_exception(self):
        """Testa que pode ser capturada como Exception"""
        try:
            raise IntegrationError("Test error")
        except Exception as e:
            assert isinstance(e, IntegrationError)
            assert str(e) == "Test error"
