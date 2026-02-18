from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.utils.logger import setup_logger, register_logging_middlewares
from app.api.error_handlers import register_error_handlers
from app.api.routes import (
    health, 
    integrations, 
    webhooks, 
    module2, 
    module3, 
    module1, 
    social_accounts,
    calendar,
    dashboard,
    leads,
    analytics,
    assistant
)

logger = setup_logger()

app = FastAPI(
    title="RENUM Social AI API",
    description="Backend para automação de conteúdo em redes sociais",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Parse CORS origins
origins = settings.allowed_origins if isinstance(settings.allowed_origins, list) else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Registrar middlewares de logging (request_id e logging estruturado)
# Validates: Requirements 10.3, 10.5
register_logging_middlewares(app)

# Registrar error handlers globais
# Validates: Requirements 12.1, 12.2, 12.3, 12.4
register_error_handlers(app)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])
app.include_router(social_accounts.router, tags=["Integrations"])
app.include_router(calendar.router, tags=["Calendar"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(assistant.router, tags=["AI Assistant"])
app.include_router(leads.router, prefix="/api", tags=["Leads"])
app.include_router(module1.router, prefix="/api/modules/1", tags=["Module 1 - ScriptAI"])
app.include_router(module2.router, prefix="/api/modules/2", tags=["Module 2 - PostRápido"])
app.include_router(module3.router, prefix="/api/modules/3", tags=["Module 3 - AvatarAI"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting RENUM API in {settings.environment} mode")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down RENUM API")
