from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict, Any
from app.api.deps import get_current_organization, require_plan
from app.services.heygen import HeyGenService
from app.services.encryption import encryption_service
from app.database import supabase
from app.utils.logger import get_logger
from app.models.heygen import (
    VideoGenerationRequest, 
    VideoGenerationResponse, 
    VideoStatusResponse,
    SendToPostRapidoRequest
)
import asyncio
import uuid
from datetime import datetime

router = APIRouter()
logger = get_logger("module3")

# ============================================================================
# Módulo 3 - AvatarAI: Geração de Vídeos com Avatares
# ============================================================================

@router.post("/generate", response_model=VideoGenerationResponse)
async def generate_video(
    request: VideoGenerationRequest,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Inicia geração de vídeo com avatar HeyGen.
    
    Requer plano Pro.
    
    Args:
        request: Dados da geração (script, avatar_id, voice_id, etc.)
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        VideoGenerationResponse com job_id, video_id e status
    
    Raises:
        HTTPException 400: Se script inválido ou credenciais não configuradas
        HTTPException 402: Se créditos HeyGen insuficientes
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Validar script
        if not request.script or not request.script.strip():
            raise HTTPException(
                status_code=400,
                detail="Script não pode estar vazio"
            )
        
        if len(request.script) > 5000:
            raise HTTPException(
                status_code=400,
                detail="Script muito longo. Máximo: 5000 caracteres"
            )
        
        # Buscar credenciais da organização
        def _sync_select():
            return supabase.table("organizations").select(
                "heygen_api_key, heygen_avatar_id, heygen_voice_id"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("heygen_api_key"):
            raise HTTPException(
                status_code=400,
                detail="Configure suas credenciais HeyGen em Configurações > Integrações"
            )
        
        # Usar avatar_id e voice_id do request, ou defaults da organização
        avatar_id = request.avatar_id or data.get("heygen_avatar_id")
        voice_id = request.voice_id or data.get("heygen_voice_id")
        
        if not avatar_id or not voice_id:
            raise HTTPException(
                status_code=400,
                detail="Configure avatar e voz padrão em Configurações > Integrações"
            )
        
        # Descriptografar API Key
        api_key = encryption_service.decrypt(data["heygen_api_key"])
        
        # Verificar créditos HeyGen
        heygen_service = HeyGenService()
        credits_info = await heygen_service.get_credits(api_key)
        
        if credits_info.get("remaining_credits", 0) <= 0:
            raise HTTPException(
                status_code=402,
                detail="Créditos HeyGen insuficientes. Recarregue sua conta em heygen.com"
            )
        
        # Criar vídeo no HeyGen
        video_result = await heygen_service.create_video(
            api_key=api_key,
            script=request.script,
            avatar_id=avatar_id,
            voice_id=voice_id,
            title=request.title
        )
        
        # Gerar job_id único
        job_id = str(uuid.uuid4())
        
        # Salvar registro na tabela videos
        def _sync_insert():
            return supabase.table("videos").insert({
                "id": job_id,
                "organization_id": org_id,
                "recording_source": "heygen",
                "heygen_video_id": video_result.get("video_id"),
                "heygen_job_status": "processing",
                "title": request.title or "Vídeo Avatar",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        
        await asyncio.to_thread(_sync_insert)
        
        # Registrar chamada em api_logs
        def _sync_log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "3",
                "endpoint": "generate_video",
                "status_code": 202
            }).execute()
        
        await asyncio.to_thread(_sync_log)
        
        logger.info(f"Vídeo iniciado para organização {org_id}: job_id={job_id}, video_id={video_result.get('video_id')}")
        
        return VideoGenerationResponse(
            success=True,
            job_id=job_id,
            video_id=video_result.get("video_id"),
            status="processing",
            message="Vídeo em processamento. Consulte o status em alguns minutos"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar vídeo: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao gerar vídeo. Tente novamente"
        )


@router.get("/videos/{job_id}/status", response_model=VideoStatusResponse)
async def get_video_status(
    job_id: str,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Consulta status de geração de vídeo.
    
    Requer plano Pro.
    
    Args:
        job_id: ID do job de geração
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        VideoStatusResponse com status atual do vídeo
    
    Raises:
        HTTPException 404: Se vídeo não encontrado
        HTTPException 403: Se plano não for Pro
    """
    try:
        # Buscar registro de vídeo no banco
        def _sync_select_video():
            return supabase.table("videos").select(
                "id, heygen_video_id, heygen_job_status, video_url, created_at, heygen_error_message"
            ).eq("id", job_id).eq("organization_id", org_id).single().execute()
        
        video_data = await asyncio.to_thread(_sync_select_video)
        video = video_data.data if hasattr(video_data, "data") else video_data.get("data")
        
        if not video:
            raise HTTPException(
                status_code=404,
                detail="Vídeo não encontrado"
            )
        
        # Se vídeo já está pronto, retornar status
        if video.get("heygen_job_status") == "ready":
            return VideoStatusResponse(
                job_id=job_id,
                video_id=video.get("heygen_video_id"),
                status="completed",
                video_url=video.get("video_url"),
                created_at=video.get("created_at")
            )
        
        # Se vídeo falhou, retornar erro
        if video.get("heygen_job_status") == "failed":
            return VideoStatusResponse(
                job_id=job_id,
                video_id=video.get("heygen_video_id"),
                status="failed",
                error=video.get("heygen_error_message") or "Falha na geração do vídeo"
            )
        
        # Buscar credenciais para consultar status no HeyGen
        def _sync_select_org():
            return supabase.table("organizations").select(
                "heygen_api_key"
            ).eq("id", org_id).single().execute()
        
        org_data = await asyncio.to_thread(_sync_select_org)
        data = org_data.data if hasattr(org_data, "data") else org_data.get("data")
        
        if not data or not data.get("heygen_api_key"):
            raise HTTPException(
                status_code=400,
                detail="Credenciais HeyGen não encontradas"
            )
        
        # Descriptografar API Key
        api_key = encryption_service.decrypt(data["heygen_api_key"])
        
        # Consultar status no HeyGen
        heygen_service = HeyGenService()
        status_result = await heygen_service.get_video_status(
            api_key=api_key,
            video_id=video.get("heygen_video_id")
        )
        
        # Se vídeo completou, fazer download e upload para Supabase
        if status_result.get("status") == "completed":
            video_url = status_result.get("video_url")
            
            if video_url:
                # Fazer download do vídeo
                download_result = await heygen_service.download_video(
                    api_key=api_key,
                    video_id=video.get("heygen_video_id")
                )
                
                # Verificar se download teve erro
                if "error" in download_result:
                    error_msg = download_result["error"].get("message", "Erro ao baixar vídeo")
                    
                    # Atualizar registro com erro
                    def _sync_update_error():
                        return supabase.table("videos").update({
                            "heygen_job_status": "failed",
                            "heygen_error_message": error_msg
                        }).eq("id", job_id).execute()
                    
                    await asyncio.to_thread(_sync_update_error)
                    
                    return VideoStatusResponse(
                        job_id=job_id,
                        video_id=video.get("heygen_video_id"),
                        status="failed",
                        error=error_msg
                    )
                
                # Extrair bytes do resultado
                video_bytes = download_result["video_bytes"]
                
                # Upload para Supabase Storage
                storage_url = await upload_video_to_storage(
                    video_bytes=video_bytes,
                    organization_id=org_id,
                    video_id=job_id
                )
                
                # Atualizar registro no banco
                def _sync_update():
                    return supabase.table("videos").update({
                        "video_url": storage_url,
                        "heygen_job_status": "ready"
                    }).eq("id", job_id).execute()
                
                await asyncio.to_thread(_sync_update)
                
                logger.info(f"Vídeo completado e salvo: job_id={job_id}, url={storage_url}")
                
                return VideoStatusResponse(
                    job_id=job_id,
                    video_id=video.get("heygen_video_id"),
                    status="completed",
                    video_url=storage_url,
                    duration=status_result.get("duration"),
                    thumbnail_url=status_result.get("thumbnail_url"),
                    created_at=video.get("created_at")
                )
        
        # Se vídeo falhou no HeyGen
        if status_result.get("status") == "failed":
            error_message = status_result.get("error", "Falha na geração do vídeo")
            
            # Atualizar registro no banco
            def _sync_update_failed():
                return supabase.table("videos").update({
                    "heygen_job_status": "failed",
                    "heygen_error_message": error_message
                }).eq("id", job_id).execute()
            
            await asyncio.to_thread(_sync_update_failed)
            
            return VideoStatusResponse(
                job_id=job_id,
                video_id=video.get("heygen_video_id"),
                status="failed",
                error=error_message
            )
        
        # Vídeo ainda em processamento
        # Registrar chamada em api_logs
        def _sync_log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "3",
                "endpoint": "get_video_status",
                "status_code": 200
            }).execute()
        
        await asyncio.to_thread(_sync_log)
        
        return VideoStatusResponse(
            job_id=job_id,
            video_id=video.get("heygen_video_id"),
            status="processing",
            progress=status_result.get("progress"),
            estimated_time_remaining=status_result.get("estimated_time_remaining")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao consultar status do vídeo: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao consultar status. Tente novamente"
        )


@router.post("/send-to-postrapido")
async def send_to_postrapido(
    request: SendToPostRapidoRequest,
    org_id: str = Depends(get_current_organization),
    _: str = Depends(require_plan("pro"))
):
    """
    Envia vídeo gerado para o módulo PostRápido.
    
    Requer plano Pro.
    
    Args:
        request: Request com video_id
        org_id: ID da organização (injetado via dependency)
    
    Returns:
        {
            "success": true,
            "message": "Vídeo enviado para PostRápido",
            "redirect_url": "/modules/2?video_id=..."
        }
    
    Raises:
        HTTPException 400: Se vídeo não estiver pronto
        HTTPException 403: Se plano não for Pro (já validado por dependency)
    """
    try:
        # Buscar registro de vídeo
        def _sync_select():
            return supabase.table("videos").select(
                "id, heygen_job_status, video_url"
            ).eq("id", request.video_id).eq("organization_id", org_id).single().execute()
        
        video_data = await asyncio.to_thread(_sync_select)
        video = video_data.data if hasattr(video_data, "data") else video_data.get("data")
        
        if not video:
            raise HTTPException(
                status_code=404,
                detail="Vídeo não encontrado"
            )
        
        # Verificar se vídeo está pronto
        if video.get("heygen_job_status") != "ready":
            raise HTTPException(
                status_code=400,
                detail="Aguarde a conclusão da geração do vídeo"
            )
        
        # Registrar chamada em api_logs
        def _sync_log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "3",
                "endpoint": "send_to_postrapido",
                "status_code": 200
            }).execute()
        
        await asyncio.to_thread(_sync_log)
        
        logger.info(f"Vídeo {request.video_id} enviado para PostRápido pela organização {org_id}")
        
        return {
            "success": True,
            "message": "Vídeo enviado para PostRápido",
            "redirect_url": f"/modules/2?video_id={request.video_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao enviar vídeo para PostRápido: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao enviar vídeo. Tente novamente"
        )


# ============================================================================
# Funções Auxiliares
# ============================================================================

async def upload_video_to_storage(
    video_bytes: bytes,
    organization_id: str,
    video_id: str
) -> str:
    """
    Faz upload de vídeo para Supabase Storage.
    
    Args:
        video_bytes: Bytes do arquivo de vídeo
        organization_id: ID da organização
        video_id: ID do vídeo
    
    Returns:
        URL pública do vídeo no Supabase Storage
    """
    try:
        file_path = f"{organization_id}/{video_id}.mp4"
        
        # Upload para bucket videos-raw (vídeos ainda não editados)
        def _sync_upload():
            return supabase.storage.from_("videos-raw").upload(
                file_path,
                video_bytes,
                file_options={"content-type": "video/mp4"}
            )
        
        await asyncio.to_thread(_sync_upload)
        
        # Obter URL pública
        def _sync_get_url():
            return supabase.storage.from_("videos-raw").get_public_url(file_path)
        
        public_url = await asyncio.to_thread(_sync_get_url)
        
        logger.info(f"Vídeo uploaded para Storage: {file_path}")
        
        return public_url
        
    except Exception as e:
        logger.error(f"Erro ao fazer upload de vídeo: {e}", exc_info=True)
        raise Exception("Falha ao salvar vídeo no storage")
