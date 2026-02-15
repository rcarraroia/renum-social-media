"""
Router de Social Accounts - Gerenciamento de conexões de redes sociais

Este módulo implementa endpoints para:
- Listar status de conexão de todas as plataformas suportadas
- Iniciar fluxo OAuth para conectar rede social
- Desconectar conta de rede social

Validates: Requirements 3.1, 3.2, 3.4, 11.1
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from app.api.deps import get_current_organization
from app.services.metricool import (
    MetricoolService,
    MetricoolAPIError,
    MetricoolAuthError,
    MetricoolNotFoundError
)
from app.models.social_accounts import (
    ConnectRequest,
    SocialAccountsResponse,
    PlatformStatus,
    SocialPlatform
)
from app.database import supabase
from app.utils.logger import get_logger
import asyncio

router = APIRouter()
logger = get_logger("social_accounts")


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
                "service_module": "social_accounts",
                "endpoint": "_get_blog_id"
            }
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metricool não configurado. Configure suas credenciais em Settings."
        )
    
    return blog_id


@router.get("/api/integrations/social-accounts", response_model=SocialAccountsResponse)
async def list_social_accounts(
    org_id: str = Depends(get_current_organization)
) -> SocialAccountsResponse:
    """
    Lista status de conexão de todas as plataformas de redes sociais suportadas.
    
    Retorna status para todas as 6 plataformas: Instagram, TikTok, LinkedIn, 
    Facebook, X (Twitter) e YouTube.
    
    Args:
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        SocialAccountsResponse com lista de PlatformStatus para cada plataforma
    
    Raises:
        HTTPException 404: Se Metricool não estiver configurado
        HTTPException 502: Se houver erro na comunicação com Metricool
    
    Validates: Requirements 3.1, 11.1
    """
    logger.info(
        "Listing social accounts",
        extra={
            "organization_id": org_id,
            "service_module": "social_accounts",
            "endpoint": "list_social_accounts"
        }
    )
    
    try:
        # Obter blog_id da organização
        blog_id = await _get_blog_id(org_id)
        
        # Inicializar serviço Metricool
        metricool = MetricoolService()
        
        # Obter contas conectadas do Metricool
        connected_accounts = await metricool.get_connected_accounts(
            blog_id=blog_id,
            organization_id=org_id
        )
        
        # Mapear plataformas do Metricool para nosso enum
        platform_mapping = {
            "instagram": SocialPlatform.INSTAGRAM,
            "tiktok": SocialPlatform.TIKTOK,
            "linkedin": SocialPlatform.LINKEDIN,
            "facebook": SocialPlatform.FACEBOOK,
            "twitter": SocialPlatform.X,
            "x": SocialPlatform.X,
            "youtube": SocialPlatform.YOUTUBE
        }
        
        # Construir lista de status para todas as plataformas
        accounts = []
        for platform in SocialPlatform:
            # Verificar se plataforma está conectada
            platform_key = platform.value if platform != SocialPlatform.X else "twitter"
            is_connected = platform_key in connected_accounts
            
            # Obter nome da conta se conectada
            account_name = None
            if is_connected and connected_accounts[platform_key]:
                # Usar o primeiro ID da conta como nome (pode ser melhorado)
                account_ids = connected_accounts[platform_key]
                if account_ids:
                    account_name = f"Account {account_ids[0]}"
            
            accounts.append(PlatformStatus(
                platform=platform,
                connected=is_connected,
                account_name=account_name
            ))
        
        logger.info(
            f"Successfully listed {len(accounts)} platforms",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "list_social_accounts",
                "connected_count": sum(1 for a in accounts if a.connected)
            }
        )
        
        return SocialAccountsResponse(accounts=accounts)
        
    except HTTPException:
        raise
    except MetricoolAuthError as e:
        logger.error(
            f"Metricool authentication error: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "list_social_accounts"
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Erro de autenticação com serviço de redes sociais. Verifique suas credenciais."
        )
    except MetricoolAPIError as e:
        logger.error(
            f"Metricool API error: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "list_social_accounts"
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Erro ao comunicar com serviço de redes sociais. Tente novamente mais tarde."
        )
    except Exception as e:
        logger.error(
            f"Unexpected error listing social accounts: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "list_social_accounts"
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao listar contas de redes sociais"
        )


@router.post("/api/integrations/social-accounts/connect")
async def connect_social_account(
    request: ConnectRequest,
    org_id: str = Depends(get_current_organization)
) -> Dict[str, str]:
    """
    Inicia fluxo OAuth para conectar uma rede social.
    
    Retorna URL de autorização que deve ser aberta em nova janela para o usuário
    autorizar a conexão da conta.
    
    Args:
        request: ConnectRequest com plataforma a ser conectada
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        Dict com authorization_url para iniciar OAuth
    
    Raises:
        HTTPException 404: Se Metricool não estiver configurado
        HTTPException 400: Se plataforma for inválida
        HTTPException 502: Se houver erro na comunicação com Metricool
    
    Validates: Requirements 3.2
    """
    logger.info(
        f"Initiating OAuth for platform: {request.platform}",
        extra={
            "organization_id": org_id,
            "service_module": "social_accounts",
            "endpoint": "connect_social_account",
            "platform": request.platform.value
        }
    )
    
    try:
        # Obter blog_id da organização
        blog_id = await _get_blog_id(org_id)
        
        # Inicializar serviço Metricool
        metricool = MetricoolService()
        
        # Iniciar fluxo OAuth
        # redirect_uri não é usado pelo Metricool, mas mantemos para compatibilidade
        redirect_uri = f"https://app.metricool.com/oauth/callback"
        
        result = await metricool.initiate_oauth(
            blog_id=blog_id,
            platform=request.platform.value,
            redirect_uri=redirect_uri,
            organization_id=org_id
        )
        
        authorization_url = result.get("authorization_url")
        
        if not authorization_url:
            raise MetricoolAPIError("Failed to generate authorization URL")
        
        logger.info(
            f"OAuth URL generated for {request.platform}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "connect_social_account",
                "platform": request.platform.value
            }
        )
        
        return {"authorization_url": authorization_url}
        
    except HTTPException:
        raise
    except MetricoolAuthError as e:
        logger.error(
            f"Metricool authentication error: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "connect_social_account",
                "platform": request.platform.value
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Erro de autenticação com serviço de redes sociais. Verifique suas credenciais."
        )
    except MetricoolAPIError as e:
        logger.error(
            f"Metricool API error: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "connect_social_account",
                "platform": request.platform.value
            },
            exc_info=True
        )
        
        # Verificar se é erro de plataforma inválida
        if "Unsupported platform" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plataforma {request.platform.value} não é suportada"
            )
        
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Erro ao iniciar conexão com rede social. Tente novamente mais tarde."
        )
    except Exception as e:
        logger.error(
            f"Unexpected error connecting social account: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "connect_social_account",
                "platform": request.platform.value
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao conectar rede social"
        )


@router.delete("/api/integrations/social-accounts/{platform}")
async def disconnect_social_account(
    platform: SocialPlatform,
    org_id: str = Depends(get_current_organization)
) -> Dict[str, str]:
    """
    Desconecta uma conta de rede social.
    
    Remove a autorização da plataforma especificada.
    
    Args:
        platform: Plataforma a ser desconectada (path parameter)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        Dict com mensagem de sucesso
    
    Raises:
        HTTPException 404: Se Metricool não estiver configurado ou plataforma não conectada
        HTTPException 502: Se houver erro na comunicação com Metricool
    
    Validates: Requirements 3.4
    """
    logger.info(
        f"Disconnecting platform: {platform}",
        extra={
            "organization_id": org_id,
            "service_module": "social_accounts",
            "endpoint": "disconnect_social_account",
            "platform": platform.value
        }
    )
    
    try:
        # Obter blog_id da organização
        blog_id = await _get_blog_id(org_id)
        
        # Inicializar serviço Metricool
        metricool = MetricoolService()
        
        # Desconectar conta
        success = await metricool.disconnect_account(
            blog_id=blog_id,
            platform=platform.value,
            organization_id=org_id
        )
        
        if not success:
            raise MetricoolAPIError("Failed to disconnect account")
        
        logger.info(
            f"Successfully disconnected {platform}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "disconnect_social_account",
                "platform": platform.value
            }
        )
        
        # Mapear nome da plataforma para português
        platform_names = {
            SocialPlatform.INSTAGRAM: "Instagram",
            SocialPlatform.TIKTOK: "TikTok",
            SocialPlatform.LINKEDIN: "LinkedIn",
            SocialPlatform.FACEBOOK: "Facebook",
            SocialPlatform.X: "X (Twitter)",
            SocialPlatform.YOUTUBE: "YouTube"
        }
        
        platform_name = platform_names.get(platform, platform.value)
        
        return {"message": f"{platform_name} desconectado com sucesso"}
        
    except HTTPException:
        raise
    except MetricoolNotFoundError as e:
        logger.warning(
            f"Platform not connected: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "disconnect_social_account",
                "platform": platform.value
            }
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plataforma {platform.value} não está conectada"
        )
    except MetricoolAuthError as e:
        logger.error(
            f"Metricool authentication error: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "disconnect_social_account",
                "platform": platform.value
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Erro de autenticação com serviço de redes sociais. Verifique suas credenciais."
        )
    except MetricoolAPIError as e:
        logger.error(
            f"Metricool API error: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "disconnect_social_account",
                "platform": platform.value
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Erro ao desconectar rede social. Tente novamente mais tarde."
        )
    except Exception as e:
        logger.error(
            f"Unexpected error disconnecting social account: {e}",
            extra={
                "organization_id": org_id,
                "service_module": "social_accounts",
                "endpoint": "disconnect_social_account",
                "platform": platform.value
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao desconectar rede social"
        )
