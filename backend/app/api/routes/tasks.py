"""
Endpoints para gerenciamento de tasks assíncronas
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.celery_app import celery_app
from app.tasks.video_tasks import process_video, generate_avatar_video
from app.api.deps import get_current_user

router = APIRouter()


class TaskStatusResponse(BaseModel):
    """Resposta de status de task"""
    task_id: str
    status: str
    result: Optional[dict] = None
    progress: Optional[dict] = None
    error: Optional[str] = None


class ProcessVideoRequest(BaseModel):
    """Request para processar vídeo"""
    video_id: str
    organization_id: str


class GenerateAvatarRequest(BaseModel):
    """Request para gerar avatar"""
    video_id: str
    script: str
    avatar_id: str
    voice_id: str


@router.post("/process-video", response_model=dict)
async def start_video_processing(
    request: ProcessVideoRequest,
    user = Depends(get_current_user)
):
    """
    Inicia processamento assíncrono de vídeo
    
    Returns:
        dict: Task ID e status inicial
    """
    try:
        # Enfileirar task
        task = process_video.delay(
            request.video_id,
            request.organization_id
        )
        
        return {
            "task_id": task.id,
            "status": "queued",
            "message": "Vídeo enfileirado para processamento"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao enfileirar vídeo: {str(e)}"
        )


@router.post("/generate-avatar", response_model=dict)
async def start_avatar_generation(
    request: GenerateAvatarRequest,
    user = Depends(get_current_user)
):
    """
    Inicia geração assíncrona de avatar
    
    Returns:
        dict: Task ID e status inicial
    """
    try:
        # Enfileirar task
        task = generate_avatar_video.delay(
            request.video_id,
            request.script,
            request.avatar_id,
            request.voice_id
        )
        
        return {
            "task_id": task.id,
            "status": "queued",
            "message": "Avatar enfileirado para geração"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao enfileirar avatar: {str(e)}"
        )


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    user = Depends(get_current_user)
):
    """
    Consulta status de task assíncrona
    
    Args:
        task_id: ID da task
    
    Returns:
        TaskStatusResponse: Status atual da task
    """
    try:
        # Buscar task
        task = celery_app.AsyncResult(task_id)
        
        response = {
            "task_id": task_id,
            "status": task.state,
        }
        
        # Adicionar informações específicas por estado
        if task.state == "PENDING":
            response["result"] = None
            response["progress"] = None
            
        elif task.state == "PROGRESS":
            response["progress"] = task.info
            response["result"] = None
            
        elif task.state == "SUCCESS":
            response["result"] = task.result
            response["progress"] = {"current": 100, "total": 100, "status": "Concluído"}
            
        elif task.state == "FAILURE":
            response["error"] = str(task.info)
            response["result"] = None
            
        elif task.state == "RETRY":
            response["progress"] = {"status": "Retentando..."}
            response["result"] = None
        
        return TaskStatusResponse(**response)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar task: {str(e)}"
        )


@router.delete("/cancel/{task_id}")
async def cancel_task(
    task_id: str,
    user = Depends(get_current_user)
):
    """
    Cancela task assíncrona
    
    Args:
        task_id: ID da task
    
    Returns:
        dict: Confirmação de cancelamento
    """
    try:
        # Revogar task
        celery_app.control.revoke(task_id, terminate=True)
        
        return {
            "task_id": task_id,
            "status": "cancelled",
            "message": "Task cancelada com sucesso"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao cancelar task: {str(e)}"
        )


@router.get("/queue/stats")
async def get_queue_stats(user = Depends(get_current_user)):
    """
    Retorna estatísticas das filas
    
    Returns:
        dict: Estatísticas das filas
    """
    try:
        # Inspecionar workers ativos
        inspect = celery_app.control.inspect()
        
        active = inspect.active()
        scheduled = inspect.scheduled()
        reserved = inspect.reserved()
        
        return {
            "active_tasks": active or {},
            "scheduled_tasks": scheduled or {},
            "reserved_tasks": reserved or {},
            "workers": list(active.keys()) if active else []
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar estatísticas: {str(e)}"
        )
