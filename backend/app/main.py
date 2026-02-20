from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.config import settings
from app.utils.logger import setup_logger, register_logging_middlewares
from app.api.error_handlers import register_error_handlers
from app.api.routes import (
    health, 
    integrations, 
    webhooks, 
    tasks,
    module2, 
    module3, 
    module1, 
    # leads,  # Comentado temporariamente - depende de database.py que não existe
    analytics,
    assistant
)

logger = setup_logger()

# Configurar rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.get_redis_url(),
    default_limits=["100/minute"],  # Limite padrão global
    headers_enabled=True,
    swallow_errors=True,  # Não quebrar se Redis estiver indisponível
)

app = FastAPI(
    title="RENUM Social AI API",
    description="Backend para automação de conteúdo em redes sociais",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Adicionar limiter ao state da aplicação
app.state.limiter = limiter

# Handler customizado para rate limit exceeded
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handler customizado para erro de rate limit"""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Você excedeu o limite de requisições. Tente novamente mais tarde.",
            "detail": f"Limite: {exc.detail}",
        },
        headers={
            "Retry-After": str(exc.retry_after) if hasattr(exc, 'retry_after') else "60"
        }
    )

# Configurar CORS com lista específica de origens
# NUNCA usar ["*"] em produção - vulnerabilidade de segurança
cors_origins = settings.get_cors_origins()

logger.info(f"Configurando CORS para ambiente: {settings.environment}")
logger.info(f"Origens permitidas: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Request-ID",
        "X-Organization-ID",
    ],
    expose_headers=["X-Request-ID"],
    max_age=3600,  # Cache preflight por 1 hora
)

# Adicionar middleware de rate limiting
app.add_middleware(SlowAPIMiddleware)

# Registrar middlewares de logging (request_id e logging estruturado)
# Validates: Requirements 10.3, 10.5
register_logging_middlewares(app)

# Registrar error handlers globais
# Validates: Requirements 12.1, 12.2, 12.3, 12.4
register_error_handlers(app)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(assistant.router, tags=["AI Assistant"])
# app.include_router(leads.router, prefix="/api", tags=["Leads"])  # Comentado temporariamente
app.include_router(module1.router, prefix="/api/modules/1", tags=["Module 1 - ScriptAI"])
app.include_router(module2.router, prefix="/api/modules/2", tags=["Module 2 - PostRápido"])
app.include_router(module3.router, prefix="/api/modules/3", tags=["Module 3 - AvatarAI"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Async Tasks"])

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting RENUM API in {settings.environment} mode")
    logger.info(f"Rate limiting configurado: {settings.get_redis_url()}")
    logger.info(f"Limite padrão: 100 requests/minuto")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down RENUM API")
