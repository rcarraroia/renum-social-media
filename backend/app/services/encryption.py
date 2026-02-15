"""
Encryption service for sensitive data (API keys, tokens)
Uses Fernet symmetric encryption from cryptography library
"""
from cryptography.fernet import Fernet
from app.config import settings
from typing import Optional

class EncryptionService:
    def __init__(self):
        # Validate encryption key format
        try:
            self.cipher = Fernet(settings.encryption_key.encode() if isinstance(settings.encryption_key, str) else settings.encryption_key)
        except Exception as e:
            raise ValueError(f"Invalid ENCRYPTION_KEY format. Generate a new one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\". Error: {e}")
    
    def encrypt(self, value: str) -> str:
        """
        Encrypt a string value
        
        Args:
            value: Plain text string to encrypt
            
        Returns:
            Encrypted string (base64 encoded)
        """
        if not value:
            return value
        
        try:
            encrypted_bytes = self.cipher.encrypt(value.encode())
            return encrypted_bytes.decode()
        except Exception as e:
            raise ValueError(f"Encryption failed: {e}")
    
    def decrypt(self, encrypted_value: str) -> str:
        """
        Decrypt an encrypted string
        
        Args:
            encrypted_value: Encrypted string (base64 encoded)
            
        Returns:
            Decrypted plain text string
        """
        if not encrypted_value:
            return encrypted_value
        
        try:
            decrypted_bytes = self.cipher.decrypt(encrypted_value.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            raise ValueError(f"Decryption failed: {e}")
    
    def encrypt_optional(self, value: Optional[str]) -> Optional[str]:
        """Encrypt a value that might be None"""
        return self.encrypt(value) if value else None
    
    def decrypt_optional(self, encrypted_value: Optional[str]) -> Optional[str]:
        """Decrypt a value that might be None"""
        return self.decrypt(encrypted_value) if encrypted_value else None

# Singleton instance
encryption_service = EncryptionService()
