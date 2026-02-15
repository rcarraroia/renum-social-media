"""
Modelos Pydantic para integração com redes sociais, calendário e dashboard.

Este módulo define os schemas de dados para:
- OAuth de redes sociais (ConnectRequest, PlatformStatus, SocialAccountsResponse)
- Sistema de calendário (CalendarQuery, CalendarPost, CalendarResponse)
- Dashboard (DashboardStats)
- Reagendamento (RescheduleRequest)

Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class SocialPlatform(str, Enum):
    """
    Plataformas de redes sociais suportadas pelo sistema.
    
    Validates: Requirement 8.1
    """
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    FACEBOOK = "facebook"
    X = "x"
    YOUTUBE = "youtube"


# ===== SOCIAL ACCOUNTS MODELS =====

class ConnectRequest(BaseModel):
    """
    Request para iniciar fluxo OAuth de conexão com rede social.
    
    Validates: Requirement 8.2
    """
    platform: SocialPlatform = Field(
        ...,
        description="Plataforma de rede social a ser conectada"
    )


class PlatformStatus(BaseModel):
    """
    Status de conexão de uma plataforma de rede social.
    
    Validates: Requirement 8.3
    """
    platform: SocialPlatform = Field(
        ...,
        description="Plataforma de rede social"
    )
    connected: bool = Field(
        ...,
        description="Indica se a plataforma está conectada"
    )
    account_name: Optional[str] = Field(
        None,
        description="Nome da conta conectada (ex: @username)",
        min_length=1,
        max_length=255
    )


class SocialAccountsResponse(BaseModel):
    """
    Resposta com lista de status de todas as plataformas suportadas.
    
    Validates: Requirement 8.4
    """
    accounts: List[PlatformStatus] = Field(
        ...,
        description="Lista de status de conexão para cada plataforma",
        min_length=6,
        max_length=6
    )
    
    @field_validator('accounts')
    @classmethod
    def validate_all_platforms_present(cls, v: List[PlatformStatus]) -> List[PlatformStatus]:
        """Valida que todas as 6 plataformas estão presentes na resposta."""
        platforms = {status.platform for status in v}
        expected_platforms = {platform for platform in SocialPlatform}
        
        if platforms != expected_platforms:
            missing = expected_platforms - platforms
            extra = platforms - expected_platforms
            error_msg = []
            if missing:
                error_msg.append(f"Plataformas faltando: {missing}")
            if extra:
                error_msg.append(f"Plataformas extras: {extra}")
            raise ValueError("; ".join(error_msg))
        
        return v


# ===== CALENDAR MODELS =====

class CalendarQuery(BaseModel):
    """
    Parâmetros de query para filtrar posts agendados no calendário.
    
    Validates: Requirement 8.5
    """
    start_date: Optional[datetime] = Field(
        None,
        description="Data inicial do período de busca (ISO 8601)"
    )
    end_date: Optional[datetime] = Field(
        None,
        description="Data final do período de busca (ISO 8601)"
    )
    platform: Optional[SocialPlatform] = Field(
        None,
        description="Filtrar por plataforma específica"
    )
    status: Optional[str] = Field(
        None,
        pattern="^(scheduled|published|cancelled)$",
        description="Filtrar por status do post"
    )
    
    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v: Optional[datetime], info) -> Optional[datetime]:
        """Valida que end_date é posterior a start_date."""
        if v is not None and info.data.get('start_date') is not None:
            if v < info.data['start_date']:
                raise ValueError("end_date deve ser posterior a start_date")
        return v


class CalendarPost(BaseModel):
    """
    Representação completa de um post agendado no calendário.
    
    Validates: Requirement 8.6
    """
    id: str = Field(
        ...,
        description="ID único do post",
        min_length=1
    )
    content: str = Field(
        ...,
        description="Conteúdo/descrição do post",
        min_length=1,
        max_length=10000
    )
    platform: SocialPlatform = Field(
        ...,
        description="Plataforma onde o post será publicado"
    )
    scheduled_at: datetime = Field(
        ...,
        description="Data e hora agendada para publicação (ISO 8601)"
    )
    status: str = Field(
        ...,
        pattern="^(scheduled|published|cancelled)$",
        description="Status atual do post"
    )
    thumbnail_url: Optional[str] = Field(
        None,
        description="URL da thumbnail do vídeo (se aplicável)",
        min_length=1,
        max_length=2048
    )
    metricool_post_id: Optional[str] = Field(
        None,
        description="ID do post no Metricool para sincronização",
        min_length=1,
        max_length=255
    )
    created_at: datetime = Field(
        ...,
        description="Data e hora de criação do post (ISO 8601)"
    )
    cancelled_at: Optional[datetime] = Field(
        None,
        description="Data e hora de cancelamento do post (ISO 8601)"
    )
    
    @field_validator('thumbnail_url')
    @classmethod
    def validate_thumbnail_url(cls, v: Optional[str]) -> Optional[str]:
        """Valida que thumbnail_url começa com https:// se fornecida."""
        if v is not None and not v.startswith('https://'):
            raise ValueError("thumbnail_url deve começar com https://")
        return v


class CalendarResponse(BaseModel):
    """
    Resposta com lista de posts agendados e total de resultados.
    
    Validates: Requirement 8.7
    """
    posts: List[CalendarPost] = Field(
        ...,
        description="Lista de posts agendados"
    )
    total: int = Field(
        ...,
        ge=0,
        description="Total de posts que correspondem aos filtros"
    )
    
    @field_validator('total')
    @classmethod
    def validate_total_matches_posts(cls, v: int, info) -> int:
        """Valida que o total corresponde ao número de posts retornados."""
        posts = info.data.get('posts', [])
        if v < len(posts):
            raise ValueError(f"total ({v}) não pode ser menor que o número de posts retornados ({len(posts)})")
        return v


class RescheduleRequest(BaseModel):
    """
    Request para reagendar um post existente.
    
    Validates: Requirement 8.8
    """
    scheduled_at: datetime = Field(
        ...,
        description="Nova data e hora para publicação (ISO 8601)"
    )
    
    @field_validator('scheduled_at')
    @classmethod
    def validate_future_date(cls, v: datetime) -> datetime:
        """Valida que a data de agendamento é futura."""
        if v <= datetime.now():
            raise ValueError("scheduled_at deve ser uma data futura")
        return v


# ===== DASHBOARD MODELS =====

class DashboardStats(BaseModel):
    """
    Estatísticas agregadas para exibição no dashboard.
    
    Validates: Requirement 8.9
    """
    videos_total: int = Field(
        ...,
        ge=0,
        description="Total de vídeos gerados"
    )
    posts_scheduled_month: int = Field(
        ...,
        ge=0,
        description="Posts agendados no mês atual"
    )
    posts_published_month: int = Field(
        ...,
        ge=0,
        description="Posts publicados no mês atual"
    )
    engagement_total: int = Field(
        ...,
        ge=0,
        description="Engajamento total (likes + comentários + compartilhamentos)"
    )
    connected_platforms: List[SocialPlatform] = Field(
        ...,
        description="Lista de plataformas conectadas",
        max_length=6
    )
    
    @field_validator('connected_platforms')
    @classmethod
    def validate_unique_platforms(cls, v: List[SocialPlatform]) -> List[SocialPlatform]:
        """Valida que não há plataformas duplicadas."""
        if len(v) != len(set(v)):
            raise ValueError("connected_platforms não pode conter duplicatas")
        return v
