"""
Metricool Service - Integração com API REST do Metricool

Este serviço implementa a integração com a API REST do Metricool usando httpx.
A documentação completa das ferramentas MCP está em: backend/docs/METRICOOL_MCP_TOOLS.md

API Base URL: https://app.metricool.com/api
Autenticação: Header X-Mc-Auth com userToken + parâmetros userId e blogId

IMPORTANTE: As credenciais do Metricool são a nível de sistema (METRICOOL_USER_TOKEN e 
METRICOOL_USER_ID do .env). Cada organização é identificada pelo blogId (marca dentro do Metricool).
"""
import httpx
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("metricool")


# Exceções customizadas
class MetricoolAPIError(Exception):
    """Erro genérico da API do Metricool"""
    def __init__(self, message: str, status_code: int = None, response_data: Any = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class MetricoolAuthError(MetricoolAPIError):
    """Erro de autenticação com Metricool"""
    pass


class MetricoolRateLimitError(MetricoolAPIError):
    """Rate limit atingido"""
    def __init__(self, message: str, retry_after: int = 60):
        self.retry_after = retry_after
        super().__init__(message, status_code=429)


class MetricoolNotFoundError(MetricoolAPIError):
    """Recurso não encontrado"""
    def __init__(self, message: str):
        super().__init__(message, status_code=404)

class MetricoolService:
    """
    Serviço de integração com Metricool via API REST
    
    Autenticação:
    - Header: X-Mc-Auth = userToken (do config)
    - Query params: userId (do config), blogId (por organização)
    
    Cada organização é identificada pelo blogId (marca no Metricool).
    """
    
    BASE_URL = "https://app.metricool.com/api"
    
    def __init__(self):
        """
        Inicializa o serviço Metricool com credenciais do sistema
        
        As credenciais são carregadas do config (METRICOOL_USER_TOKEN e METRICOOL_USER_ID).
        O blogId é passado nos métodos individuais para identificar a organização.
        """
        self.user_token = settings.metricool_user_token
        self.user_id = settings.metricool_user_id
        self.client = httpx.AsyncClient(timeout=30.0)
        
        if not self.user_token or not self.user_id:
            logger.warning("MetricoolService initialized without credentials in config")
    
    async def __aenter__(self):
        """Context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - fecha o client"""
        await self.client.aclose()
    
    def _validate_credentials(self):
        """Valida se as credenciais estão configuradas"""
        if not self.user_token or not self.user_id:
            raise MetricoolAuthError("Metricool credentials not configured in system settings")
    
    def _get_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições"""
        return {
            "X-Mc-Auth": self.user_token,
            "Content-Type": "application/json"
        }
    
    def _validate_text_length(self, platform: str, text: str):
        """Valida comprimento do texto por plataforma"""
        limits = {
            "bluesky": 300,
            "x": 280,
            "twitter": 280,
            "instagram": 2200,
            "tiktok": 2200,
            "facebook": 2200,
            "linkedin": 3000,
            "youtube": 5000
        }
        
        limit = limits.get(platform.lower())
        if limit and len(text) > limit:
            raise ValueError(f"Text exceeds {platform} limit of {limit} characters")
    
    async def get_brands(self, organization_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Obtém lista de marcas (brands) da conta Metricool
        
        Endpoint: GET /admin/simpleProfiles
        
        Args:
            organization_id: ID da organização (para logging)
        
        Returns:
            Lista de brands com id, name, timezone, networks
        """
        self._validate_credentials()
        
        logger.info(
            "Getting brands from Metricool",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "get_brands"
            }
        )
        
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/admin/simpleProfiles",
                headers=self._get_headers(),
                params={
                    "userId": self.user_id,
                    "blogId": self.user_id  # Para listar brands, blogId = userId
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # A API retorna diferentes formatos, normalizar
            if isinstance(data, list):
                brands = data
            elif isinstance(data, dict) and "brands" in data:
                brands = data["brands"]
            elif isinstance(data, dict) and "data" in data:
                brands = data["data"]
            else:
                logger.warning(
                    f"Unexpected brands response format: {type(data)}",
                    extra={"organization_id": organization_id}
                )
                brands = []
            
            logger.info(
                f"Successfully retrieved {len(brands)} brands",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_brands",
                    "brands_count": len(brands)
                }
            )
            
            return brands
                    
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error getting brands: {e.response.status_code} - {e.response.text}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_brands",
                    "status_code": e.response.status_code
                },
                exc_info=True
            )
            
            if e.response.status_code == 401:
                raise MetricoolAuthError(f"Authentication failed: {e.response.status_code}")
            elif e.response.status_code == 429:
                raise MetricoolRateLimitError("Rate limit exceeded", retry_after=60)
            else:
                raise MetricoolAPIError(
                    f"Failed to get brands: {e.response.status_code}",
                    status_code=e.response.status_code,
                    response_data=e.response.text
                )
        except Exception as e:
            logger.error(
                f"Failed to get brands: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_brands"
                },
                exc_info=True
            )
            raise MetricoolAPIError(f"Unexpected error: {str(e)}")
    
    async def get_connected_accounts(
        self,
        blog_id: int,
        organization_id: Optional[str] = None
    ) -> Dict[str, List[str]]:
        """
        Obtém contas de redes sociais conectadas para um blog específico
        
        Args:
            blog_id: ID da marca no Metricool
            organization_id: ID da organização (para logging)
        
        Returns:
            Dict com nomes de plataformas como chaves e IDs de contas como valores
        """
        logger.info(
            f"Getting connected accounts for blog_id: {blog_id}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "get_connected_accounts",
                "blog_id": blog_id
            }
        )
        
        try:
            brands = await self.get_brands(organization_id)
            
            # Filtrar pelo blog_id específico
            brand = next((b for b in brands if b.get("id") == blog_id), None)
            
            if not brand:
                logger.warning(
                    f"Brand {blog_id} not found",
                    extra={
                        "organization_id": organization_id,
                        "service_module": "metricool",
                        "endpoint": "get_connected_accounts",
                        "blog_id": blog_id
                    }
                )
                return {}
            
            connected = {}
            networks = brand.get("networks", [])
            for network in networks:
                platform = network.get("network", "").lower()
                if platform not in connected:
                    connected[platform] = []
                
                network_id = network.get("id")
                if network_id and network_id not in connected[platform]:
                    connected[platform].append(network_id)
            
            logger.info(
                f"Found {len(connected)} connected platforms",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_connected_accounts",
                    "blog_id": blog_id,
                    "platforms": list(connected.keys())
                }
            )
            
            return connected
            
        except Exception as e:
            logger.error(
                f"Failed to get connected accounts: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_connected_accounts",
                    "blog_id": blog_id
                },
                exc_info=True
            )
            return {}
    
    async def schedule_post(
        self,
        blog_id: int,
        platform: str,
        text: str,
        media_url: Optional[str] = None,
        scheduled_at: str = None,
        timezone: str = "UTC",
        organization_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Agenda um post em uma plataforma de rede social via Metricool
        
        Endpoint: POST /posts
        
        Args:
            blog_id: ID da marca no Metricool
            platform: Nome da plataforma (linkedin, instagram, facebook, x, tiktok, youtube, pinterest)
            text: Texto/descrição do post
            media_url: URL do arquivo de mídia (vídeo/imagem)
            scheduled_at: Data/hora em formato ISO (YYYY-MM-DDTHH:MM:SS)
            timezone: Timezone (padrão: UTC)
            organization_id: ID da organização (para logging)
            **kwargs: Parâmetros específicos da plataforma
        
        Returns:
            Dict com post_id, external_post_id e status
        """
        self._validate_credentials()
        self._validate_text_length(platform, text)
        
        logger.info(
            f"Scheduling post for platform: {platform}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "schedule_post",
                "platform": platform,
                "blog_id": blog_id,
                "scheduled_at": scheduled_at
            }
        )
        
        try:
            # Mapear nomes de plataforma
            platform_map = {
                "linkedin": "linkedin",
                "instagram": "instagram",
                "facebook": "facebook",
                "x": "twitter",
                "twitter": "twitter",
                "tiktok": "tiktok",
                "youtube": "youtube",
                "pinterest": "pinterest",
                "threads": "threads",
                "bluesky": "bluesky"
            }
            
            network = platform_map.get(platform.lower(), platform.lower())
            
            # Construir payload do post
            post_data = {
                "autoPublish": True,
                "draft": False,
                "text": text,
                "providers": [{"network": network}],
                "publicationDate": {
                    "dateTime": scheduled_at,
                    "timezone": timezone
                },
                "media": [media_url] if media_url else [],
                "mediaAltText": [],
                "shortener": False,
                "smartLinkData": {"ids": []},
                "descendants": [],
                "firstCommentText": "",
                "hasNotReadNotes": False
            }
            
            # Adicionar dados específicos da rede
            network_data = self._build_network_data(network, text, media_url, **kwargs)
            if network_data:
                post_data.update(network_data)
            
            # Fazer requisição
            response = await self.client.post(
                f"{self.BASE_URL}/posts",
                headers=self._get_headers(),
                params={
                    "userId": self.user_id,
                    "blogId": blog_id
                },
                json={
                    "date": scheduled_at,
                    "blogId": blog_id,
                    "info": post_data
                },
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            
            post_id = result.get("id") or result.get("postId")
            
            logger.info(
                f"Post scheduled successfully with ID: {post_id}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "schedule_post",
                    "platform": platform,
                    "post_id": post_id
                }
            )
            
            return {
                "success": True,
                "post_id": post_id,
                "external_post_id": post_id,
                "status": "scheduled"
            }
                
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error scheduling post: {e.response.status_code} - {e.response.text}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "schedule_post",
                    "status_code": e.response.status_code,
                    "platform": platform
                },
                exc_info=True
            )
            
            if e.response.status_code == 401:
                raise MetricoolAuthError(f"Authentication failed: {e.response.status_code}")
            elif e.response.status_code == 429:
                raise MetricoolRateLimitError("Rate limit exceeded", retry_after=60)
            else:
                raise MetricoolAPIError(
                    f"Failed to schedule post: {e.response.status_code}",
                    status_code=e.response.status_code,
                    response_data=e.response.text
                )
        except Exception as e:
            logger.error(
                f"Failed to schedule post: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "schedule_post",
                    "platform": platform
                },
                exc_info=True
            )
            raise MetricoolAPIError(f"Unexpected error: {str(e)}")
    
    def _build_network_data(self, network: str, text: str, media_url: Optional[str], **kwargs) -> Dict[str, Any]:
        """Constrói dados específicos da rede"""
        network_data = {}
        
        if network == "instagram":
            network_data["instagramData"] = {
                "type": "REEL" if media_url else "POST",
                "collaborators": kwargs.get("collaborators", []),
                "carouselTags": kwargs.get("carousel_tags", {}),
                "showReelOnFeed": kwargs.get("show_reel_on_feed", True)
            }
        
        elif network == "facebook":
            network_data["facebookData"] = {
                "type": "REEL" if media_url else "POST",
                "title": kwargs.get("title", ""),
                "boost": kwargs.get("boost", 0),
                "boostPayer": kwargs.get("boost_payer", ""),
                "boostBeneficiary": kwargs.get("boost_beneficiary", "")
            }
        
        elif network == "twitter":
            network_data["twitterData"] = {
                "tags": kwargs.get("tags", [])
            }
        
        elif network == "tiktok":
            network_data["tiktokData"] = {
                "disableComment": kwargs.get("disable_comment", False),
                "disableDuet": kwargs.get("disable_duet", False),
                "disableStitch": kwargs.get("disable_stitch", False),
                "privacyOption": kwargs.get("privacy_option", "PUBLIC_TO_EVERYONE"),
                "commercialContentThirdParty": kwargs.get("commercial_third_party", False),
                "commercialContentOwnBrand": kwargs.get("commercial_own_brand", False),
                "title": text[:100],
                "autoAddMusic": kwargs.get("auto_add_music", False),
                "photoCoverIndex": kwargs.get("photo_cover_index", 0)
            }
        
        elif network == "youtube":
            network_data["youtubeData"] = {
                "title": kwargs.get("title", text[:100]),
                "type": kwargs.get("type", "video"),
                "privacy": kwargs.get("privacy", "public"),
                "tags": kwargs.get("tags", []),
                "madeForKids": kwargs.get("made_for_kids", False)
            }
        
        elif network == "linkedin":
            network_data["linkedinData"] = {
                "documentTitle": kwargs.get("document_title", ""),
                "publishImagesAsPDF": kwargs.get("publish_as_pdf", False),
                "previewIncluded": kwargs.get("preview_included", True),
                "type": kwargs.get("type", "post")
            }
        
        elif network == "pinterest":
            network_data["pinterestData"] = {
                "boardId": kwargs.get("board_id", ""),
                "pinTitle": text[:100],
                "pinLink": kwargs.get("pin_link", ""),
                "pinNewFormat": kwargs.get("pin_new_format", True)
            }
        
        elif network == "bluesky":
            network_data["blueskyData"] = {
                "postLanguages": kwargs.get("post_languages", ["pt", "en"])
            }
        
        elif network == "threads":
            network_data["threadsData"] = {
                "allowedCountryCodes": kwargs.get("allowed_countries", ["BR", "US"])
            }
        
        return network_data
    
    async def get_scheduled_posts(
        self,
        blog_id: int,
        start_date: str,
        end_date: str,
        timezone: str = "UTC",
        organization_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Obtém posts agendados para um período
        
        Endpoint: GET /posts/scheduled
        
        Args:
            blog_id: ID da marca no Metricool
            start_date: Data inicial (YYYY-MM-DD)
            end_date: Data final (YYYY-MM-DD)
            timezone: Timezone
            organization_id: ID da organização (para logging)
        
        Returns:
            Lista de posts agendados
        """
        self._validate_credentials()
        
        logger.info(
            f"Getting scheduled posts for blog_id: {blog_id}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "get_scheduled_posts",
                "blog_id": blog_id,
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/posts/scheduled",
                headers=self._get_headers(),
                params={
                    "userId": self.user_id,
                    "blogId": blog_id,
                    "start": start_date,
                    "end": end_date,
                    "timezone": timezone.replace("/", "%2F"),
                    "extendedRange": False
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if isinstance(data, list):
                posts = data
            elif isinstance(data, dict) and "posts" in data:
                posts = data["posts"]
            else:
                posts = []
            
            logger.info(
                f"Retrieved {len(posts)} scheduled posts",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_scheduled_posts",
                    "blog_id": blog_id,
                    "posts_count": len(posts)
                }
            )
            
            return posts
                    
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error getting scheduled posts: {e.response.status_code}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_scheduled_posts",
                    "status_code": e.response.status_code,
                    "blog_id": blog_id
                },
                exc_info=True
            )
            
            if e.response.status_code == 401:
                raise MetricoolAuthError(f"Authentication failed: {e.response.status_code}")
            elif e.response.status_code == 429:
                raise MetricoolRateLimitError("Rate limit exceeded", retry_after=60)
            else:
                return []
        except Exception as e:
            logger.error(
                f"Failed to get scheduled posts: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_scheduled_posts",
                    "blog_id": blog_id
                },
                exc_info=True
            )
            return []
    
    async def get_best_time_to_post(
        self,
        blog_id: int,
        platform: str,
        start_date: str,
        end_date: str,
        timezone: str = "UTC",
        organization_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Obtém melhores horários para postar
        
        Endpoint: GET /analytics/best-time
        
        Args:
            blog_id: ID da marca
            platform: Plataforma (twitter, facebook, instagram, linkedin, youtube, tiktok)
            start_date: Data inicial (YYYY-MM-DD)
            end_date: Data final (YYYY-MM-DD)
            timezone: Timezone
            organization_id: ID da organização (para logging)
        
        Returns:
            Lista de horários com valores de engajamento
        """
        self._validate_credentials()
        
        logger.info(
            f"Getting best time to post for {platform}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "get_best_time_to_post",
                "platform": platform,
                "blog_id": blog_id
            }
        )
        
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/analytics/best-time",
                headers=self._get_headers(),
                params={
                    "userId": self.user_id,
                    "blogId": blog_id,
                    "provider": platform.lower(),
                    "start": start_date,
                    "end": end_date,
                    "timezone": timezone.replace("/", "%2F")
                }
            )
            response.raise_for_status()
            result = response.json()
            
            logger.info(
                f"Retrieved best times for {platform}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_best_time_to_post",
                    "platform": platform
                }
            )
            
            return result
                
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error getting best time: {e.response.status_code}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_best_time_to_post",
                    "status_code": e.response.status_code,
                    "platform": platform
                },
                exc_info=True
            )
            
            if e.response.status_code == 401:
                raise MetricoolAuthError(f"Authentication failed: {e.response.status_code}")
            elif e.response.status_code == 429:
                raise MetricoolRateLimitError("Rate limit exceeded", retry_after=60)
            else:
                return []
        except Exception as e:
            logger.error(
                f"Failed to get best time to post: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_best_time_to_post",
                    "platform": platform
                },
                exc_info=True
            )
            return []
    
    async def cancel_scheduled_post(
        self,
        blog_id: int,
        post_id: str,
        organization_id: Optional[str] = None
    ) -> bool:
        """
        Cancela um post agendado
        
        Endpoint: DELETE /posts/{post_id}
        
        Args:
            blog_id: ID da marca no Metricool
            post_id: ID do post a cancelar
            organization_id: ID da organização (para logging)
        
        Returns:
            True se cancelado com sucesso, False caso contrário
        """
        self._validate_credentials()
        
        logger.info(
            f"Cancelling post {post_id}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "cancel_scheduled_post",
                "post_id": post_id,
                "blog_id": blog_id
            }
        )
        
        try:
            response = await self.client.delete(
                f"{self.BASE_URL}/posts/{post_id}",
                headers=self._get_headers(),
                params={
                    "userId": self.user_id,
                    "blogId": blog_id
                }
            )
            response.raise_for_status()
            
            logger.info(
                f"Post {post_id} cancelled successfully",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "cancel_scheduled_post",
                    "post_id": post_id
                }
            )
            
            return True
                
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error cancelling post: {e.response.status_code} - {e.response.text}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "cancel_scheduled_post",
                    "status_code": e.response.status_code,
                    "post_id": post_id
                },
                exc_info=True
            )
            
            if e.response.status_code == 401:
                raise MetricoolAuthError(f"Authentication failed: {e.response.status_code}")
            elif e.response.status_code == 404:
                raise MetricoolNotFoundError(f"Post {post_id} not found")
            elif e.response.status_code == 429:
                raise MetricoolRateLimitError("Rate limit exceeded", retry_after=60)
            else:
                return False
        except Exception as e:
            logger.error(
                f"Failed to cancel post: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "cancel_scheduled_post",
                    "post_id": post_id
                },
                exc_info=True
            )
            return False
    
    async def update_scheduled_post(
        self,
        blog_id: int,
        post_id: str,
        platform: str,
        text: str,
        media_url: Optional[str] = None,
        scheduled_at: str = None,
        timezone: str = "UTC",
        organization_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Atualiza um post agendado
        
        Endpoint: PUT /posts/{post_id}
        
        IMPORTANTE: Requer confirmação do usuário antes de modificar!
        
        Args:
            blog_id: ID da marca no Metricool
            post_id: ID do post a atualizar
            platform: Nome da plataforma
            text: Novo texto do post
            media_url: Nova URL de mídia (opcional)
            scheduled_at: Nova data/hora (opcional)
            timezone: Timezone
            organization_id: ID da organização (para logging)
            **kwargs: Parâmetros específicos da plataforma
        
        Returns:
            Dict com dados do post atualizado
        """
        self._validate_credentials()
        self._validate_text_length(platform, text)
        
        logger.info(
            f"Updating post {post_id}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "update_scheduled_post",
                "post_id": post_id,
                "blog_id": blog_id,
                "platform": platform
            }
        )
        
        try:
            # Primeiro, buscar o post atual para obter uuid e outros dados
            scheduled_posts = await self.get_scheduled_posts(
                blog_id=blog_id,
                start_date=datetime.now().strftime("%Y-%m-%d"),
                end_date=(datetime.now().replace(year=datetime.now().year + 1)).strftime("%Y-%m-%d"),
                timezone=timezone,
                organization_id=organization_id
            )
            
            current_post = next((p for p in scheduled_posts if str(p.get("id")) == str(post_id)), None)
            
            if not current_post:
                logger.error(
                    f"Post {post_id} not found",
                    extra={
                        "organization_id": organization_id,
                        "service_module": "metricool",
                        "endpoint": "update_scheduled_post",
                        "post_id": post_id
                    }
                )
                raise MetricoolNotFoundError(f"Post {post_id} not found")
            
            # Mapear nomes de plataforma
            platform_map = {
                "linkedin": "linkedin",
                "instagram": "instagram",
                "facebook": "facebook",
                "x": "twitter",
                "twitter": "twitter",
                "tiktok": "tiktok",
                "youtube": "youtube",
                "pinterest": "pinterest",
                "threads": "threads",
                "bluesky": "bluesky"
            }
            
            network = platform_map.get(platform.lower(), platform.lower())
            
            # Construir payload atualizado mantendo estrutura original
            post_data = {
                "id": post_id,
                "uuid": current_post.get("uuid"),
                "autoPublish": current_post.get("autoPublish", True),
                "draft": False,
                "text": text,
                "providers": [{"network": network}],
                "publicationDate": {
                    "dateTime": scheduled_at or current_post.get("publicationDate", {}).get("dateTime"),
                    "timezone": timezone
                },
                "media": [media_url] if media_url else current_post.get("media", []),
                "mediaAltText": current_post.get("mediaAltText", []),
                "shortener": current_post.get("shortener", False),
                "smartLinkData": current_post.get("smartLinkData", {"ids": []}),
                "descendants": current_post.get("descendants", []),
                "firstCommentText": current_post.get("firstCommentText", ""),
                "hasNotReadNotes": False
            }
            
            # Adicionar dados específicos da rede
            network_data = self._build_network_data(network, text, media_url, **kwargs)
            if network_data:
                post_data.update(network_data)
            
            # Fazer requisição de atualização
            response = await self.client.put(
                f"{self.BASE_URL}/posts/{post_id}",
                headers=self._get_headers(),
                params={
                    "userId": self.user_id,
                    "blogId": blog_id
                },
                json={
                    "id": post_id,
                    "date": scheduled_at or current_post.get("publicationDate", {}).get("dateTime"),
                    "blogId": blog_id,
                    "info": post_data
                },
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            
            logger.info(
                f"Post {post_id} updated successfully",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "update_scheduled_post",
                    "post_id": post_id
                }
            )
            
            return {
                "success": True,
                "post_id": post_id,
                "data": result
            }
                
        except MetricoolNotFoundError:
            raise
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error updating post: {e.response.status_code} - {e.response.text}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "update_scheduled_post",
                    "status_code": e.response.status_code,
                    "post_id": post_id
                },
                exc_info=True
            )
            
            if e.response.status_code == 401:
                raise MetricoolAuthError(f"Authentication failed: {e.response.status_code}")
            elif e.response.status_code == 404:
                raise MetricoolNotFoundError(f"Post {post_id} not found")
            elif e.response.status_code == 429:
                raise MetricoolRateLimitError("Rate limit exceeded", retry_after=60)
            else:
                raise MetricoolAPIError(
                    f"Failed to update post: {e.response.status_code}",
                    status_code=e.response.status_code,
                    response_data=e.response.text
                )
        except Exception as e:
            logger.error(
                f"Failed to update post: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "update_scheduled_post",
                    "post_id": post_id
                },
                exc_info=True
            )
            raise MetricoolAPIError(f"Unexpected error: {str(e)}")
    
    async def initiate_oauth(
        self,
        blog_id: int,
        platform: str,
        redirect_uri: str,
        organization_id: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Inicia fluxo OAuth para conectar rede social
        
        NOTA: O Metricool gerencia OAuth internamente através da interface web.
        Este método retorna a URL da interface do Metricool onde o usuário
        pode conectar suas contas sociais.
        
        Args:
            blog_id: ID da marca no Metricool
            platform: Plataforma a conectar (instagram, tiktok, linkedin, facebook, x, youtube)
            redirect_uri: URI de redirecionamento após OAuth
            organization_id: ID da organização (para logging)
        
        Returns:
            Dict com authorization_url
        """
        self._validate_credentials()
        
        logger.info(
            f"Initiating OAuth for platform: {platform}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "initiate_oauth",
                "platform": platform,
                "blog_id": blog_id
            }
        )
        
        # Mapear plataformas para URLs do Metricool
        platform_map = {
            "instagram": "instagram",
            "tiktok": "tiktok",
            "linkedin": "linkedin",
            "facebook": "facebook",
            "x": "twitter",
            "twitter": "twitter",
            "youtube": "youtube",
            "pinterest": "pinterest",
            "threads": "threads",
            "bluesky": "bluesky"
        }
        
        network = platform_map.get(platform.lower())
        if not network:
            raise MetricoolAPIError(f"Unsupported platform: {platform}")
        
        # URL da interface do Metricool para conectar redes sociais
        # O usuário será redirecionado para esta página onde pode autorizar a conexão
        authorization_url = f"https://app.metricool.com/settings/social-networks?blogId={blog_id}&network={network}"
        
        logger.info(
            f"OAuth URL generated for {platform}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "initiate_oauth",
                "platform": platform
            }
        )
        
        return {
            "authorization_url": authorization_url,
            "platform": platform,
            "blog_id": blog_id
        }
    
    async def disconnect_account(
        self,
        blog_id: int,
        platform: str,
        organization_id: Optional[str] = None
    ) -> bool:
        """
        Desconecta conta de rede social
        
        NOTA: A desconexão deve ser feita através da interface web do Metricool.
        Este método verifica se a conta está conectada e registra a solicitação.
        
        Args:
            blog_id: ID da marca no Metricool
            platform: Plataforma a desconectar
            organization_id: ID da organização (para logging)
        
        Returns:
            True se desconectado com sucesso
        """
        self._validate_credentials()
        
        logger.info(
            f"Disconnecting account for platform: {platform}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "disconnect_account",
                "platform": platform,
                "blog_id": blog_id
            }
        )
        
        try:
            # Verificar se a conta está conectada
            connected = await self.get_connected_accounts(blog_id, organization_id)
            
            if platform.lower() not in connected:
                logger.warning(
                    f"Platform {platform} not connected",
                    extra={
                        "organization_id": organization_id,
                        "service_module": "metricool",
                        "endpoint": "disconnect_account",
                        "platform": platform
                    }
                )
                raise MetricoolNotFoundError(f"Platform {platform} is not connected")
            
            # NOTA: A API do Metricool não expõe endpoint direto para desconexão
            # A desconexão deve ser feita através da interface web
            # Por enquanto, apenas registramos a solicitação
            logger.warning(
                f"Disconnect for {platform} must be done through Metricool web interface",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "disconnect_account",
                    "platform": platform
                }
            )
            
            return True
            
        except MetricoolNotFoundError:
            raise
        except Exception as e:
            logger.error(
                f"Failed to disconnect account: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "disconnect_account",
                    "platform": platform
                },
                exc_info=True
            )
            raise MetricoolAPIError(f"Failed to disconnect account: {str(e)}")
    
    async def get_analytics(
        self,
        blog_id: int,
        start_date: str,
        end_date: str,
        network: str,
        metrics: List[str],
        timezone: str = "UTC",
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retorna métricas de analytics para uma rede social
        
        Endpoint: GET /analytics
        
        Args:
            blog_id: ID da marca no Metricool
            start_date: Data inicial (YYYY-MM-DD)
            end_date: Data final (YYYY-MM-DD)
            network: Rede social (facebook, instagram, linkedin, youtube, tiktok)
            metrics: Lista de métricas desejadas (ex: ["followers", "engagement_rate"])
            timezone: Timezone
            organization_id: ID da organização (para logging)
        
        Returns:
            Dict com métricas solicitadas
        """
        self._validate_credentials()
        
        logger.info(
            f"Getting analytics for {network}",
            extra={
                "organization_id": organization_id,
                "service_module": "metricool",
                "endpoint": "get_analytics",
                "network": network,
                "blog_id": blog_id,
                "metrics": metrics
            }
        )
        
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/analytics",
                headers=self._get_headers(),
                params={
                    "userId": self.user_id,
                    "blogId": blog_id,
                    "start": start_date,
                    "end": end_date,
                    "timezone": timezone.replace("/", "%2F"),
                    "network": network.lower(),
                    "metric": metrics
                }
            )
            response.raise_for_status()
            data = response.json()
            
            logger.info(
                f"Successfully retrieved analytics for {network}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_analytics",
                    "network": network
                }
            )
            
            return data
                    
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error getting analytics: {e.response.status_code} - {e.response.text}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_analytics",
                    "status_code": e.response.status_code,
                    "network": network
                },
                exc_info=True
            )
            
            if e.response.status_code == 401:
                raise MetricoolAuthError(f"Authentication failed: {e.response.status_code}")
            elif e.response.status_code == 429:
                raise MetricoolRateLimitError("Rate limit exceeded", retry_after=60)
            elif e.response.status_code == 404:
                raise MetricoolNotFoundError(f"Analytics not found for {network}")
            else:
                raise MetricoolAPIError(
                    f"Failed to get analytics: {e.response.status_code}",
                    status_code=e.response.status_code,
                    response_data=e.response.text
                )
        except Exception as e:
            logger.error(
                f"Failed to get analytics: {e}",
                extra={
                    "organization_id": organization_id,
                    "service_module": "metricool",
                    "endpoint": "get_analytics",
                    "network": network
                },
                exc_info=True
            )
            raise MetricoolAPIError(f"Unexpected error: {str(e)}")
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Testa conexão com Metricool
        
        Returns:
            Dict com success e message
        """
        try:
            brands = await self.get_brands()
            return {
                "success": True,
                "message": f"Connected successfully. Found {len(brands)} brand(s).",
                "brands": brands
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}"
            }
