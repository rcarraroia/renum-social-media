"""
Analytics Service - Coleta e cache de métricas de desempenho

Este serviço implementa coleta de métricas via MetricoolService com estratégia
de cache em memória para otimizar performance e respeitar rate limits.

Cache Strategy:
- TTL padrão: 20 minutos
- Fallback: Usa cache expirado quando API falha (rate limit)
- Estrutura: Dict[str, CacheEntry] em memória
"""
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
from dataclasses import dataclass
from app.services.metricool import (
    MetricoolService,
    MetricoolAPIError,
    MetricoolRateLimitError,
    MetricoolAuthError,
    MetricoolNotFoundError
)
from app.utils.logger import get_logger

logger = get_logger("analytics")


# Exceções customizadas do Analytics
class AnalyticsError(Exception):
    """Erro base do Analytics Service"""
    def __init__(self, message: str, user_message: str = None):
        self.message = message
        self.user_message = user_message or message
        super().__init__(self.message)


class AnalyticsDataUnavailableError(AnalyticsError):
    """Dados não disponíveis (sem cache e API falhou)"""
    pass


# Estruturas de dados
@dataclass
class CacheEntry:
    """Entrada do cache com dados e metadados"""
    data: Any
    timestamp: datetime
    ttl_minutes: int


@dataclass
class MetricPoint:
    """Ponto de métrica para evolução temporal"""
    date: date
    reach: int
    engagement: int
    followers: int


@dataclass
class DashboardMetrics:
    """Métricas agregadas para dashboard"""
    total_reach: int
    total_impressions: int
    total_engagement: int
    engagement_rate: float
    total_likes: int
    total_comments: int
    total_shares: int
    total_saves: int
    total_followers: int
    followers_gained: int
    followers_lost: int
    net_followers: int
    reach_change_percent: float
    engagement_change_percent: float
    followers_change_percent: float
    period_start: date
    period_end: date
    evolution_data: List[MetricPoint]


@dataclass
class PostPerformance:
    """Performance individual de um post"""
    post_id: str
    platform: str
    published_at: datetime
    content_preview: str
    reach: int
    likes: int
    comments: int
    shares: int
    engagement_rate: float
    post_url: Optional[str] = None


@dataclass
class BestTime:
    """Melhor horário para publicação"""
    hour: int
    day_of_week: int
    avg_engagement: float
    sample_size: int


@dataclass
class PlatformMetrics:
    """Métricas agregadas por plataforma"""
    platform: str
    reach: int
    engagement: int
    followers: int
    posts_count: int
    contribution_percent: float


class AnalyticsService:
    """
    Serviço de Analytics com cache inteligente
    
    Responsabilidades:
    - Coletar métricas via MetricoolService
    - Implementar cache com TTL
    - Calcular métricas derivadas
    - Fallback quando API falha
    """
    
    def __init__(self):
        """Inicializa o serviço com cache vazio"""
        self._cache: Dict[str, CacheEntry] = {}
        self._metricool = MetricoolService()
        self._logger = get_logger("analytics")
        self._logger.info("AnalyticsService initialized")
    
    async def __aenter__(self):
        """Context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - fecha o MetricoolService"""
        await self._metricool.__aexit__(exc_type, exc_val, exc_tb)
    
    # Métodos auxiliares de cache
    
    def _get_from_cache(self, key: str) -> Optional[Any]:
        """
        Busca dados do cache se válidos
        
        Args:
            key: Chave do cache
            
        Returns:
            Dados do cache ou None se inválido/ausente
        """
        if key not in self._cache:
            self._logger.debug(f"Cache miss: {key}")
            return None
        
        entry = self._cache[key]
        if self._is_cache_valid(entry):
            self._logger.debug(f"Cache hit: {key}")
            return entry.data
        
        self._logger.debug(f"Cache expired: {key}")
        return None
    
    def _set_cache(self, key: str, data: Any, ttl_minutes: int = 20):
        """
        Armazena dados no cache com TTL
        
        Args:
            key: Chave do cache
            data: Dados a armazenar
            ttl_minutes: Tempo de vida em minutos (padrão: 20)
        """
        entry = CacheEntry(
            data=data,
            timestamp=datetime.now(),
            ttl_minutes=ttl_minutes
        )
        self._cache[key] = entry
        self._logger.debug(f"Cache set: {key} (TTL: {ttl_minutes}min)")
    
    def _is_cache_valid(self, entry: CacheEntry) -> bool:
        """
        Verifica se entrada do cache ainda é válida
        
        Args:
            entry: Entrada do cache
            
        Returns:
            True se válida, False se expirada
        """
        age_minutes = (datetime.now() - entry.timestamp).total_seconds() / 60
        return age_minutes < entry.ttl_minutes
    
    def _handle_metricool_error(self, error: Exception, cache_key: str, operation: str) -> Any:
        """
        Trata erros da API Metricool com fallback para cache expirado
        
        Args:
            error: Exceção capturada
            cache_key: Chave do cache para fallback
            operation: Nome da operação (para logging)
            
        Returns:
            Dados do cache expirado se disponível
            
        Raises:
            AnalyticsDataUnavailableError: Se não há cache disponível
        """
        # Determinar mensagem amigável baseada no tipo de erro
        if isinstance(error, MetricoolRateLimitError):
            user_message = (
                "O limite de requisições foi atingido. "
                "Aguarde alguns minutos e tente novamente."
            )
            self._logger.warning(
                f"Rate limit hit during {operation}",
                extra={"retry_after": error.retry_after}
            )
        elif isinstance(error, MetricoolAuthError):
            user_message = (
                "Erro de autenticação com Metricool. "
                "Verifique as credenciais nas configurações."
            )
            self._logger.error(f"Auth error during {operation}")
        elif isinstance(error, MetricoolNotFoundError):
            user_message = (
                "Dados não encontrados. "
                "Verifique se a conta está conectada corretamente."
            )
            self._logger.warning(f"Resource not found during {operation}")
        elif isinstance(error, httpx.TimeoutException):
            user_message = (
                "Tempo limite de conexão excedido. "
                "Verifique sua conexão com a internet."
            )
            self._logger.error(f"Timeout during {operation}")
        elif isinstance(error, httpx.NetworkError):
            user_message = (
                "Erro de rede ao conectar com Metricool. "
                "Verifique sua conexão com a internet."
            )
            self._logger.error(f"Network error during {operation}")
        else:
            user_message = (
                "Erro ao buscar dados do Metricool. "
                "Tente novamente em alguns instantes."
            )
            self._logger.error(
                f"Unexpected error during {operation}: {error}",
                exc_info=True
            )
        
        # Tentar usar cache expirado como fallback
        if cache_key in self._cache:
            self._logger.warning(
                f"Using expired cache as fallback for {operation}",
                extra={"cache_key": cache_key}
            )
            return self._cache[cache_key].data
        
        # Sem cache disponível - lançar erro
        raise AnalyticsDataUnavailableError(
            message=f"Failed to {operation} and no cache available",
            user_message=user_message
        )
    
    # Métodos principais (a serem implementados nas próximas sub-tasks)
    
    async def get_dashboard_metrics(
        self, 
        org_id: str, 
        blog_id: int
    ) -> DashboardMetrics:
        """
        Retorna métricas agregadas para dashboard

        Args:
            org_id: ID da organização
            blog_id: ID do blog no Metricool

        Returns:
            Métricas agregadas dos últimos 30 dias
        """
        cache_key = f"dashboard_{org_id}_{blog_id}"

        # Tentar buscar do cache
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data

        try:
            # Calcular período (últimos 30 dias)
            end_date = date.today()
            start_date = end_date - timedelta(days=30)

            # Período anterior para comparação
            prev_end_date = start_date - timedelta(days=1)
            prev_start_date = prev_end_date - timedelta(days=30)

            # Métricas a buscar
            metrics = [
                "reach", "impressions", "engagement", "likes", 
                "comments", "shares", "saves", "followers"
            ]

            # Plataformas suportadas
            platforms = ["instagram", "facebook", "tiktok", "linkedin", "youtube", "twitter"]

            # Buscar métricas atuais de todas as plataformas
            current_totals = {
                "reach": 0, "impressions": 0, "engagement": 0,
                "likes": 0, "comments": 0, "shares": 0, "saves": 0,
                "followers": 0, "followers_gained": 0, "followers_lost": 0
            }

            previous_totals = {
                "reach": 0, "engagement": 0, "followers": 0
            }

            evolution_data_dict: Dict[str, Dict[str, int]] = {}

            for platform in platforms:
                try:
                    # Buscar métricas do período atual
                    current_data = await self._metricool.get_analytics(
                        blog_id=blog_id,
                        start_date=start_date.strftime("%Y-%m-%d"),
                        end_date=end_date.strftime("%Y-%m-%d"),
                        network=platform,
                        metrics=metrics,
                        timezone="America/Sao_Paulo",
                        organization_id=org_id
                    )

                    # Agregar métricas
                    if current_data and isinstance(current_data, dict):
                        for metric in metrics:
                            if metric in current_data:
                                value = current_data[metric]
                                if isinstance(value, (int, float)):
                                    current_totals[metric] = current_totals.get(metric, 0) + int(value)

                        # Dados de evolução temporal (se disponível)
                        if "timeline" in current_data:
                            for point in current_data["timeline"]:
                                point_date = point.get("date")
                                if point_date:
                                    if point_date not in evolution_data_dict:
                                        evolution_data_dict[point_date] = {
                                            "reach": 0, "engagement": 0, "followers": 0
                                        }
                                    evolution_data_dict[point_date]["reach"] += point.get("reach", 0)
                                    evolution_data_dict[point_date]["engagement"] += point.get("engagement", 0)
                                    evolution_data_dict[point_date]["followers"] += point.get("followers", 0)

                    # Buscar métricas do período anterior para comparação
                    previous_data = await self._metricool.get_analytics(
                        blog_id=blog_id,
                        start_date=prev_start_date.strftime("%Y-%m-%d"),
                        end_date=prev_end_date.strftime("%Y-%m-%d"),
                        network=platform,
                        metrics=["reach", "engagement", "followers"],
                        timezone="America/Sao_Paulo",
                        organization_id=org_id
                    )

                    if previous_data and isinstance(previous_data, dict):
                        for metric in ["reach", "engagement", "followers"]:
                            if metric in previous_data:
                                value = previous_data[metric]
                                if isinstance(value, (int, float)):
                                    previous_totals[metric] += int(value)

                except Exception as e:
                    self._logger.warning(f"Failed to get analytics for {platform}: {e}")
                    continue

            # Calcular variações percentuais
            reach_change = self._calculate_percent_change(
                previous_totals["reach"], 
                current_totals["reach"]
            )
            engagement_change = self._calculate_percent_change(
                previous_totals["engagement"], 
                current_totals["engagement"]
            )
            followers_change = self._calculate_percent_change(
                previous_totals["followers"], 
                current_totals["followers"]
            )

            # Calcular engagement rate
            engagement_rate = 0.0
            if current_totals["reach"] > 0:
                engagement_rate = (current_totals["engagement"] / current_totals["reach"]) * 100

            # Calcular net followers
            net_followers = current_totals["followers_gained"] - current_totals["followers_lost"]

            # Converter evolution_data_dict para lista de MetricPoint
            evolution_data = [
                MetricPoint(
                    date=datetime.strptime(date_str, "%Y-%m-%d").date(),
                    reach=data["reach"],
                    engagement=data["engagement"],
                    followers=data["followers"]
                )
                for date_str, data in sorted(evolution_data_dict.items())
            ]

            # Criar objeto de resposta
            metrics_obj = DashboardMetrics(
                total_reach=current_totals["reach"],
                total_impressions=current_totals["impressions"],
                total_engagement=current_totals["engagement"],
                engagement_rate=round(engagement_rate, 2),
                total_likes=current_totals["likes"],
                total_comments=current_totals["comments"],
                total_shares=current_totals["shares"],
                total_saves=current_totals["saves"],
                total_followers=current_totals["followers"],
                followers_gained=current_totals["followers_gained"],
                followers_lost=current_totals["followers_lost"],
                net_followers=net_followers,
                reach_change_percent=reach_change,
                engagement_change_percent=engagement_change,
                followers_change_percent=followers_change,
                period_start=start_date,
                period_end=end_date,
                evolution_data=evolution_data
            )

            # Armazenar no cache (20 minutos)
            self._set_cache(cache_key, metrics_obj, ttl_minutes=20)

            self._logger.info(
                f"Dashboard metrics calculated successfully",
                extra={
                    "organization_id": org_id,
                    "blog_id": blog_id,
                    "total_reach": metrics_obj.total_reach,
                    "total_engagement": metrics_obj.total_engagement
                }
            )

            return metrics_obj

        except Exception as e:
            # Usar handler centralizado de erros
            return self._handle_metricool_error(
                error=e,
                cache_key=cache_key,
                operation="get dashboard metrics"
            )

    def _calculate_percent_change(self, old_value: int, new_value: int) -> float:
        """
        Calcula variação percentual entre dois valores

        Args:
            old_value: Valor anterior
            new_value: Valor novo

        Returns:
            Variação percentual (ex: 15.5 para aumento de 15.5%)
        """
        if old_value == 0:
            return 100.0 if new_value > 0 else 0.0

        change = ((new_value - old_value) / old_value) * 100
        return round(change, 2)

    
    async def get_posts_performance(
        self,
        org_id: str,
        blog_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        platform: Optional[str] = None,
        sort_by: str = "published_at",
        order: str = "desc"
    ) -> List[PostPerformance]:
        """
        Retorna performance individual de posts
        
        Args:
            org_id: ID da organização
            blog_id: ID do blog no Metricool
            start_date: Data inicial (opcional, padrão: últimos 30 dias)
            end_date: Data final (opcional, padrão: hoje)
            platform: Filtro de plataforma (opcional)
            sort_by: Campo para ordenação (published_at, reach, engagement_rate, etc.)
            order: Ordem (asc/desc)
            
        Returns:
            Lista de posts com métricas ordenada
        """
        # Definir período padrão se não fornecido
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Criar chave de cache incluindo filtros
        cache_key = f"posts_{org_id}_{blog_id}_{start_date}_{end_date}_{platform or 'all'}_{sort_by}_{order}"

        # Tentar buscar do cache
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data

        try:
            # Plataformas a buscar
            platforms_to_fetch = [platform] if platform else [
                "instagram", "facebook", "tiktok", "linkedin", "youtube", "twitter"
            ]

            all_posts: List[PostPerformance] = []

            for plat in platforms_to_fetch:
                try:
                    # Buscar posts da plataforma
                    posts_data = await self._metricool.get_posts(
                        blog_id=blog_id,
                        start_date=start_date.strftime("%Y-%m-%d"),
                        end_date=end_date.strftime("%Y-%m-%d"),
                        network=plat,
                        organization_id=org_id
                    )

                    if not posts_data or not isinstance(posts_data, list):
                        continue

                    # Processar cada post
                    for post in posts_data:
                        if not isinstance(post, dict):
                            continue

                        # Extrair métricas
                        reach = post.get("reach", 0) or 0
                        likes = post.get("likes", 0) or 0
                        comments = post.get("comments", 0) or 0
                        shares = post.get("shares", 0) or 0
                        
                        # Calcular engagement total
                        engagement = likes + comments + shares
                        
                        # Calcular engagement rate
                        engagement_rate = 0.0
                        if reach > 0:
                            engagement_rate = (engagement / reach) * 100

                        # Extrair data de publicação
                        published_at_str = post.get("published_at") or post.get("date")
                        published_at = datetime.now()
                        if published_at_str:
                            try:
                                published_at = datetime.fromisoformat(published_at_str.replace("Z", "+00:00"))
                            except:
                                pass

                        # Extrair preview do conteúdo (primeiros 100 caracteres)
                        content = post.get("text") or post.get("content") or ""
                        content_preview = content[:100] + "..." if len(content) > 100 else content

                        # Criar objeto PostPerformance
                        post_obj = PostPerformance(
                            post_id=str(post.get("id", "")),
                            platform=plat,
                            published_at=published_at,
                            content_preview=content_preview,
                            reach=reach,
                            likes=likes,
                            comments=comments,
                            shares=shares,
                            engagement_rate=round(engagement_rate, 2),
                            post_url=post.get("url")
                        )

                        all_posts.append(post_obj)

                except Exception as e:
                    self._logger.warning(f"Failed to get posts for {plat}: {e}")
                    continue

            # Ordenar posts
            reverse = (order.lower() == "desc")
            
            # Mapear campos de ordenação
            sort_field_map = {
                "published_at": lambda p: p.published_at,
                "reach": lambda p: p.reach,
                "likes": lambda p: p.likes,
                "comments": lambda p: p.comments,
                "shares": lambda p: p.shares,
                "engagement_rate": lambda p: p.engagement_rate,
            }

            sort_func = sort_field_map.get(sort_by, lambda p: p.published_at)
            all_posts.sort(key=sort_func, reverse=reverse)

            # Armazenar no cache (15 minutos - menor que dashboard pois dados mudam mais)
            self._set_cache(cache_key, all_posts, ttl_minutes=15)

            self._logger.info(
                f"Posts performance retrieved successfully",
                extra={
                    "organization_id": org_id,
                    "blog_id": blog_id,
                    "platform": platform or "all",
                    "posts_count": len(all_posts),
                    "date_range": f"{start_date} to {end_date}"
                }
            )

            return all_posts

        except Exception as e:
            # Usar handler centralizado de erros
            return self._handle_metricool_error(
                error=e,
                cache_key=cache_key,
                operation="get posts performance"
            )
    
    async def get_best_times(
        self,
        org_id: str,
        blog_id: int,
        platform: Optional[str] = None
    ) -> Dict[str, List[BestTime]]:
        """
        Retorna melhores horários por plataforma
        
        Analisa posts dos últimos 90 dias e calcula engagement médio por hora/dia.
        Se dados insuficientes (< 10 posts), retorna horários default para Brasil.
        
        Args:
            org_id: ID da organização
            blog_id: ID do blog no Metricool
            platform: Filtro de plataforma (opcional)
            
        Returns:
            Dict com plataforma -> lista de top 3 melhores horários
        """
        cache_key = f"best_times_{org_id}_{blog_id}_{platform or 'all'}"

        # Tentar buscar do cache
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data

        try:
            # Período de análise: últimos 90 dias
            end_date = date.today()
            start_date = end_date - timedelta(days=90)

            # Plataformas a analisar
            platforms_to_analyze = [platform] if platform else [
                "instagram", "facebook", "tiktok", "linkedin", "youtube", "twitter"
            ]

            result: Dict[str, List[BestTime]] = {}

            for plat in platforms_to_analyze:
                try:
                    # Buscar posts dos últimos 90 dias
                    posts_data = await self._metricool.get_posts(
                        blog_id=blog_id,
                        start_date=start_date.strftime("%Y-%m-%d"),
                        end_date=end_date.strftime("%Y-%m-%d"),
                        network=plat,
                        organization_id=org_id
                    )

                    if not posts_data or not isinstance(posts_data, list):
                        # Usar fallback
                        result[plat] = self._get_default_best_times(plat)
                        continue

                    # Se menos de 10 posts, usar fallback
                    if len(posts_data) < 10:
                        self._logger.info(f"Insufficient data for {plat} ({len(posts_data)} posts), using defaults")
                        result[plat] = self._get_default_best_times(plat)
                        continue

                    # Agrupar por hora e dia da semana
                    engagement_by_time: Dict[tuple, list] = {}

                    for post in posts_data:
                        if not isinstance(post, dict):
                            continue

                        # Extrair timestamp
                        published_at_str = post.get("published_at") or post.get("date")
                        if not published_at_str:
                            continue

                        try:
                            published_at = datetime.fromisoformat(published_at_str.replace("Z", "+00:00"))
                        except:
                            continue

                        # Extrair hora e dia da semana
                        hour = published_at.hour
                        day_of_week = published_at.weekday()  # 0=Monday, 6=Sunday

                        # Calcular engagement
                        likes = post.get("likes", 0) or 0
                        comments = post.get("comments", 0) or 0
                        shares = post.get("shares", 0) or 0
                        engagement = likes + comments + shares

                        # Agrupar
                        key = (hour, day_of_week)
                        if key not in engagement_by_time:
                            engagement_by_time[key] = []
                        engagement_by_time[key].append(engagement)

                    # Calcular médias
                    best_times_list: List[BestTime] = []
                    for (hour, day_of_week), engagements in engagement_by_time.items():
                        avg_engagement = sum(engagements) / len(engagements)
                        best_times_list.append(
                            BestTime(
                                hour=hour,
                                day_of_week=day_of_week,
                                avg_engagement=round(avg_engagement, 2),
                                sample_size=len(engagements)
                            )
                        )

                    # Ordenar por engagement médio e pegar top 3
                    best_times_list.sort(key=lambda bt: bt.avg_engagement, reverse=True)
                    result[plat] = best_times_list[:3]

                    self._logger.info(
                        f"Best times calculated for {plat}",
                        extra={
                            "platform": plat,
                            "posts_analyzed": len(posts_data),
                            "top_hour": best_times_list[0].hour if best_times_list else None
                        }
                    )

                except Exception as e:
                    self._logger.warning(f"Failed to calculate best times for {plat}: {e}")
                    # Usar fallback em caso de erro
                    result[plat] = self._get_default_best_times(plat)

            # Armazenar no cache (60 minutos - dados mudam lentamente)
            self._set_cache(cache_key, result, ttl_minutes=60)

            return result

        except Exception as e:
            # Usar handler centralizado de erros
            return self._handle_metricool_error(
                error=e,
                cache_key=cache_key,
                operation="get best times"
            )

    def _get_default_best_times(self, platform: str) -> List[BestTime]:
        """
        Retorna horários default baseados em pesquisa de mercado brasileiro
        
        Args:
            platform: Nome da plataforma
            
        Returns:
            Lista de 3 melhores horários default
        """
        # Horários default por plataforma (baseado em estudos de mercado BR)
        defaults = {
            "instagram": [
                BestTime(hour=11, day_of_week=1, avg_engagement=100.0, sample_size=0),  # Ter 11h
                BestTime(hour=18, day_of_week=2, avg_engagement=95.0, sample_size=0),   # Qua 18h
                BestTime(hour=19, day_of_week=3, avg_engagement=90.0, sample_size=0),   # Qui 19h
            ],
            "tiktok": [
                BestTime(hour=12, day_of_week=1, avg_engagement=100.0, sample_size=0),  # Ter 12h
                BestTime(hour=19, day_of_week=3, avg_engagement=95.0, sample_size=0),   # Qui 19h
                BestTime(hour=20, day_of_week=4, avg_engagement=90.0, sample_size=0),   # Sex 20h
            ],
            "linkedin": [
                BestTime(hour=8, day_of_week=1, avg_engagement=100.0, sample_size=0),   # Ter 8h
                BestTime(hour=17, day_of_week=2, avg_engagement=95.0, sample_size=0),   # Qua 17h
                BestTime(hour=9, day_of_week=3, avg_engagement=90.0, sample_size=0),    # Qui 9h
            ],
            "facebook": [
                BestTime(hour=13, day_of_week=2, avg_engagement=100.0, sample_size=0),  # Qua 13h
                BestTime(hour=15, day_of_week=3, avg_engagement=95.0, sample_size=0),   # Qui 15h
                BestTime(hour=14, day_of_week=4, avg_engagement=90.0, sample_size=0),   # Sex 14h
            ],
            "twitter": [
                BestTime(hour=12, day_of_week=1, avg_engagement=100.0, sample_size=0),  # Ter 12h
                BestTime(hour=17, day_of_week=2, avg_engagement=95.0, sample_size=0),   # Qua 17h
                BestTime(hour=13, day_of_week=4, avg_engagement=90.0, sample_size=0),   # Sex 13h
            ],
            "youtube": [
                BestTime(hour=14, day_of_week=3, avg_engagement=100.0, sample_size=0),  # Qui 14h
                BestTime(hour=16, day_of_week=4, avg_engagement=95.0, sample_size=0),   # Sex 16h
                BestTime(hour=15, day_of_week=5, avg_engagement=90.0, sample_size=0),   # Sáb 15h
            ],
        }

        return defaults.get(platform, [
            BestTime(hour=12, day_of_week=2, avg_engagement=100.0, sample_size=0),
            BestTime(hour=18, day_of_week=3, avg_engagement=95.0, sample_size=0),
            BestTime(hour=20, day_of_week=4, avg_engagement=90.0, sample_size=0),
        ])
    
    async def get_platform_breakdown(
        self,
        org_id: str,
        blog_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[PlatformMetrics]:
        """
        Retorna breakdown de métricas por plataforma
        
        Args:
            org_id: ID da organização
            blog_id: ID do blog no Metricool
            start_date: Data inicial (opcional, padrão: últimos 30 dias)
            end_date: Data final (opcional, padrão: hoje)
            
        Returns:
            Lista de métricas por plataforma com percentual de contribuição
        """
        # Definir período padrão se não fornecido
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        cache_key = f"platform_breakdown_{org_id}_{blog_id}_{start_date}_{end_date}"

        # Tentar buscar do cache
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data

        try:
            platforms = ["instagram", "facebook", "tiktok", "linkedin", "youtube", "twitter"]
            
            platform_data: List[PlatformMetrics] = []
            total_reach = 0
            total_engagement = 0

            # Buscar métricas de cada plataforma
            for plat in platforms:
                try:
                    # Buscar analytics da plataforma
                    analytics = await self._metricool.get_analytics(
                        blog_id=blog_id,
                        start_date=start_date.strftime("%Y-%m-%d"),
                        end_date=end_date.strftime("%Y-%m-%d"),
                        network=plat,
                        metrics=["reach", "engagement", "followers"],
                        timezone="America/Sao_Paulo",
                        organization_id=org_id
                    )

                    if not analytics or not isinstance(analytics, dict):
                        continue

                    reach = analytics.get("reach", 0) or 0
                    engagement = analytics.get("engagement", 0) or 0
                    followers = analytics.get("followers", 0) or 0

                    # Buscar contagem de posts
                    posts = await self._metricool.get_posts(
                        blog_id=blog_id,
                        start_date=start_date.strftime("%Y-%m-%d"),
                        end_date=end_date.strftime("%Y-%m-%d"),
                        network=plat,
                        organization_id=org_id
                    )

                    posts_count = len(posts) if posts and isinstance(posts, list) else 0

                    # Acumular totais para cálculo de percentual
                    total_reach += reach
                    total_engagement += engagement

                    # Criar objeto (percentual será calculado depois)
                    platform_data.append(
                        PlatformMetrics(
                            platform=plat,
                            reach=reach,
                            engagement=engagement,
                            followers=followers,
                            posts_count=posts_count,
                            contribution_percent=0.0  # Será calculado abaixo
                        )
                    )

                except Exception as e:
                    self._logger.warning(f"Failed to get breakdown for {plat}: {e}")
                    continue

            # Calcular percentuais de contribuição (baseado em reach)
            for platform_metrics in platform_data:
                if total_reach > 0:
                    contribution = (platform_metrics.reach / total_reach) * 100
                    platform_metrics.contribution_percent = round(contribution, 2)

            # Ordenar por reach (maior primeiro)
            platform_data.sort(key=lambda p: p.reach, reverse=True)

            # Armazenar no cache (20 minutos)
            self._set_cache(cache_key, platform_data, ttl_minutes=20)

            self._logger.info(
                f"Platform breakdown calculated successfully",
                extra={
                    "organization_id": org_id,
                    "blog_id": blog_id,
                    "platforms_count": len(platform_data),
                    "total_reach": total_reach,
                    "date_range": f"{start_date} to {end_date}"
                }
            )

            return platform_data

        except Exception as e:
            # Usar handler centralizado de erros
            return self._handle_metricool_error(
                error=e,
                cache_key=cache_key,
                operation="get platform breakdown"
            )
