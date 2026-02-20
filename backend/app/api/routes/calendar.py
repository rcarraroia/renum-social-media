"""
Router de Calendar - Gerenciamento de posts agendados

Este módulo implementa endpoints para:
- Listar posts agendados
- Obter detalhes de post específico
- Reagendar posts
- Cancelar posts
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.api.deps import get_current_organization
from app.database import supabase
from app.utils.logger import get_logger
from app.utils.sanitize import sanitize_string
import asyncio

router = APIRouter()
logger = get_logger("calendar")


# ============================================================================
# MODELS
# ============================================================================

class RescheduleRequest(BaseModel):
    new_scheduled_date: str
    platforms: Optional[list[str]] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/posts")
async def list_calendar_posts(
    start_date: Optional[str] = Query(None, description="Data inicial (ISO format)"),
    end_date: Optional[str] = Query(None, description="Data final (ISO format)"),
    platform: Optional[str] = Query(None, description="Filtro de plataforma"),
    status: Optional[str] = Query(None, description="Filtro de status"),
    org_id: str = Depends(get_current_organization)
):
    """
    Lista todos os posts agendados do usuário.
    
    Consulta posts da tabela scheduled_posts e complementa com dados do Metricool.
    
    Args:
        start_date: Data inicial (opcional)
        end_date: Data final (opcional)
        platform: Filtro de plataforma (opcional)
        status: Filtro de status (opcional)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "posts": [...],
            "total": 10
        }
    """
    logger.info(
        "Listing calendar posts",
        extra={
            "organization_id": org_id,
            "start_date": start_date,
            "end_date": end_date,
            "platform": platform
        }
    )
    
    try:
        # Construir query base
        query = supabase.table("posts").select(
            "id, content, platform, scheduled_at, status, thumbnail_url, metricool_post_id, created_at, cancelled_at"
        ).eq("organization_id", org_id)
        
        # Aplicar filtros
        if start_date:
            query = query.gte("scheduled_at", start_date)
        
        if end_date:
            query = query.lte("scheduled_at", end_date)
        
        if platform:
            platform_sanitized = sanitize_string(platform, max_length=50)
            query = query.eq("platform", platform_sanitized)
        
        if status:
            status_sanitized = sanitize_string(status, max_length=20)
            query = query.eq("status", status_sanitized)
        else:
            # Por padrão, mostrar apenas scheduled e published
            query = query.in_("status", ["scheduled", "published"])
        
        # Ordenar por data de agendamento
        query = query.order("scheduled_at", desc=False)
        
        # Executar query
        def _sync_query():
            return query.execute()
        
        result = await asyncio.to_thread(_sync_query)
        posts = result.data if hasattr(result, "data") else result.get("data", [])
        
        return {
            "posts": posts,
            "total": len(posts)
        }
    
    except Exception as e:
        logger.error(
            f"Error listing calendar posts: {e}",
            extra={"organization_id": org_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao listar posts agendados"
        )


@router.get("/posts/{post_id}")
async def get_calendar_post(
    post_id: str,
    org_id: str = Depends(get_current_organization)
):
    """
    Retorna detalhes de um post agendado específico.
    
    Args:
        post_id: ID do post
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        Post details
    
    Raises:
        HTTPException 404: Se post não encontrado
    """
    logger.info(
        "Getting calendar post",
        extra={
            "organization_id": org_id,
            "post_id": post_id
        }
    )
    
    try:
        # Buscar post
        def _sync_select():
            return supabase.table("posts").select(
                "id, content, platform, scheduled_at, status, thumbnail_url, metricool_post_id, created_at, cancelled_at"
            ).eq("id", post_id).eq("organization_id", org_id).single().execute()
        
        result = await asyncio.to_thread(_sync_select)
        post = result.data if hasattr(result, "data") else result.get("data")
        
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post não encontrado"
            )
        
        return post
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error getting calendar post: {e}",
            extra={"organization_id": org_id, "post_id": post_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar post"
        )


@router.put("/posts/{post_id}/reschedule")
async def reschedule_calendar_post(
    post_id: str,
    request: RescheduleRequest,
    org_id: str = Depends(get_current_organization)
):
    """
    Reagenda um post.
    
    Atualiza via Metricool MCP e sincroniza na tabela posts.
    
    Args:
        post_id: ID do post
        request: Nova data de agendamento
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        Post atualizado
    
    Raises:
        HTTPException 404: Se post não encontrado
        HTTPException 400: Se data inválida
    """
    logger.info(
        "Rescheduling calendar post",
        extra={
            "organization_id": org_id,
            "post_id": post_id,
            "new_date": request.new_scheduled_date
        }
    )
    
    try:
        # Validar data
        try:
            new_date = datetime.fromisoformat(request.new_scheduled_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de data inválido. Use ISO format"
            )
        
        # Verificar se post existe
        def _sync_select():
            return supabase.table("posts").select(
                "id, metricool_post_id, status"
            ).eq("id", post_id).eq("organization_id", org_id).single().execute()
        
        result = await asyncio.to_thread(_sync_select)
        post = result.data if hasattr(result, "data") else result.get("data")
        
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post não encontrado"
            )
        
        if post.get("status") != "scheduled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas posts agendados podem ser reagendados"
            )
        
        # TODO: Implementar chamada ao Metricool MCP para reagendar
        # Por enquanto, apenas atualizar no banco local
        
        # Atualizar post
        def _sync_update():
            return supabase.table("posts").update({
                "scheduled_at": request.new_scheduled_date,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", post_id).eq("organization_id", org_id).execute()
        
        update_result = await asyncio.to_thread(_sync_update)
        updated_post = update_result.data[0] if update_result.data else None
        
        if not updated_post:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao reagendar post"
            )
        
        logger.info(f"Post {post_id} reagendado com sucesso")
        
        return updated_post
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error rescheduling post: {e}",
            extra={"organization_id": org_id, "post_id": post_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao reagendar post"
        )


@router.put("/posts/{post_id}/cancel")
async def cancel_calendar_post(
    post_id: str,
    org_id: str = Depends(get_current_organization)
):
    """
    Cancela um post agendado.
    
    Remove via Metricool MCP e atualiza status na tabela posts para cancelled.
    
    Args:
        post_id: ID do post
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "success": true,
            "message": "Post cancelado com sucesso"
        }
    
    Raises:
        HTTPException 404: Se post não encontrado
        HTTPException 400: Se post já foi publicado
    """
    logger.info(
        "Cancelling calendar post",
        extra={
            "organization_id": org_id,
            "post_id": post_id
        }
    )
    
    try:
        # Verificar se post existe
        def _sync_select():
            return supabase.table("posts").select(
                "id, metricool_post_id, status"
            ).eq("id", post_id).eq("organization_id", org_id).single().execute()
        
        result = await asyncio.to_thread(_sync_select)
        post = result.data if hasattr(result, "data") else result.get("data")
        
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post não encontrado"
            )
        
        if post.get("status") == "published":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post já foi publicado e não pode ser cancelado"
            )
        
        if post.get("status") == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post já está cancelado"
            )
        
        # TODO: Implementar chamada ao Metricool MCP para cancelar
        # Por enquanto, apenas atualizar no banco local
        
        # Atualizar status para cancelled
        def _sync_update():
            return supabase.table("posts").update({
                "status": "cancelled",
                "cancelled_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", post_id).eq("organization_id", org_id).execute()
        
        await asyncio.to_thread(_sync_update)
        
        logger.info(f"Post {post_id} cancelado com sucesso")
        
        return {
            "success": True,
            "message": "Post cancelado com sucesso"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error cancelling post: {e}",
            extra={"organization_id": org_id, "post_id": post_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao cancelar post"
        )
