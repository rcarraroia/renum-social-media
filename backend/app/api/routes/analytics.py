"""
Router de Analytics - Métricas de desempenho e insights

Este módulo implementa endpoints para:
- Dashboard metrics: Métricas agregadas dos últimos 30 dias
- Posts performance: Performance individual de posts com filtros
- Best times: Melhores horários para publicação por plataforma
- Platform breakdown: Breakdown de métricas por plataforma

Validates: Requirements 2.1-2.5, 3.1-3.6, 4.1-4.5, 5.1-5.5, 14.1-14.4
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import date
from app.api.deps import get_current_organization
from app.services.analytics import (
    AnalyticsService,
    AnalyticsError,
    AnalyticsDataUnavailableError
)
from app.models.analytics import (
    DashboardMetricsResponse,
    PostsPerformanceResponse,
    BestTimesResponse,
    PlatformBreakdownResponse
)
from app.database import supabase
from app.utils.logger import get_logger
from app.utils.sanitize import (
    sanitize_string,
    sanitize_platform_name,
    sanitize_enum_value,
    validate_date_format
)
import asyncio

router = APIRouter()
logger = get_logger("analytics")


async def _get_blog_id(org_id: str) -> int:
    """
    Obtém blog_id do Metricool para a organização
    
    Args:
        org_id: ID da organização
    
    Returns:
        blog_id do Metricool
        
    Raises:
        HTTPException 404: Se organização não tem Metricool configurado
    """
    def _sync():
        return supabase.table("organizations").select("metricool_blog_id").eq("id", org_id).single().execute()
    
    org_res = await asyncio.to_thread(_sync)
    org_data = org_res.data if hasattr(org_res, "data") else org_res.get("data")
    
    blog_id = org_data.get("metricool_blog_id") if org_data else None
    
    if not blog_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metricool não configurado para esta organização"
        )
    
    return blog_id


@router.get("/api/analytics/dashboard", response_model=DashboardMetricsResponse)
async def get_dashboard(
    org_id: str = Depends(get_current_organization)
) -> DashboardMetricsResponse:
    """
    Retorna métricas agregadas para dashboard.
    
    Calcula métricas dos últimos 30 dias incluindo:
    - Alcance, impressões, engajamento total
    - Métricas granulares (likes, comments, shares, saves)
    - Seguidores (total, ganhos, perdidos, saldo)
    - Variações percentuais vs período anterior
    - Dados de evolução temporal
    
    Cache: 20 minutos
    Fallback: Usa cache expirado se API falhar
    
    Args:
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        DashboardMetricsResponse com todas as métricas
    
    Raises:
        HTTPException 404: Se Metricool não configurado
        HTTPException 503: Se dados não disponíveis e sem cache
    
    Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 14.1
    """
    logger.info(
        "Getting dashboard metrics",
        extra={
            "organization_id": org_id,
            "endpoint": "get_dashboard"
        }
    )
    
    try:
        blog_id = await _get_blog_id(org_id)
        
        async with AnalyticsService() as analytics:
            metrics = await analytics.get_dashboard_metrics(org_id, blog_id)
            
            # Converter dataclass para Pydantic model
            return DashboardMetricsResponse(
                total_reach=metrics.total_reach,
                total_impressions=metrics.total_impressions,
                total_engagement=metrics.total_engagement,
                engagement_rate=metrics.engagement_rate,
                total_likes=metrics.total_likes,
                total_comments=metrics.total_comments,
                total_shares=metrics.total_shares,
                total_saves=metrics.total_saves,
                total_followers=metrics.total_followers,
                followers_gained=metrics.followers_gained,
                followers_lost=metrics.followers_lost,
                net_followers=metrics.net_followers,
                reach_change_percent=metrics.reach_change_percent,
                engagement_change_percent=metrics.engagement_change_percent,
                followers_change_percent=metrics.followers_change_percent,
                period_start=metrics.period_start,
                period_end=metrics.period_end,
                evolution_data=[
                    {
                        "date": point.date,
                        "reach": point.reach,
                        "engagement": point.engagement,
                        "followers": point.followers
                    }
                    for point in metrics.evolution_data
                ]
            )
    
    except AnalyticsDataUnavailableError as e:
        logger.error(
            f"Analytics data unavailable: {e.message}",
            extra={"organization_id": org_id}
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.user_message
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(
            f"Unexpected error getting dashboard metrics: {e}",
            extra={"organization_id": org_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar métricas do dashboard"
        )


@router.get("/api/analytics/posts", response_model=PostsPerformanceResponse)
async def get_posts_performance(
    start_date: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    platform: Optional[str] = Query(None, description="Filtro de plataforma"),
    sort_by: str = Query("published_at", description="Campo para ordenação"),
    order: str = Query("desc", description="Ordem (asc/desc)"),
    org_id: str = Depends(get_current_organization)
) -> PostsPerformanceResponse:
    """
    Retorna performance individual de posts com filtros e ordenação.
    
    Permite filtrar por:
    - Período (start_date, end_date)
    - Plataforma específica
    
    Permite ordenar por:
    - published_at, reach, likes, comments, shares, engagement_rate
    
    Cache: 15 minutos (incluindo filtros na chave)
    Fallback: Usa cache expirado se API falhar
    
    Args:
        start_date: Data inicial (opcional, padrão: últimos 30 dias)
        end_date: Data final (opcional, padrão: hoje)
        platform: Filtro de plataforma (opcional)
        sort_by: Campo para ordenação (padrão: published_at)
        order: Ordem asc/desc (padrão: desc)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        PostsPerformanceResponse com lista de posts e total
    
    Raises:
        HTTPException 404: Se Metricool não configurado
        HTTPException 400: Se parâmetros inválidos
        HTTPException 503: Se dados não disponíveis e sem cache
    
    Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 14.2, 20.3
    """
    logger.info(
        "Getting posts performance",
        extra={
            "organization_id": org_id,
            "platform": platform,
            "sort_by": sort_by,
            "endpoint": "get_posts_performance"
        }
    )
    
    try:
        # Sanitizar inputs
        if platform:
            platform = sanitize_platform_name(platform)
            if not platform:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nome de plataforma inválido"
                )
        
        # Validar sort_by
        valid_sort_fields = ["published_at", "reach", "likes", "comments", "shares", "engagement_rate"]
        sort_by = sanitize_enum_value(sort_by, valid_sort_fields)
        if not sort_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Campo sort_by inválido. Use um de: {', '.join(valid_sort_fields)}"
            )
        
        # Validar order
        order = sanitize_enum_value(order, ["asc", "desc"])
        if not order:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parâmetro order deve ser 'asc' ou 'desc'"
            )
        
        # Validar e converter datas
        start_date_obj = None
        end_date_obj = None
        
        if start_date:
            start_date = sanitize_string(start_date, max_length=10)
            if not validate_date_format(start_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de start_date inválido. Use YYYY-MM-DD"
                )
            try:
                start_date_obj = date.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de start_date inválido. Use YYYY-MM-DD"
                )
        
        if end_date:
            end_date = sanitize_string(end_date, max_length=10)
            if not validate_date_format(end_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de end_date inválido. Use YYYY-MM-DD"
                )
            try:
                end_date_obj = date.fromisoformat(end_date)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de end_date inválido. Use YYYY-MM-DD"
                )
        
        blog_id = await _get_blog_id(org_id)
        
        async with AnalyticsService() as analytics:
            posts = await analytics.get_posts_performance(
                org_id=org_id,
                blog_id=blog_id,
                start_date=start_date_obj,
                end_date=end_date_obj,
                platform=platform,
                sort_by=sort_by,
                order=order
            )
            
            # Converter dataclasses para Pydantic models
            return PostsPerformanceResponse(
                posts=[
                    {
                        "post_id": post.post_id,
                        "platform": post.platform,
                        "published_at": post.published_at,
                        "content_preview": post.content_preview,
                        "reach": post.reach,
                        "likes": post.likes,
                        "comments": post.comments,
                        "shares": post.shares,
                        "engagement_rate": post.engagement_rate,
                        "post_url": post.post_url
                    }
                    for post in posts
                ],
                total=len(posts)
            )
    
    except AnalyticsDataUnavailableError as e:
        logger.error(
            f"Analytics data unavailable: {e.message}",
            extra={"organization_id": org_id}
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.user_message
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(
            f"Unexpected error getting posts performance: {e}",
            extra={"organization_id": org_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar performance de posts"
        )


@router.get("/api/analytics/best-times", response_model=BestTimesResponse)
async def get_best_times(
    platform: Optional[str] = Query(None, description="Filtro de plataforma"),
    org_id: str = Depends(get_current_organization)
) -> BestTimesResponse:
    """
    Retorna melhores horários para publicação por plataforma.
    
    Analisa posts dos últimos 90 dias e calcula engagement médio por hora/dia.
    Retorna top 3 horários por plataforma.
    
    Fallback: Se dados insuficientes (< 10 posts), retorna horários default
    baseados em pesquisa de mercado brasileiro.
    
    Cache: 60 minutos (dados mudam lentamente)
    
    Args:
        platform: Filtro de plataforma (opcional, padrão: todas)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        BestTimesResponse com horários agrupados por plataforma
    
    Raises:
        HTTPException 404: Se Metricool não configurado
        HTTPException 503: Se dados não disponíveis e sem cache
    
    Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 14.3, 20.3
    """
    logger.info(
        "Getting best times",
        extra={
            "organization_id": org_id,
            "platform": platform,
            "endpoint": "get_best_times"
        }
    )
    
    try:
        # Sanitizar platform
        if platform:
            platform = sanitize_platform_name(platform)
            if not platform:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nome de plataforma inválido"
                )
        
        blog_id = await _get_blog_id(org_id)
        
        async with AnalyticsService() as analytics:
            best_times = await analytics.get_best_times(
                org_id=org_id,
                blog_id=blog_id,
                platform=platform
            )
            
            # Converter dataclasses para Pydantic models
            return BestTimesResponse(
                best_times={
                    plat: [
                        {
                            "hour": bt.hour,
                            "day_of_week": bt.day_of_week,
                            "avg_engagement": bt.avg_engagement,
                            "sample_size": bt.sample_size
                        }
                        for bt in times
                    ]
                    for plat, times in best_times.items()
                }
            )
    
    except AnalyticsDataUnavailableError as e:
        logger.error(
            f"Analytics data unavailable: {e.message}",
            extra={"organization_id": org_id}
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.user_message
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(
            f"Unexpected error getting best times: {e}",
            extra={"organization_id": org_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar melhores horários"
        )


@router.get("/api/analytics/platforms", response_model=PlatformBreakdownResponse)
async def get_platform_breakdown(
    start_date: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    org_id: str = Depends(get_current_organization)
) -> PlatformBreakdownResponse:
    """
    Retorna breakdown de métricas por plataforma.
    
    Agrupa métricas por plataforma e calcula:
    - Alcance, engajamento, seguidores por plataforma
    - Quantidade de posts por plataforma
    - Percentual de contribuição de cada plataforma
    
    Cache: 20 minutos
    Fallback: Usa cache expirado se API falhar
    
    Args:
        start_date: Data inicial (opcional, padrão: últimos 30 dias)
        end_date: Data final (opcional, padrão: hoje)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        PlatformBreakdownResponse com métricas por plataforma
    
    Raises:
        HTTPException 404: Se Metricool não configurado
        HTTPException 400: Se parâmetros inválidos
        HTTPException 503: Se dados não disponíveis e sem cache
    
    Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 14.4, 20.3
    """
    logger.info(
        "Getting platform breakdown",
        extra={
            "organization_id": org_id,
            "endpoint": "get_platform_breakdown"
        }
    )
    
    try:
        # Validar e converter datas
        start_date_obj = None
        end_date_obj = None
        
        if start_date:
            start_date = sanitize_string(start_date, max_length=10)
            if not validate_date_format(start_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de start_date inválido. Use YYYY-MM-DD"
                )
            try:
                start_date_obj = date.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de start_date inválido. Use YYYY-MM-DD"
                )
        
        if end_date:
            end_date = sanitize_string(end_date, max_length=10)
            if not validate_date_format(end_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de end_date inválido. Use YYYY-MM-DD"
                )
            try:
                end_date_obj = date.fromisoformat(end_date)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de end_date inválido. Use YYYY-MM-DD"
                )
        
        blog_id = await _get_blog_id(org_id)
        
        async with AnalyticsService() as analytics:
            platforms = await analytics.get_platform_breakdown(
                org_id=org_id,
                blog_id=blog_id,
                start_date=start_date_obj,
                end_date=end_date_obj
            )
            
            # Calcular totais
            total_reach = sum(p.reach for p in platforms)
            total_engagement = sum(p.engagement for p in platforms)
            
            # Converter dataclasses para Pydantic models
            return PlatformBreakdownResponse(
                platforms=[
                    {
                        "platform": p.platform,
                        "reach": p.reach,
                        "engagement": p.engagement,
                        "followers": p.followers,
                        "posts_count": p.posts_count,
                        "contribution_percent": p.contribution_percent
                    }
                    for p in platforms
                ],
                total_reach=total_reach,
                total_engagement=total_engagement
            )
    
    except AnalyticsDataUnavailableError as e:
        logger.error(
            f"Analytics data unavailable: {e.message}",
            extra={"organization_id": org_id}
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.user_message
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(
            f"Unexpected error getting platform breakdown: {e}",
            extra={"organization_id": org_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar breakdown de plataformas"
        )



@router.get("/api/dashboard/stats")
async def get_dashboard_stats(
    org_id: str = Depends(get_current_organization)
):
    """
    Retorna estatísticas consolidadas para o dashboard.
    
    Calcula:
    - Total de scripts gerados
    - Vídeos publicados
    - Agendamentos pendentes
    - Crescimento percentual vs mês anterior
    
    Args:
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "scripts_generated": 42,
            "videos_published": 15,
            "pending_scheduled": 8,
            "growth_percentage": 23.5
        }
    
    Validates: Requirements 14.1
    """
    logger.info(
        "Getting dashboard stats",
        extra={
            "organization_id": org_id,
            "endpoint": "get_dashboard_stats"
        }
    )
    
    try:
        from datetime import datetime, timedelta
        
        # Calcular datas
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_of_last_month = (start_of_month - timedelta(days=1)).replace(day=1)
        
        # Contar scripts gerados (vídeos com recording_source='script')
        def _count_scripts():
            return supabase.table("videos").select(
                "id", count="exact"
            ).eq("organization_id", org_id).eq(
                "recording_source", "script"
            ).gte("created_at", start_of_month.isoformat()).execute()
        
        scripts_result = await asyncio.to_thread(_count_scripts)
        scripts_generated = scripts_result.count if hasattr(scripts_result, "count") else 0
        
        # Contar vídeos publicados (status='ready')
        def _count_videos():
            return supabase.table("videos").select(
                "id", count="exact"
            ).eq("organization_id", org_id).eq(
                "status", "ready"
            ).gte("created_at", start_of_month.isoformat()).execute()
        
        videos_result = await asyncio.to_thread(_count_videos)
        videos_published = videos_result.count if hasattr(videos_result, "count") else 0
        
        # Contar agendamentos pendentes (posts com status='scheduled')
        def _count_scheduled():
            return supabase.table("posts").select(
                "id", count="exact"
            ).eq("organization_id", org_id).eq(
                "status", "scheduled"
            ).gte("scheduled_at", now.isoformat()).execute()
        
        scheduled_result = await asyncio.to_thread(_count_scheduled)
        pending_scheduled = scheduled_result.count if hasattr(scheduled_result, "count") else 0
        
        # Calcular crescimento (comparar com mês anterior)
        def _count_last_month():
            return supabase.table("videos").select(
                "id", count="exact"
            ).eq("organization_id", org_id).eq(
                "status", "ready"
            ).gte("created_at", start_of_last_month.isoformat()).lt(
                "created_at", start_of_month.isoformat()
            ).execute()
        
        last_month_result = await asyncio.to_thread(_count_last_month)
        last_month_videos = last_month_result.count if hasattr(last_month_result, "count") else 0
        
        # Calcular percentual de crescimento
        if last_month_videos > 0:
            growth_percentage = ((videos_published - last_month_videos) / last_month_videos) * 100
        else:
            growth_percentage = 100.0 if videos_published > 0 else 0.0
        
        return {
            "scripts_generated": scripts_generated,
            "videos_published": videos_published,
            "pending_scheduled": pending_scheduled,
            "growth_percentage": round(growth_percentage, 1)
        }
    
    except Exception as e:
        logger.error(
            f"Error getting dashboard stats: {e}",
            extra={"organization_id": org_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar estatísticas do dashboard"
        )
