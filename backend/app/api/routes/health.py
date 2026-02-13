from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/")
async def health_check():
    """
    Health check básico
    """
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "RENUM Social AI API",
        "version": "1.0.0"
    }

@router.get("/ready")
async def readiness_check():
    """
    Readiness check (verificar dependências)
    """
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }