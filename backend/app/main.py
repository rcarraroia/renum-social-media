from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.utils.logger import setup_logger
from app.api.routes import health, integrations, modules, webhooks

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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])
app.include_router(modules.router, prefix="/modules", tags=["Modules"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting RENUM API in {settings.environment} mode")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down RENUM API")