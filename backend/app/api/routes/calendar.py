"""
Router de Calendar - Gerenciamento de posts agendados

Este módulo implementa endpoints para:
- Listar posts agendados com filtros (data, plataforma, status)
- Obter detalhes completos de um post específico
- Reagendar post para nova data/hora
- Cancelar post agendado

Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime
from app.api.deps import get_current_organization
from app.services.metricool import (
    MetricoolService,
    MetricoolAPIError,
    MetricoolAuthError,
    MetricoolNotFoundError
)
from app.models.social_accounts import (
    CalendarQuery,
    CalendarPost,
    CalendarResponse,
    RescheduleRequest,
    SocialPlatform
)
from app.database import supabase
from app.utils.logger import get_logger
import asyncio

router = APIRouter()
logger = get_logger("calendar")


async def _get_blog_id(org_id: str) -> int:
    """
    Obtém blog_id do Metricool para a organização
    
    Args:
        org_id: ID da organização
    
    Returns:
        blog_id do Metricool
    
    Raises:
        HTTPException 404: Se blog_id não estiver configurado
    """
    def _sync():
        return supabase.table("organizations").select("metricool_blog_id").eq("id", org_id).single().execute()
    
    org_res = await asyncio.to_thread(_sync)
    org_data = org_res.data if hasattr(org_res, "data") else org_res.get("data")
    
    blog_id = org_data.get("metricool_blog_id") if org_data else None
    
    if not blog_id:
        logger.error(
            "Blog ID not configured for organization",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "_get_blog_id"
            }
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metricool não configurado. Configure suas credenciais em Settings."
        )
    
    return blog_id


@router.get("/api/calendar/posts", response_model=CalendarResponse)
async def list_calendar_posts(
    start_date: Optional[datetime] = Query(None, description="Data inicial do período (ISO 8601)"),
    end_date: Optional[datetime] = Query(None, description="Data final do período (ISO 8601)"),
    platform: Optional[SocialPlatform] = Query(None, description="Filtrar por plataforma"),
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(scheduled|published|cancelled)$", description="Filtrar por status"),
    org_id: str = Depends(get_current_organization)
) -> CalendarResponse:
    """
    Lista posts agendados com filtros opcionais.
    
    Retorna posts ordenados por data de agendamento (scheduled_at) em ordem crescente.
    Suporta filtros por período, plataforma e status.
    
    Args:
        start_date: Data inicial do período de busca (opcional)
        end_date: Data final do período de busca (opcional)
        platform: Filtrar por plataforma específica (opcional)
        status_filter: Filtrar por status do post (opcional)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        CalendarResponse com lista de posts e total
    
    Raises:
        HTTPException 404: Se Metricool não estiver configurado
        HTTPException 502: Se houver erro na comunicação com Metricool
    
    Validates: Requirements 4.1, 4.5
    """
    logger.info(
        "Listing calendar posts",
        extra={
            "organization_id": org_id,
            "service_module": "calendar",
            "endpoint": "list_calendar_posts",
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "platform": platform.value if platform else None,
            "status": status_filter
        }
    )
    
    try:
        # Construir query para banco de dados
        def _sync():
            query = supabase.table("posts").select("*").eq("organization_id", org_id)
            
            # Aplicar filtros
            if start_date:
                query = query.gte("scheduled_at", start_date.isoformat())
            if end_date:
                query = query.lte("scheduled_at", end_date.isoformat())
            if platform:
                query = query.eq("platform", platform.value)
            if status_filter:
                query = query.eq("status", status_filter)
            
            # Ordenar por scheduled_at crescente
            query = query.order("scheduled_at", desc=False)
            
            return query.execute()
        
        result = await asyncio.to_thread(_sync)
        posts_data = result.data if hasattr(result, "data") else result.get("data", [])
        
        # Converter para CalendarPost
        posts = []
        for post_data in posts_data:
            # Validar que thumbnail_url começa com https:// se presente
            thumbnail_url = post_data.get("thumbnail_url")
            if thumbnail_url and not thumbnail_url.startswith("https://"):
                logger.warning(
                    f"Invalid thumbnail_url for post {post_data.get('id')}: {thumbnail_url}",
                    extra={
                        "organization_id": org_id,
                        "post_id": post_data.get("id")
                    }
                )
                thumbnail_url = None
            
            posts.append(CalendarPost(
                id=post_data["id"],
                content=post_data.get("content", ""),
                platform=SocialPlatform(post_data["platform"]),
                scheduled_at=datetime.fromisoformat(post_data["scheduled_at"].replace("Z", "+00:00")),
                status=post_data.get("status", "scheduled"),
                thumbnail_url=thumbnail_url,
                metricool_post_id=post_data.get("metricool_post_id"),
                created_at=datetime.fromisoformat(post_data["created_at"].replace("Z", "+00:00")),
                cancelled_at=datetime.fromisoformat(post_data["cancelled_at"].replace("Z", "+00:00")) if post_data.get("cancelled_at") else None
            ))
        
        logger.info(
            f"Successfully listed {len(posts)} posts",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "list_calendar_posts",
                "posts_count": len(posts)
            }
        )
        
        return CalendarResponse(posts=posts, total=len(posts))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error listing calendar posts: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "list_calendar_posts"
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao listar posts do calendário"
        )


@router.get("/api/calendar/posts/{post_id}", response_model=CalendarPost)
async def get_calendar_post(
    post_id: str,
    org_id: str = Depends(get_current_organization)
) -> CalendarPost:
    """
    Retorna detalhes completos de um post agendado específico.
    
    Args:
        post_id: ID do post
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        CalendarPost com todos os detalhes
    
    Raises:
        HTTPException 404: Se post não existe ou não pertence à organização
        HTTPException 403: Se post pertence a outra organização
    
    Validates: Requirements 4.2
    """
    logger.info(
        f"Getting calendar post: {post_id}",
        extra={
            "organization_id": org_id,
            "service_module": "calendar",
            "endpoint": "get_calendar_post",
            "post_id": post_id
        }
    )
    
    try:
        def _sync():
            return supabase.table("posts").select("*").eq("id", post_id).single().execute()
        
        result = await asyncio.to_thread(_sync)
        post_data = result.data if hasattr(result, "data") else result.get("data")
        
        if not post_data:
            logger.warning(
                f"Post {post_id} not found",
                extra={
                    "organization_id": org_id,
                    "service_module": "calendar",
                    "endpoint": "get_calendar_post",
                    "post_id": post_id
                }
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post com ID '{post_id}' não encontrado"
            )
        
        # Validar que post pertence à organização
        if post_data.get("organization_id") != org_id:
            logger.warning(
                f"Unauthorized access attempt to post {post_id}",
                extra={
                    "organization_id": org_id,
                    "service_module": "calendar",
                    "endpoint": "get_calendar_post",
                    "post_id": post_id,
                    "post_org_id": post_data.get("organization_id")
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso"
            )
        
        # Validar thumbnail_url
        thumbnail_url = post_data.get("thumbnail_url")
        if thumbnail_url and not thumbnail_url.startswith("https://"):
            logger.warning(
                f"Invalid thumbnail_url for post {post_id}: {thumbnail_url}",
                extra={
                    "organization_id": org_id,
                    "post_id": post_id
                }
            )
            thumbnail_url = None
        
        post = CalendarPost(
            id=post_data["id"],
            content=post_data.get("content", ""),
            platform=SocialPlatform(post_data["platform"]),
            scheduled_at=datetime.fromisoformat(post_data["scheduled_at"].replace("Z", "+00:00")),
            status=post_data.get("status", "scheduled"),
            thumbnail_url=thumbnail_url,
            metricool_post_id=post_data.get("metricool_post_id"),
            created_at=datetime.fromisoformat(post_data["created_at"].replace("Z", "+00:00")),
            cancelled_at=datetime.fromisoformat(post_data["cancelled_at"].replace("Z", "+00:00")) if post_data.get("cancelled_at") else None
        )
        
        logger.info(
            f"Successfully retrieved post {post_id}",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "get_calendar_post",
                "post_id": post_id
            }
        )
        
        return post
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error getting calendar post: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "get_calendar_post",
                "post_id": post_id
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao obter detalhes do post"
        )


@router.put("/api/calendar/posts/{post_id}/reschedule", response_model=CalendarPost)
async def reschedule_post(
    post_id: str,
    request: RescheduleRequest,
    org_id: str = Depends(get_current_organization)
) -> CalendarPost:
    """
    Reagenda um post para nova data/hora.
    
    Atualiza a data de agendamento no banco de dados e sincroniza com Metricool.
    
    Args:
        post_id: ID do post a reagendar
        request: RescheduleRequest com nova data
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        CalendarPost atualizado
    
    Raises:
        HTTPException 404: Se post não existe ou Metricool não configurado
        HTTPException 403: Se post pertence a outra organização
        HTTPException 422: Se data é inválida (passado)
        HTTPException 502: Se houver erro na comunicação com Metricool
    
    Validates: Requirements 4.3
    """
    logger.info(
        f"Rescheduling post {post_id}",
        extra={
            "organization_id": org_id,
            "service_module": "calendar",
            "endpoint": "reschedule_post",
            "post_id": post_id,
            "new_scheduled_at": request.scheduled_at.isoformat()
        }
    )
    
    try:
        # Buscar post atual
        def _sync_get():
            return supabase.table("posts").select("*").eq("id", post_id).single().execute()
        
        result = await asyncio.to_thread(_sync_get)
        post_data = result.data if hasattr(result, "data") else result.get("data")
        
        if not post_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post com ID '{post_id}' não encontrado"
            )
        
        # Validar que post pertence à organização
        if post_data.get("organization_id") != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso"
            )
        
        # Atualizar no banco de dados
        def _sync_update():
            return supabase.table("posts").update({
                "scheduled_at": request.scheduled_at.isoformat()
            }).eq("id", post_id).execute()
        
        await asyncio.to_thread(_sync_update)
        
        # Sincronizar com Metricool se houver metricool_post_id
        metricool_post_id = post_data.get("metricool_post_id")
        if metricool_post_id:
            try:
                blog_id = await _get_blog_id(org_id)
                metricool = MetricoolService()
                
                await metricool.update_scheduled_post(
                    blog_id=blog_id,
                    post_id=metricool_post_id,
                    platform=post_data["platform"],
                    text=post_data.get("content", ""),
                    media_url=post_data.get("thumbnail_url"),
                    scheduled_at=request.scheduled_at.isoformat(),
                    timezone="UTC",
                    organization_id=org_id
                )
                
                logger.info(
                    f"Post {post_id} synchronized with Metricool",
                    extra={
                        "organization_id": org_id,
                        "post_id": post_id,
                        "metricool_post_id": metricool_post_id
                    }
                )
            except MetricoolAPIError as e:
                logger.warning(
                    f"Failed to sync with Metricool: {e}",
                    extra={
                        "organization_id": org_id,
                        "post_id": post_id,
                        "metricool_post_id": metricool_post_id
                    }
                )
                # Não falhar se sincronização com Metricool falhar
        
        # Buscar post atualizado
        result = await asyncio.to_thread(_sync_get)
        post_data = result.data if hasattr(result, "data") else result.get("data")
        
        # Validar thumbnail_url
        thumbnail_url = post_data.get("thumbnail_url")
        if thumbnail_url and not thumbnail_url.startswith("https://"):
            thumbnail_url = None
        
        post = CalendarPost(
            id=post_data["id"],
            content=post_data.get("content", ""),
            platform=SocialPlatform(post_data["platform"]),
            scheduled_at=datetime.fromisoformat(post_data["scheduled_at"].replace("Z", "+00:00")),
            status=post_data.get("status", "scheduled"),
            thumbnail_url=thumbnail_url,
            metricool_post_id=post_data.get("metricool_post_id"),
            created_at=datetime.fromisoformat(post_data["created_at"].replace("Z", "+00:00")),
            cancelled_at=datetime.fromisoformat(post_data["cancelled_at"].replace("Z", "+00:00")) if post_data.get("cancelled_at") else None
        )
        
        logger.info(
            f"Successfully rescheduled post {post_id}",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "reschedule_post",
                "post_id": post_id
            }
        )
        
        return post
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error rescheduling post: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "reschedule_post",
                "post_id": post_id
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao reagendar post"
        )


@router.put("/api/calendar/posts/{post_id}/cancel")
async def cancel_post(
    post_id: str,
    org_id: str = Depends(get_current_organization)
) -> dict:
    """
    Cancela um post agendado.
    
    Marca o post como cancelado no banco de dados e remove do Metricool.
    
    Args:
        post_id: ID do post a cancelar
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        Dict com mensagem de sucesso
    
    Raises:
        HTTPException 404: Se post não existe ou Metricool não configurado
        HTTPException 403: Se post pertence a outra organização
        HTTPException 502: Se houver erro na comunicação com Metricool
    
    Validates: Requirements 4.4, 4.7
    """
    logger.info(
        f"Cancelling post {post_id}",
        extra={
            "organization_id": org_id,
            "service_module": "calendar",
            "endpoint": "cancel_post",
            "post_id": post_id
        }
    )
    
    try:
        # Buscar post atual
        def _sync_get():
            return supabase.table("posts").select("*").eq("id", post_id).single().execute()
        
        result = await asyncio.to_thread(_sync_get)
        post_data = result.data if hasattr(result, "data") else result.get("data")
        
        if not post_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post com ID '{post_id}' não encontrado"
            )
        
        # Validar que post pertence à organização
        if post_data.get("organization_id") != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso"
            )
        
        # Atualizar no banco de dados
        def _sync_update():
            return supabase.table("posts").update({
                "status": "cancelled",
                "cancelled_at": datetime.utcnow().isoformat()
            }).eq("id", post_id).execute()
        
        await asyncio.to_thread(_sync_update)
        
        # Remover do Metricool se houver metricool_post_id
        metricool_post_id = post_data.get("metricool_post_id")
        if metricool_post_id:
            try:
                blog_id = await _get_blog_id(org_id)
                metricool = MetricoolService()
                
                await metricool.cancel_scheduled_post(
                    blog_id=blog_id,
                    post_id=metricool_post_id,
                    organization_id=org_id
                )
                
                logger.info(
                    f"Post {post_id} removed from Metricool",
                    extra={
                        "organization_id": org_id,
                        "post_id": post_id,
                        "metricool_post_id": metricool_post_id
                    }
                )
            except MetricoolNotFoundError:
                logger.warning(
                    f"Post {metricool_post_id} not found in Metricool",
                    extra={
                        "organization_id": org_id,
                        "post_id": post_id,
                        "metricool_post_id": metricool_post_id
                    }
                )
                # Não falhar se post já foi removido do Metricool
            except MetricoolAPIError as e:
                logger.warning(
                    f"Failed to remove from Metricool: {e}",
                    extra={
                        "organization_id": org_id,
                        "post_id": post_id,
                        "metricool_post_id": metricool_post_id
                    }
                )
                # Não falhar se remoção do Metricool falhar
        
        logger.info(
            f"Successfully cancelled post {post_id}",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "cancel_post",
                "post_id": post_id
            }
        )
        
        return {"message": "Post cancelado com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error cancelling post: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "calendar",
                "endpoint": "cancel_post",
                "post_id": post_id
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao cancelar post"
        )
