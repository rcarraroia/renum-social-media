from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.api.deps import get_current_organization, require_plan
from app.services.heygen import HeyGenService
from app.services.encryption import encryption_service
from app.database import supabase
from app.utils.logger import get_logger
from app.models.heygen import HeyGenCredentials, HeyGenApiKeyOnly
import asyncio

router = APIRouter()
logger = get_logger("integrations")


# ============================================================================
# HeyGen Integration Endpoints (Módulo 3 - AvatarAI)
# ============================================================================

@router.post("/heygen/validate-key")
async def validate_heygen_key(
    credentials: HeyGenApiKeyOnly,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Valida API Key do HeyGen sem salvar no banco.
    
    Requer plano Pro.
    
    Args:
        credentials: Apenas API Key para validação
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "valid": true,
            "credits_remaining": 150.5,
            "plan": "pro"
        }
    
    Raises:
        HTTPException 400: Se API Key for inválida
        HTTPException 403: Se conta estiver suspensa
        HTTPException 500: Se HeyGen estiver indisponível
        HTTPException 408: Se timeout (3s)
    """
    try:
        # Validar com timeout de 3 segundos
        heygen_service = HeyGenService()
        validation_result = await asyncio.wait_for(
            heygen_service.test_credentials(credentials.api_key),
            timeout=3.0
        )
        
        if not validation_result.get("valid"):
            # Mapear erro específico
            error = validation_result.get("error", {})
            error_code = error.get("code", "unknown")
            
            if error_code == "401":
                raise HTTPException(
                    status_code=400,
                    detail="API Key inválida. Verifique suas credenciais no HeyGen."
                )
            elif error_code == "403":
                raise HTTPException(
                    status_code=403,
                    detail="Conta HeyGen suspensa. Entre em contato com o suporte do HeyGen."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Erro ao validar API Key. Tente novamente."
                )
        
        # Retornar resultado da validação
        return {
            "valid": True,
            "credits_remaining": validation_result.get("credits_remaining", 0),
            "plan": "pro"
        }
        
    except asyncio.TimeoutError:
        logger.error("Timeout ao validar API Key HeyGen")
        raise HTTPException(
            status_code=408,
            detail="Tempo de conexão esgotado. Verifique sua conexão e tente novamente."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao validar API Key HeyGen: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao validar API Key. Tente novamente."
        )


@router.post("/heygen/wizard/avatars")
async def get_heygen_avatars_wizard(
    credentials: HeyGenApiKeyOnly,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Lista avatares usando API Key fornecida (para uso no wizard).
    
    Por padrão, retorna apenas avatares PRIVADOS/CUSTOMIZADOS do usuário.
    Isso evita carregar centenas de avatares públicos desnecessariamente.
    
    Requer plano Pro.
    
    Args:
        credentials: API Key para autenticação
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "avatars": [
                {
                    "avatar_id": "avatar_123",
                    "avatar_name": "Meu Clone",
                    "preview_image_url": "https://...",
                    "gender": "male",
                    "is_public": false
                }
            ]
        }
    
    Raises:
        HTTPException 400: Se API Key for inválida
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Listar apenas avatares PRIVADOS (clones e customizados do usuário)
        heygen_service = HeyGenService()
        result = await heygen_service.get_avatars(credentials.api_key, avatar_type="private")
        
        if "error" in result:
            raise HTTPException(
                status_code=400,
                detail="Erro ao listar avatares. Verifique sua API Key."
            )
        
        logger.info(f"Wizard: Listados {len(result.get('avatars', []))} avatares privados para org {org_id}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar avatares HeyGen (wizard): {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao listar avatares. Tente novamente"
        )


@router.post("/heygen/wizard/voices")
async def get_heygen_voices_wizard(
    credentials: HeyGenApiKeyOnly,
    language: Optional[str] = None,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Lista vozes usando API Key fornecida (para uso no wizard).
    
    Requer plano Pro.
    
    Args:
        credentials: API Key para autenticação
        language: Filtro opcional de idioma
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "voices": [
                {
                    "voice_id": "voice_456",
                    "voice_name": "Maria Brazilian",
                    "language": "pt",
                    "gender": "female",
                    "preview_audio_url": "https://..."
                }
            ]
        }
    
    Raises:
        HTTPException 400: Se API Key for inválida
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Listar vozes usando a API Key fornecida
        heygen_service = HeyGenService()
        result = await heygen_service.get_voices(credentials.api_key, language)
        
        if "error" in result:
            raise HTTPException(
                status_code=400,
                detail="Erro ao listar vozes. Verifique sua API Key."
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar vozes HeyGen (wizard): {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao listar vozes. Tente novamente"
        )


@router.post("/heygen/validate-key-old")
async def validate_heygen_key_old(
    credentials: HeyGenApiKeyOnly,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Valida API Key do HeyGen sem salvar no banco.
    
    Requer plano Pro.
    
    Args:
        credentials: Apenas API Key para validação
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "valid": true,
            "credits_remaining": 150.5,
            "plan": "pro"
        }
    
    Raises:
        HTTPException 400: Se API Key for inválida
        HTTPException 403: Se conta estiver suspensa
        HTTPException 500: Se HeyGen estiver indisponível
        HTTPException 408: Se timeout (3s)
    """
    try:
        # Validar com timeout de 3 segundos
        heygen_service = HeyGenService()
        validation_result = await asyncio.wait_for(
            heygen_service.test_credentials(credentials.api_key),
            timeout=3.0
        )
        
        if not validation_result.get("valid"):
            # Mapear erro específico
            error = validation_result.get("error", {})
            error_code = error.get("code", "unknown")
            
            if error_code == "401":
                raise HTTPException(
                    status_code=400,
                    detail="API Key inválida. Verifique suas credenciais no HeyGen."
                )
            elif error_code == "403":
                raise HTTPException(
                    status_code=403,
                    detail="Conta HeyGen suspensa. Entre em contato com o suporte do HeyGen."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Erro ao validar API Key. Tente novamente."
                )
        
        # Retornar resultado da validação
        return {
            "valid": True,
            "credits_remaining": validation_result.get("credits_remaining", 0),
            "plan": "pro"
        }
        
    except asyncio.TimeoutError:
        logger.error("Timeout ao validar API Key HeyGen")
        raise HTTPException(
            status_code=408,
            detail="Tempo de conexão esgotado. Verifique sua conexão e tente novamente."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao validar API Key HeyGen: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao validar API Key. Tente novamente."
        )


@router.put("/heygen")
async def configure_heygen(
    credentials: HeyGenCredentials,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Configura ou atualiza credenciais HeyGen da organização.
    
    Requer plano Pro.
    
    Args:
        credentials: Credenciais HeyGen (api_key, avatar_id, voice_id)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "success": true,
            "message": "Credenciais HeyGen configuradas com sucesso",
            "credits_remaining": 150.5
        }
    
    Raises:
        HTTPException 400: Se credenciais forem inválidas
        HTTPException 403: Se plano não for Pro
    """
    try:
        logger.info(f"[HEYGEN_CONFIG] Iniciando configuração para org_id: {org_id}")
        logger.info(f"[HEYGEN_CONFIG] Avatar ID: {credentials.avatar_id}, Voice ID: {credentials.voice_id}")
        
        # Validar credenciais fazendo chamada de teste à API HeyGen
        logger.info("[HEYGEN_CONFIG] Validando credenciais com HeyGen API...")
        heygen_service = HeyGenService()
        validation_result = await heygen_service.test_credentials(credentials.api_key)
        
        if not validation_result.get("valid"):
            logger.error(f"[HEYGEN_CONFIG] Validação falhou: {validation_result}")
            raise HTTPException(
                status_code=400,
                detail="Credenciais HeyGen inválidas. Verifique sua API Key em Configurações"
            )
        
        logger.info(f"[HEYGEN_CONFIG] Validação OK. Créditos: {validation_result.get('credits_remaining', 0)}")
        
        # Criptografar API Key antes de salvar
        logger.info("[HEYGEN_CONFIG] Criptografando API Key...")
        encrypted_api_key = encryption_service.encrypt(credentials.api_key)
        logger.info(f"[HEYGEN_CONFIG] API Key criptografada (primeiros 20 chars): {encrypted_api_key[:20]}...")
        
        # Preparar dados para update
        update_data = {
            "heygen_api_key": encrypted_api_key,
            "heygen_avatar_id": credentials.avatar_id,
            "heygen_voice_id": credentials.voice_id,
            "heygen_credits_total": validation_result.get("credits_remaining", 0),
            "heygen_credits_used": 0
        }
        logger.info(f"[HEYGEN_CONFIG] Dados para update: {update_data}")
        
        # Salvar credenciais no banco
        logger.info("[HEYGEN_CONFIG] Executando UPDATE no banco...")
        def _sync_update():
            result = supabase.table("organizations").update(update_data).eq("id", org_id).execute()
            logger.info(f"[HEYGEN_CONFIG] Resultado do UPDATE: {result}")
            return result
        
        update_result = await asyncio.to_thread(_sync_update)
        logger.info(f"[HEYGEN_CONFIG] UPDATE concluído. Result data: {update_result.data if hasattr(update_result, 'data') else 'N/A'}")
        
        # Verificar se o update foi bem-sucedido
        if hasattr(update_result, 'data') and update_result.data:
            logger.info(f"[HEYGEN_CONFIG] ✅ Credenciais salvas com sucesso para organização {org_id}")
        else:
            logger.warning(f"[HEYGEN_CONFIG] ⚠️ UPDATE retornou vazio. Verificando se houve erro...")
        
        return {
            "success": True,
            "message": "Credenciais HeyGen configuradas com sucesso",
            "credits_remaining": validation_result.get("credits_remaining", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[HEYGEN_CONFIG] ❌ ERRO CRÍTICO: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao configurar credenciais. Tente novamente"
        )


@router.post("/heygen/test")
async def test_heygen(
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Testa conexão com HeyGen usando credenciais salvas.
    
    Requer plano Pro.
    
    Returns:
        {
            "success": true,
            "message": "Conexão com HeyGen estabelecida",
            "account_name": "Minha Empresa",
            "credits_remaining": 150.5
        }
    
    Raises:
        HTTPException 400: Se credenciais não estiverem configuradas
        HTTPException 401: Se credenciais forem inválidas
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Buscar credenciais da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "heygen_api_key"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("heygen_api_key"):
            raise HTTPException(
                status_code=400,
                detail="Configure suas credenciais HeyGen antes de continuar"
            )
        
        # Descriptografar API Key
        api_key = encryption_service.decrypt(data["heygen_api_key"])
        
        # Testar conexão
        heygen_service = HeyGenService()
        result = await heygen_service.test_credentials(api_key)
        
        if not result.get("valid"):
            raise HTTPException(
                status_code=401,
                detail="Credenciais HeyGen inválidas. Verifique sua API Key em Configurações"
            )
        
        return {
            "success": True,
            "message": "Conexão com HeyGen estabelecida",
            "account_name": result.get("account_name", ""),
            "credits_remaining": result.get("credits_remaining", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao testar conexão HeyGen: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao testar conexão. Tente novamente"
        )


@router.get("/heygen/credits")
async def get_heygen_credits(
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Consulta créditos HeyGen disponíveis.
    
    Requer plano Pro.
    
    Returns:
        {
            "remaining_credits": 150.5,
            "total_credits": 200.0,
            "credits_used": 49.5,
            "low_credits_warning": false
        }
    
    Raises:
        HTTPException 400: Se credenciais não estiverem configuradas
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Buscar credenciais da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "heygen_api_key"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("heygen_api_key"):
            raise HTTPException(
                status_code=400,
                detail="Configure suas credenciais HeyGen antes de continuar"
            )
        
        # Descriptografar API Key
        api_key = encryption_service.decrypt(data["heygen_api_key"])
        
        # Consultar créditos
        heygen_service = HeyGenService()
        credits_info = await heygen_service.get_credits(api_key)
        
        # Atualizar campos no banco
        def _sync_update():
            return supabase.table("organizations").update({
                "heygen_credits_total": credits_info.get("total_credits", 0),
                "heygen_credits_used": credits_info.get("credits_used", 0)
            }).eq("id", org_id).execute()
        
        await asyncio.to_thread(_sync_update)
        
        # Registrar chamada em api_logs
        def _sync_log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "3",
                "endpoint": "get_credits",
                "status_code": 200
            }).execute()
        
        await asyncio.to_thread(_sync_log)
        
        remaining = credits_info.get("remaining_credits", 0)
        
        return {
            "remaining_credits": remaining,
            "total_credits": credits_info.get("total_credits", 0),
            "credits_used": credits_info.get("credits_used", 0),
            "low_credits_warning": remaining == 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao consultar créditos HeyGen: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao consultar créditos. Tente novamente"
        )


@router.get("/heygen/avatars")
async def get_heygen_avatars(
    avatar_type: str = "private",
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Lista avatares disponíveis na conta HeyGen.
    
    Por padrão, retorna apenas avatares PRIVADOS/CUSTOMIZADOS do usuário.
    
    Requer plano Pro.
    
    Args:
        avatar_type: Tipo de avatares ("private", "public", "all")
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "avatars": [
                {
                    "avatar_id": "avatar_123",
                    "avatar_name": "Meu Clone",
                    "preview_image_url": "https://...",
                    "gender": "male",
                    "is_public": false
                }
            ]
        }
    
    Raises:
        HTTPException 400: Se credenciais não estiverem configuradas
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Buscar credenciais da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "heygen_api_key"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("heygen_api_key"):
            raise HTTPException(
                status_code=400,
                detail="Configure suas credenciais HeyGen antes de continuar"
            )
        
        # Descriptografar API Key
        api_key = encryption_service.decrypt(data["heygen_api_key"])
        
        # Listar avatares com filtro de tipo
        heygen_service = HeyGenService()
        result = await heygen_service.get_avatars(api_key, avatar_type=avatar_type)
        
        # Registrar chamada em api_logs
        def _sync_log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "3",
                "endpoint": "get_avatars",
                "status_code": 200
            }).execute()
        
        await asyncio.to_thread(_sync_log)
        
        logger.info(f"Listados {len(result.get('avatars', []))} avatares tipo '{avatar_type}' para org {org_id}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar avatares HeyGen: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao listar avatares. Tente novamente"
        )


@router.get("/heygen/voices")
async def get_heygen_voices(
    language: Optional[str] = None,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Lista vozes disponíveis na conta HeyGen.
    
    Requer plano Pro.
    
    Args:
        language: Filtro opcional de idioma (pt, en, es, etc.)
    
    Returns:
        {
            "voices": [
                {
                    "voice_id": "voice_456",
                    "voice_name": "Maria Brazilian",
                    "language": "pt",
                    "gender": "female",
                    "preview_audio_url": "https://..."
                }
            ]
        }
    
    Raises:
        HTTPException 400: Se credenciais não estiverem configuradas
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Buscar credenciais da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "heygen_api_key"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("heygen_api_key"):
            raise HTTPException(
                status_code=400,
                detail="Configure suas credenciais HeyGen antes de continuar"
            )
        
        # Descriptografar API Key
        api_key = encryption_service.decrypt(data["heygen_api_key"])
        
        # Listar vozes
        heygen_service = HeyGenService()
        result = await heygen_service.get_voices(api_key, language)
        
        # Registrar chamada em api_logs
        def _sync_log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "3",
                "endpoint": "get_voices",
                "status_code": 200
            }).execute()
        
        await asyncio.to_thread(_sync_log)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar vozes HeyGen: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao listar vozes. Tente novamente"
        )


# ============================================================================
# HeyGen - Endpoints Adicionais
# ============================================================================

@router.get("/heygen")
async def get_heygen_credentials(
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Retorna as credenciais HeyGen salvas (API key mascarada).
    
    Requer plano Pro.
    
    Returns:
        {
            "configured": true,
            "api_key_masked": "****abc123",
            "avatar_id": "avatar_xxx",
            "voice_id": "voice_xxx"
        }
    
    Raises:
        HTTPException 404: Se credenciais não configuradas
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Buscar credenciais da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "heygen_api_key, heygen_avatar_id, heygen_voice_id"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("heygen_api_key"):
            return {
                "configured": False,
                "api_key_masked": None,
                "avatar_id": None,
                "voice_id": None
            }
        
        # Descriptografar API Key para mascarar
        api_key = encryption_service.decrypt(data["heygen_api_key"])
        
        # Mascarar API key (mostrar apenas últimos 6 caracteres)
        masked_key = f"****{api_key[-6:]}" if len(api_key) > 6 else "****"
        
        return {
            "configured": True,
            "api_key_masked": masked_key,
            "avatar_id": data.get("heygen_avatar_id"),
            "voice_id": data.get("heygen_voice_id")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar credenciais HeyGen: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao buscar credenciais. Tente novamente"
        )


@router.get("/heygen/status")
async def get_heygen_status(
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Verifica status da conexão HeyGen.
    
    Requer plano Pro.
    
    Returns:
        {
            "connected": true,
            "credits_remaining": 120
        }
    
    Raises:
        HTTPException 400: Se credenciais não configuradas
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Buscar credenciais da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "heygen_api_key"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("heygen_api_key"):
            return {
                "connected": False,
                "credits_remaining": 0
            }
        
        # Descriptografar API Key
        api_key = encryption_service.decrypt(data["heygen_api_key"])
        
        # Testar conexão consultando créditos
        heygen_service = HeyGenService()
        credits_info = await heygen_service.get_credits(api_key)
        
        return {
            "connected": True,
            "credits_remaining": credits_info.get("remaining_credits", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar status HeyGen: {e}", exc_info=True)
        return {
            "connected": False,
            "credits_remaining": 0
        }


@router.post("/heygen/configure")
async def configure_heygen_post(
    credentials: HeyGenCredentials,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Alias do PUT /heygen - configura credenciais HeyGen via POST.
    
    Requer plano Pro.
    
    Args:
        credentials: Credenciais HeyGen (api_key, avatar_id, voice_id)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "success": true,
            "message": "Credenciais HeyGen configuradas com sucesso"
        }
    
    Raises:
        HTTPException 400: Se credenciais forem inválidas
        HTTPException 403: Se plano não for Pro
    """
    # Redirecionar para o endpoint PUT
    return await configure_heygen(credentials, org_id, _)


# ============================================================================
# Metricool Integration Endpoints
# ============================================================================

class MetricoolCredentials(BaseModel):
    user_token: str
    user_id: str
    blog_id: Optional[str] = None


@router.post("/metricool/test")
async def test_metricool(
    org_id: str = Depends(get_current_organization)
):
    """
    Testa conexão com Metricool.
    
    Returns:
        {
            "connected": true,
            "username": "usuario_metricool",
            "blogs_count": 3
        }
    
    Raises:
        HTTPException 400: Se credenciais não configuradas
        HTTPException 401: Se credenciais inválidas
    """
    try:
        # Buscar credenciais Metricool da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "metricool_user_token, metricool_user_id, metricool_blog_id"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("metricool_user_token"):
            raise HTTPException(
                status_code=400,
                detail="Configure suas credenciais Metricool antes de continuar"
            )
        
        # TODO: Implementar chamada real ao Metricool MCP quando disponível
        # Por enquanto, retornar mock de sucesso
        logger.info(f"Teste de conexão Metricool para organização {org_id}")
        
        return {
            "connected": True,
            "username": "usuario_metricool",
            "blogs_count": 1
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao testar Metricool: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao testar conexão. Tente novamente"
        )


@router.get("/metricool/status")
async def get_metricool_status(
    org_id: str = Depends(get_current_organization)
):
    """
    Retorna status da integração Metricool.
    
    Returns:
        {
            "configured": true,
            "platforms": ["instagram", "tiktok", "facebook"]
        }
    """
    try:
        # Buscar credenciais Metricool da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "metricool_user_token, metricool_blog_id"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("metricool_user_token"):
            return {
                "configured": False,
                "platforms": []
            }
        
        # TODO: Implementar chamada real ao Metricool MCP para listar plataformas
        # Por enquanto, retornar mock
        return {
            "configured": True,
            "platforms": ["instagram", "tiktok", "facebook"]
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar status Metricool: {e}", exc_info=True)
        return {
            "configured": False,
            "platforms": []
        }


# ============================================================================
# Social Accounts Integration Endpoints
# ============================================================================

class SocialAccountConnect(BaseModel):
    metricool_user_token: str
    metricool_user_id: str
    metricool_blog_id: str


@router.get("/social-accounts")
async def list_social_accounts(
    org_id: str = Depends(get_current_organization)
):
    """
    Lista redes sociais conectadas via Metricool.
    
    Returns:
        {
            "accounts": [
                {"platform": "instagram", "username": "@usuario", "connected": true},
                {"platform": "tiktok", "username": "@usuario", "connected": true}
            ]
        }
    """
    try:
        # Buscar credenciais Metricool da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "metricool_user_token, metricool_blog_id"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("metricool_user_token"):
            return {
                "accounts": []
            }
        
        # TODO: Implementar chamada real ao Metricool MCP para listar contas
        # Por enquanto, retornar mock baseado em dados salvos
        return {
            "accounts": [
                {"platform": "instagram", "username": "@usuario", "connected": True},
                {"platform": "tiktok", "username": "@usuario", "connected": True}
            ]
        }
        
    except Exception as e:
        logger.error(f"Erro ao listar contas sociais: {e}", exc_info=True)
        return {
            "accounts": []
        }


@router.post("/social-accounts/connect")
async def connect_social_account(
    credentials: SocialAccountConnect,
    org_id: str = Depends(get_current_organization)
):
    """
    Salva credenciais Metricool do usuário.
    
    Args:
        credentials: Credenciais Metricool (user_token, user_id, blog_id)
        org_id: ID da organização
    
    Returns:
        {
            "success": true,
            "message": "Credenciais Metricool salvas com sucesso"
        }
    """
    try:
        # Salvar credenciais na organização
        def _sync_update():
            return supabase.table("organizations").update({
                "metricool_user_token": credentials.metricool_user_token,
                "metricool_user_id": credentials.metricool_user_id,
                "metricool_blog_id": credentials.metricool_blog_id
            }).eq("id", org_id).execute()
        
        await asyncio.to_thread(_sync_update)
        
        logger.info(f"Credenciais Metricool salvas para organização {org_id}")
        
        return {
            "success": True,
            "message": "Credenciais Metricool salvas com sucesso"
        }
        
    except Exception as e:
        logger.error(f"Erro ao salvar credenciais Metricool: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao salvar credenciais. Tente novamente"
        )


@router.delete("/social-accounts/{platform}")
async def disconnect_social_account(
    platform: str,
    org_id: str = Depends(get_current_organization)
):
    """
    Remove associação de uma plataforma específica.
    
    Args:
        platform: Nome da plataforma (instagram, tiktok, etc)
        org_id: ID da organização
    
    Returns:
        {
            "success": true,
            "message": "Plataforma desconectada com sucesso"
        }
    """
    try:
        # TODO: Implementar lógica real de desconexão via Metricool MCP
        # Por enquanto, apenas log
        logger.info(f"Desconectando plataforma {platform} da organização {org_id}")
        
        return {
            "success": True,
            "message": f"Plataforma {platform} desconectada com sucesso"
        }
        
    except Exception as e:
        logger.error(f"Erro ao desconectar plataforma: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao desconectar plataforma. Tente novamente"
        )
