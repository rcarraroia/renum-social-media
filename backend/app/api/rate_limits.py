"""
Configurações de rate limiting para diferentes endpoints.
Define limites específicos para operações críticas.
"""
from functools import wraps
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

# Limites por tipo de operação
RATE_LIMITS = {
    # Autenticação - muito restritivo para prevenir brute force
    "auth_login": "5/minute",
    "auth_register": "3/hour",
    "auth_password_reset": "3/hour",
    
    # Geração de conteúdo - moderado para prevenir abuso
    "ai_generate_script": "20/hour",
    "ai_generate_post": "30/hour",
    "ai_generate_video": "10/hour",
    
    # Upload - restritivo para prevenir spam
    "video_upload": "10/hour",
    "image_upload": "20/hour",
    
    # Leitura - mais permissivo
    "read_data": "200/minute",
    "read_analytics": "100/minute",
    
    # Escrita - moderado
    "write_data": "50/minute",
    "delete_data": "20/minute",
    
    # Webhooks - permissivo (validado por HMAC)
    "webhook": "1000/hour",
}


def get_rate_limit(operation: str) -> str:
    """
    Retorna o limite de rate para uma operação específica.
    
    Args:
        operation: Nome da operação (ex: "auth_login", "ai_generate_script")
        
    Returns:
        str: Limite no formato "N/period" (ex: "5/minute")
    """
    return RATE_LIMITS.get(operation, "100/minute")


def apply_rate_limit(limiter: Limiter, operation: str):
    """
    Decorator para aplicar rate limiting em endpoints.
    
    Uso:
        from app.main import limiter
        from app.api.rate_limits import apply_rate_limit
        
        @router.post("/login")
        @apply_rate_limit(limiter, "auth_login")
        async def login(request: Request, ...):
            ...
    
    Args:
        limiter: Instância do Limiter
        operation: Nome da operação
    """
    limit = get_rate_limit(operation)
    return limiter.limit(limit)


# Exemplos de uso em rotas:
"""
# backend/app/api/routes/auth.py
from fastapi import APIRouter, Request
from app.main import limiter
from app.api.rate_limits import apply_rate_limit

router = APIRouter()

@router.post("/login")
@apply_rate_limit(limiter, "auth_login")  # 5 requests/minuto
async def login(request: Request, credentials: LoginCredentials):
    # Lógica de login
    pass

@router.post("/register")
@apply_rate_limit(limiter, "auth_register")  # 3 requests/hora
async def register(request: Request, user_data: UserCreate):
    # Lógica de registro
    pass


# backend/app/api/routes/module1.py
from fastapi import APIRouter, Request
from app.main import limiter
from app.api.rate_limits import apply_rate_limit

router = APIRouter()

@router.post("/generate-script")
@apply_rate_limit(limiter, "ai_generate_script")  # 20 requests/hora
async def generate_script(request: Request, prompt: ScriptPrompt):
    # Lógica de geração de roteiro
    pass


# backend/app/api/routes/module2.py
@router.post("/upload-video")
@apply_rate_limit(limiter, "video_upload")  # 10 requests/hora
async def upload_video(request: Request, file: UploadFile):
    # Lógica de upload
    pass
"""
