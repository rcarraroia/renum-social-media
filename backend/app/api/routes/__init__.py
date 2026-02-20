"""
Routes package - Exporta todos os routers da API
"""

from app.api.routes import (
    health,
    integrations,
    webhooks,
    tasks,
    module1,
    module2,
    module3,
    leads,
    analytics,
    assistant
)

__all__ = [
    "health",
    "integrations",
    "webhooks",
    "tasks",
    "module1",
    "module2",
    "module3",
    "leads",
    "analytics",
    "assistant"
]
