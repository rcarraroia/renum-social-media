"""
Modelos Pydantic para Analytics API.

Este módulo define os schemas de dados para:
- Dashboard metrics (DashboardMetricsResponse)
- Posts performance (PostPerformanceModel, PostsPerformanceResponse)
- Best times (BestTimeModel, BestTimesResponse)
- Platform breakdown (PlatformMetricsModel, PlatformBreakdownResponse)

Validates: Requirements 2.1-2.5, 3.1-3.6, 4.1-4.5, 5.1-5.5, 14.6
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import date, datetime


# ===== DASHBOARD METRICS MODELS =====

class MetricPointModel(BaseModel):
    """
    Ponto de métrica para evolução temporal.
    
    Validates: Requirement 2.4
    """
    date: date = Field(
        ...,
        description="Data do ponto de métrica"
    )
    reach: int = Field(
        ...,
        ge=0,
        description="Alcance total no dia"
    )
    engagement: int = Field(
        ...,
        ge=0,
        description="Engajamento total no dia"
    )
    followers: int = Field(
        ...,
        ge=0,
        description="Total de seguidores no dia"
    )


class DashboardMetricsResponse(BaseModel):
    """
    Métricas agregadas para dashboard.
    
    Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
    """
    total_reach: int = Field(
        ...,
        ge=0,
        description="Alcance total do período"
    )
    total_impressions: int = Field(
        ...,
        ge=0,
        description="Impressões totais do período"
    )
    total_engagement: int = Field(
        ...,
        ge=0,
        description="Engajamento total (likes + comments + shares + saves)"
    )
    engagement_rate: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Taxa de engajamento percentual"
    )
    total_likes: int = Field(
        ...,
        ge=0,
        description="Total de curtidas"
    )
    total_comments: int = Field(
        ...,
        ge=0,
        description="Total de comentários"
    )
    total_shares: int = Field(
        ...,
        ge=0,
        description="Total de compartilhamentos"
    )
    total_saves: int = Field(
        ...,
        ge=0,
        description="Total de salvamentos"
    )
    total_followers: int = Field(
        ...,
        ge=0,
        description="Total de seguidores"
    )
    followers_gained: int = Field(
        ...,
        ge=0,
        description="Seguidores ganhos no período"
    )
    followers_lost: int = Field(
        ...,
        ge=0,
        description="Seguidores perdidos no período"
    )
    net_followers: int = Field(
        ...,
        description="Saldo de seguidores (ganhos - perdidos)"
    )
    reach_change_percent: float = Field(
        ...,
        description="Variação percentual de alcance vs período anterior"
    )
    engagement_change_percent: float = Field(
        ...,
        description="Variação percentual de engajamento vs período anterior"
    )
    followers_change_percent: float = Field(
        ...,
        description="Variação percentual de seguidores vs período anterior"
    )
    period_start: date = Field(
        ...,
        description="Data inicial do período analisado"
    )
    period_end: date = Field(
        ...,
        description="Data final do período analisado"
    )
    evolution_data: List[MetricPointModel] = Field(
        default_factory=list,
        description="Dados de evolução temporal das métricas"
    )


# ===== POSTS PERFORMANCE MODELS =====

class PostPerformanceModel(BaseModel):
    """
    Performance individual de um post.
    
    Validates: Requirements 3.1, 3.2, 3.3, 3.4
    """
    post_id: str = Field(
        ...,
        description="ID único do post"
    )
    platform: str = Field(
        ...,
        description="Plataforma onde o post foi publicado"
    )
    published_at: datetime = Field(
        ...,
        description="Data e hora de publicação"
    )
    content_preview: str = Field(
        ...,
        max_length=200,
        description="Preview do conteúdo (primeiros 100 caracteres)"
    )
    reach: int = Field(
        ...,
        ge=0,
        description="Alcance do post"
    )
    likes: int = Field(
        ...,
        ge=0,
        description="Curtidas do post"
    )
    comments: int = Field(
        ...,
        ge=0,
        description="Comentários do post"
    )
    shares: int = Field(
        ...,
        ge=0,
        description="Compartilhamentos do post"
    )
    engagement_rate: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Taxa de engajamento do post"
    )
    post_url: Optional[str] = Field(
        None,
        description="URL do post na plataforma"
    )


class PostsPerformanceResponse(BaseModel):
    """
    Lista de posts com performance.
    
    Validates: Requirements 3.5, 3.6
    """
    posts: List[PostPerformanceModel] = Field(
        default_factory=list,
        description="Lista de posts com métricas"
    )
    total: int = Field(
        ...,
        ge=0,
        description="Total de posts encontrados"
    )


# ===== BEST TIMES MODELS =====

class BestTimeModel(BaseModel):
    """
    Melhor horário para publicação.
    
    Validates: Requirements 4.1, 4.2, 4.3
    """
    hour: int = Field(
        ...,
        ge=0,
        le=23,
        description="Hora do dia (0-23)"
    )
    day_of_week: int = Field(
        ...,
        ge=0,
        le=6,
        description="Dia da semana (0=Segunda, 6=Domingo)"
    )
    avg_engagement: float = Field(
        ...,
        ge=0.0,
        description="Engajamento médio neste horário"
    )
    sample_size: int = Field(
        ...,
        ge=0,
        description="Quantidade de posts analisados (0 = horário default)"
    )


class BestTimesResponse(BaseModel):
    """
    Melhores horários por plataforma.
    
    Validates: Requirements 4.4, 4.5
    """
    best_times: Dict[str, List[BestTimeModel]] = Field(
        default_factory=dict,
        description="Melhores horários agrupados por plataforma"
    )


# ===== PLATFORM BREAKDOWN MODELS =====

class PlatformMetricsModel(BaseModel):
    """
    Métricas agregadas de uma plataforma.
    
    Validates: Requirements 5.1, 5.2, 5.3
    """
    platform: str = Field(
        ...,
        description="Nome da plataforma"
    )
    reach: int = Field(
        ...,
        ge=0,
        description="Alcance total da plataforma"
    )
    engagement: int = Field(
        ...,
        ge=0,
        description="Engajamento total da plataforma"
    )
    followers: int = Field(
        ...,
        ge=0,
        description="Total de seguidores na plataforma"
    )
    posts_count: int = Field(
        ...,
        ge=0,
        description="Quantidade de posts publicados"
    )
    contribution_percent: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentual de contribuição para o alcance total"
    )


class PlatformBreakdownResponse(BaseModel):
    """
    Breakdown de métricas por plataforma.
    
    Validates: Requirements 5.4, 5.5
    """
    platforms: List[PlatformMetricsModel] = Field(
        default_factory=list,
        description="Lista de plataformas com métricas"
    )
    total_reach: int = Field(
        ...,
        ge=0,
        description="Alcance total de todas as plataformas"
    )
    total_engagement: int = Field(
        ...,
        ge=0,
        description="Engajamento total de todas as plataformas"
    )
