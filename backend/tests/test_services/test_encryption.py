"""
Testes unitários para app/services/encryption.py

Valida serviço de criptografia de dados sensíveis (API keys, tokens).
"""
import pytest
from unittest.mock import patch, MagicMock
from cryptography.fernet import Fernet
from app.services.encryption import EncryptionService, encryption_service


class TestEncryptionService:
    """Testes para EncryptionService"""
    
    def test_encryption_service_initialization(self):
        """Testa inicialização do serviço"""
        # Gerar chave válida
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            assert service.cipher is not None
    
    def test_encryption_service_invalid_key_raises_error(self):
        """Testa que chave inválida levanta erro"""
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = "invalid_key"
            
            with pytest.raises(ValueError) as exc_info:
                EncryptionService()
            
            assert "Invalid ENCRYPTION_KEY format" in str(exc_info.value)
    
    def test_encrypt_string(self):
        """Testa criptografia de string"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            plaintext = "my_secret_api_key"
            encrypted = service.encrypt(plaintext)
            
            # Verificar que foi criptografado (diferente do original)
            assert encrypted != plaintext
            # Verificar que é uma string
            assert isinstance(encrypted, str)
            # Verificar que não está vazio
            assert len(encrypted) > 0
    
    def test_decrypt_string(self):
        """Testa descriptografia de string"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            plaintext = "my_secret_api_key"
            encrypted = service.encrypt(plaintext)
            decrypted = service.decrypt(encrypted)
            
            # Verificar que descriptografou corretamente
            assert decrypted == plaintext
    
    def test_encrypt_decrypt_roundtrip(self):
        """Testa ciclo completo de criptografia/descriptografia"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            test_values = [
                "simple_key",
                "key_with_special_chars!@#$%",
                "very_long_key_" + "x" * 100,
                "unicode_key_你好_مرحبا",
            ]
            
            for value in test_values:
                encrypted = service.encrypt(value)
                decrypted = service.decrypt(encrypted)
                assert decrypted == value, f"Failed for value: {value}"
    
    def test_encrypt_empty_string_returns_empty(self):
        """Testa que string vazia retorna vazia"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            result = service.encrypt("")
            assert result == ""
    
    def test_decrypt_empty_string_returns_empty(self):
        """Testa que string vazia retorna vazia"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            result = service.decrypt("")
            assert result == ""
    
    def test_encrypt_optional_with_none(self):
        """Testa encrypt_optional com None"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            result = service.encrypt_optional(None)
            assert result is None
    
    def test_encrypt_optional_with_value(self):
        """Testa encrypt_optional com valor"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            result = service.encrypt_optional("test_key")
            assert result is not None
            assert result != "test_key"
    
    def test_decrypt_optional_with_none(self):
        """Testa decrypt_optional com None"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            result = service.decrypt_optional(None)
            assert result is None
    
    def test_decrypt_optional_with_value(self):
        """Testa decrypt_optional com valor"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            encrypted = service.encrypt("test_key")
            result = service.decrypt_optional(encrypted)
            assert result == "test_key"
    
    def test_decrypt_invalid_data_raises_error(self):
        """Testa que dados inválidos levantam erro"""
        valid_key = Fernet.generate_key().decode()
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = valid_key
            service = EncryptionService()
            
            with pytest.raises(ValueError) as exc_info:
                service.decrypt("invalid_encrypted_data")
            
            assert "Decryption failed" in str(exc_info.value)
    
    def test_encryption_service_singleton_exists(self):
        """Testa que singleton encryption_service existe"""
        assert encryption_service is not None
        assert isinstance(encryption_service, EncryptionService)
    
    def test_different_keys_produce_different_ciphertexts(self):
        """Testa que chaves diferentes produzem ciphertexts diferentes"""
        key1 = Fernet.generate_key().decode()
        key2 = Fernet.generate_key().decode()
        
        plaintext = "test_secret"
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = key1
            service1 = EncryptionService()
            encrypted1 = service1.encrypt(plaintext)
        
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = key2
            service2 = EncryptionService()
            encrypted2 = service2.encrypt(plaintext)
        
        # Ciphertexts devem ser diferentes
        assert encrypted1 != encrypted2
    
    def test_cannot_decrypt_with_wrong_key(self):
        """Testa que não consegue descriptografar com chave errada"""
        key1 = Fernet.generate_key().decode()
        key2 = Fernet.generate_key().decode()
        
        plaintext = "test_secret"
        
        # Criptografar com key1
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = key1
            service1 = EncryptionService()
            encrypted = service1.encrypt(plaintext)
        
        # Tentar descriptografar com key2
        with patch('app.services.encryption.settings') as mock_settings:
            mock_settings.encryption_key = key2
            service2 = EncryptionService()
            
            with pytest.raises(ValueError):
                service2.decrypt(encrypted)
