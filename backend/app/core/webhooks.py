"""
Webhook signature validation utilities
"""
import hmac
import hashlib
from typing import Optional
from fastapi import HTTPException, Header


def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str,
    algorithm: str = "sha256"
) -> bool:
    """
    Verifica assinatura HMAC de webhook
    
    Args:
        payload: Corpo da requisição em bytes
        signature: Assinatura recebida no header
        secret: Secret key configurada
        algorithm: Algoritmo de hash (default: sha256)
    
    Returns:
        True se assinatura é válida, False caso contrário
    """
    if not signature or not secret:
        return False
    
    # Calcular assinatura esperada
    expected_signature = hmac.new(
        secret.encode(),
        payload,
        getattr(hashlib, algorithm)
    ).hexdigest()
    
    # Comparação segura contra timing attacks
    return hmac.compare_digest(signature, expected_signature)


def require_webhook_signature(
    signature: Optional[str],
    payload: bytes,
    secret: str,
    header_name: str = "X-Webhook-Signature"
) -> None:
    """
    Valida assinatura de webhook ou levanta HTTPException
    
    Args:
        signature: Assinatura recebida no header
        payload: Corpo da requisição em bytes
        secret: Secret key configurada
        header_name: Nome do header de assinatura
    
    Raises:
        HTTPException: 401 se assinatura ausente ou inválida
    """
    if not signature:
        raise HTTPException(
            status_code=401,
            detail=f"Missing {header_name} header"
        )
    
    if not verify_webhook_signature(payload, signature, secret):
        raise HTTPException(
            status_code=401,
            detail="Invalid webhook signature"
        )
