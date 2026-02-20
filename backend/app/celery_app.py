"""
Configuração do Celery para processamento assíncrono
"""
from celery import Celery
from app.config import settings

# Criar instância do Celery
celery_app = Celery(
    "renum",
    broker=settings.get_redis_url(),
    backend=settings.get_redis_url(),
    include=["app.tasks.video_tasks"]
)

# Configuração do Celery
celery_app.conf.update(
    # Serialização
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="America/Sao_Paulo",
    enable_utc=True,
    
    # Retry
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Resultados
    result_expires=3600,  # 1 hora
    result_backend_transport_options={
        "master_name": "mymaster",
        "visibility_timeout": 3600,
    },
    
    # Limites
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    
    # Rotas
    task_routes={
        "app.tasks.video_tasks.*": {"queue": "video"},
        "app.tasks.video_tasks.process_video": {"queue": "video"},
    },
    
    # Beat schedule (tarefas periódicas)
    beat_schedule={
        "cleanup-old-videos": {
            "task": "app.tasks.video_tasks.cleanup_old_videos",
            "schedule": 3600.0,  # A cada hora
        },
    },
)

# Auto-descobrir tasks
celery_app.autodiscover_tasks(["app.tasks"])
