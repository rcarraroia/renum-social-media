"""
Router de Dashboard - Estatísticas agregadas

Este módulo implementa endpoint para:
- Obter estatísticas consolidadas do dashboard (vídeos, posts, engajamento, plataformas conectadas)

Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from app.api.deps import get_current_organization
from app.services.metricool import (
    MetricoolService,
    MetricoolAPIError,
    MetricoolAuthError
)
from app.models.social_accounts import DashboardStats, SocialPlatform
from app.database import supabase
from app.utils.logger import get_logger
import asyncio

router = APIRouter()
logger = get_logger("dashboard")


async def _get_blog_id(org_id: str) -> int:
    """
    Obtém blog_id do Metricool para a organização
    
    Args:
        org_id: ID da organização
    
    Returns:
        blog_id do Metricool ou None se não configurado
    """
    def _sync():
        return supabase.table("organizations").select("metricool_blog_id").eq("id", org_id).single().execute()
    
    org_res = await asyncio.to_thread(_sync)
    org_data = org_res.data if hasattr(org_res, "data") else org_res.get("data")
    
    return org_data.get("metricool_blog_id") if org_data else None


@router.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    org_id: str = Depends(get_current_organization)
) -> DashboardStats:
    """
    Retorna estatísticas agregadas para exibição no dashboard.
    
    Calcula métricas consultando banco de dados local e Metricool API:
    - videos_total: Total de vídeos gerados pela organização
    - posts_scheduled_month: Posts agendados no mês atual
    - posts_published_month: Posts publicados no mês atual
    - engagement_total: Soma de likes, comentários e compartilhamentos (via Metricool)
    - connected_platforms: Lista de plataformas conectadas (via Metricool)
    
    Args:
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        DashboardStats com todas as métricas
    
    Raises:
        HTTPException 500: Se houver erro ao calcular estatísticas
    
    Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
    """
    logger.info(
        "Getting dashboard stats",
        extra={
            "organization_id": org_id,
            "service_module": "dashboard",
            "endpoint": "get_dashboard_stats"
        }
    )
    
    try:
        # Calcular início e fim do mês atual
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        if now.month == 12:
            end_of_month = datetime(now.year + 1, 1, 1)
        else:
            end_of_month = datetime(now.year, now.month + 1, 1)
        
        # 1. Consultar total de vídeos gerados
        def _sync_videos():
            return supabase.table("videos").select("id", count="exact").eq("organization_id", org_id).execute()
        
        videos_result = await asyncio.to_thread(_sync_videos)
        videos_total = videos_result.count if hasattr(videos_result, "count") else 0
        
        logger.debug(
            f"Videos total: {videos_total}",
            extra={
                "organization_id": org_id,
                "videos_total": videos_total
            }
        )
        
        # 2. Consultar posts agendados no mês atual
        def _sync_scheduled():
            return supabase.table("posts").select("id", count="exact").eq("organization_id", org_id).eq("status", "scheduled").gte("scheduled_at", start_of_month.isoformat()).lt("scheduled_at", end_of_month.isoformat()).execute()
        
        scheduled_result = await asyncio.to_thread(_sync_scheduled)
        posts_scheduled_month = scheduled_result.count if hasattr(scheduled_result, "count") else 0
        
        logger.debug(
            f"Posts scheduled this month: {posts_scheduled_month}",
            extra={
                "organization_id": org_id,
                "posts_scheduled_month": posts_scheduled_month
            }
        )
        
        # 3. Consultar posts publicados no mês atual
        def _sync_published():
            return supabase.table("posts").select("id", count="exact").eq("organization_id", org_id).eq("status", "published").gte("scheduled_at", start_of_month.isoformat()).lt("scheduled_at", end_of_month.isoformat()).execute()
        
        published_result = await asyncio.to_thread(_sync_published)
        posts_published_month = published_result.count if hasattr(published_result, "count") else 0
        
        logger.debug(
            f"Posts published this month: {posts_published_month}",
            extra={
                "organization_id": org_id,
                "posts_published_month": posts_published_month
            }
        )
        
        # 4. Obter engajamento total e plataformas conectadas via Metricool
        engagement_total = 0
        connected_platforms = []
        
        blog_id = await _get_blog_id(org_id)
        
        if blog_id:
            try:
                metricool = MetricoolService()
                
                # Obter plataformas conectadas
                connected_accounts = await metricool.get_connected_accounts(
                    blog_id=blog_id,
                    organization_id=org_id
                )
                
                # Mapear para SocialPlatform enum
                platform_mapping = {
                    "instagram": SocialPlatform.INSTAGRAM,
                    "tiktok": SocialPlatform.TIKTOK,
                    "linkedin": SocialPlatform.LINKEDIN,
                    "facebook": SocialPlatform.FACEBOOK,
                    "twitter": SocialPlatform.X,
                    "x": SocialPlatform.X,
                    "youtube": SocialPlatform.YOUTUBE
                }
                
                for platform_key in connected_accounts.keys():
                    platform = platform_mapping.get(platform_key)
                    if platform and platform not in connected_platforms:
                        connected_platforms.append(platform)
                
                logger.debug(
                    f"Connected platforms: {[p.value for p in connected_platforms]}",
                    extra={
                        "organization_id": org_id,
                        "connected_platforms": [p.value for p in connected_platforms]
                    }
                )
                
                # Obter analytics para calcular engajamento total
                # Tentar obter analytics de cada plataforma conectada
                for platform in connected_platforms:
                    try:
                        # Mapear de volta para nome da plataforma no Metricool
                        platform_name = platform.value if platform != SocialPlatform.X else "twitter"
                        
                        analytics = await metricool.get_analytics(
                            blog_id=blog_id,
                            start_date=start_of_month.strftime("%Y-%m-%d"),
                            end_date=end_of_month.strftime("%Y-%m-%d"),
                            network=platform_name,
                            metrics=["engagement", "likes", "comments", "shares"],
                            timezone="UTC",
                            organization_id=org_id
                        )
                        
                        # Somar engajamento (estrutura pode variar por plataforma)
                        if isinstance(analytics, dict):
                            engagement_total += analytics.get("engagement", 0)
                            engagement_total += analytics.get("likes", 0)
                            engagement_total += analytics.get("comments", 0)
                            engagement_total += analytics.get("shares", 0)
                        
                    except MetricoolAPIError as e:
                        logger.warning(
                            f"Failed to get analytics for {platform.value}: {e}",
                            extra={
                                "organization_id": org_id,
                                "platform": platform.value
                            }
                        )
                        # Continuar mesmo se analytics de uma plataforma falhar
                
                logger.debug(
                    f"Engagement total: {engagement_total}",
                    extra={
                        "organization_id": org_id,
                        "engagement_total": engagement_total
                    }
                )
                
            except MetricoolAuthError as e:
                logger.warning(
                    f"Metricool authentication error: {e}",
                    extra={
                        "organization_id": org_id,
                        "service_module": "dashboard",
                        "endpoint": "get_dashboard_stats"
                    }
                )
                # Continuar sem dados do Metricool
            except MetricoolAPIError as e:
                logger.warning(
                    f"Metricool API error: {e}",
                    extra={
                        "organization_id": org_id,
                        "service_module": "dashboard",
                        "endpoint": "get_dashboard_stats"
                    }
                )
                # Continuar sem dados do Metricool
        else:
            logger.info(
                "Metricool not configured, skipping engagement and connected platforms",
                extra={
                    "organization_id": org_id,
                    "service_module": "dashboard",
                    "endpoint": "get_dashboard_stats"
                }
            )
        
        # Construir resposta
        stats = DashboardStats(
            videos_total=videos_total,
            posts_scheduled_month=posts_scheduled_month,
            posts_published_month=posts_published_month,
            engagement_total=engagement_total,
            connected_platforms=connected_platforms
        )
        
        logger.info(
            "Successfully calculated dashboard stats",
            extra={
                "organization_id": org_id,
                "service_module": "dashboard",
                "endpoint": "get_dashboard_stats",
                "videos_total": videos_total,
                "posts_scheduled_month": posts_scheduled_month,
                "posts_published_month": posts_published_month,
                "engagement_total": engagement_total,
                "connected_platforms_count": len(connected_platforms)
            }
        )
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error getting dashboard stats: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "dashboard",
                "endpoint": "get_dashboard_stats"
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao calcular estatísticas do dashboard"
        )
