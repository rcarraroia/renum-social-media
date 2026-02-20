"""
Tasks assíncronas para processamento de vídeo
"""
import os
import logging
from celery import Task
from app.celery_app import celery_app
from app.database import supabase

logger = logging.getLogger(__name__)


class CallbackTask(Task):
    """Task base com callback de progresso"""
    
    def on_success(self, retval, task_id, args, kwargs):
        """Chamado quando task completa com sucesso"""
        logger.info(f"Task {task_id} completada com sucesso")
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Chamado quando task falha"""
        logger.error(f"Task {task_id} falhou: {exc}")
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Chamado quando task é retentada"""
        logger.warning(f"Task {task_id} sendo retentada: {exc}")


@celery_app.task(
    bind=True,
    base=CallbackTask,
    max_retries=3,
    default_retry_delay=60,  # 1 minuto
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,  # 10 minutos
    retry_jitter=True
)
def process_video(self, video_id: str, organization_id: str):
    """
    Processa vídeo de forma assíncrona
    
    Args:
        video_id: ID do vídeo
        organization_id: ID da organização
    
    Returns:
        dict: Resultado do processamento
    """
    try:
        logger.info(f"Iniciando processamento do vídeo {video_id}")
        
        # Atualizar status para "processing"
        supabase.table("videos").update({
            "status": "processing",
            "processing_started_at": "now()"
        }).eq("id", video_id).execute()
        
        # Atualizar progresso
        self.update_state(
            state="PROGRESS",
            meta={"current": 10, "total": 100, "status": "Baixando vídeo..."}
        )
        
        # 1. Baixar vídeo do storage
        video_data = supabase.table("videos").select("*").eq("id", video_id).single().execute()
        video = video_data.data
        
        if not video:
            raise ValueError(f"Vídeo {video_id} não encontrado")
        
        video_url = video.get("video_url")
        if not video_url:
            raise ValueError(f"URL do vídeo {video_id} não encontrada")
        
        # Atualizar progresso
        self.update_state(
            state="PROGRESS",
            meta={"current": 30, "total": 100, "status": "Extraindo áudio..."}
        )
        
        # 2. Extrair áudio (simulado - implementar com FFmpeg)
        # audio_path = extract_audio(video_url)
        
        # Atualizar progresso
        self.update_state(
            state="PROGRESS",
            meta={"current": 50, "total": 100, "status": "Transcrevendo..."}
        )
        
        # 3. Transcrever áudio (simulado - implementar com Whisper/Deepgram)
        # transcript = transcribe_audio(audio_path)
        
        # Atualizar progresso
        self.update_state(
            state="PROGRESS",
            meta={"current": 70, "total": 100, "status": "Gerando legendas..."}
        )
        
        # 4. Gerar legendas (simulado)
        # captions = generate_captions(transcript)
        
        # Atualizar progresso
        self.update_state(
            state="PROGRESS",
            meta={"current": 90, "total": 100, "status": "Finalizando..."}
        )
        
        # 5. Atualizar vídeo no banco
        supabase.table("videos").update({
            "status": "ready",
            "processing_completed_at": "now()",
            # "transcript": transcript,
            # "captions": captions
        }).eq("id", video_id).execute()
        
        logger.info(f"Vídeo {video_id} processado com sucesso")
        
        return {
            "video_id": video_id,
            "status": "completed",
            "message": "Vídeo processado com sucesso"
        }
        
    except Exception as e:
        logger.error(f"Erro ao processar vídeo {video_id}: {e}", exc_info=True)
        
        # Atualizar status para "failed"
        supabase.table("videos").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", video_id).execute()
        
        raise


@celery_app.task(bind=True, base=CallbackTask)
def generate_avatar_video(self, video_id: str, script: str, avatar_id: str, voice_id: str):
    """
    Gera vídeo com avatar usando HeyGen
    
    Args:
        video_id: ID do vídeo
        script: Roteiro do vídeo
        avatar_id: ID do avatar HeyGen
        voice_id: ID da voz HeyGen
    
    Returns:
        dict: Resultado da geração
    """
    try:
        logger.info(f"Iniciando geração de avatar para vídeo {video_id}")
        
        # Atualizar status
        supabase.table("videos").update({
            "status": "generating",
        }).eq("id", video_id).execute()
        
        # Atualizar progresso
        self.update_state(
            state="PROGRESS",
            meta={"current": 20, "total": 100, "status": "Enviando para HeyGen..."}
        )
        
        # Chamar API do HeyGen (implementar)
        # heygen_response = call_heygen_api(script, avatar_id, voice_id)
        
        # Atualizar progresso
        self.update_state(
            state="PROGRESS",
            meta={"current": 50, "total": 100, "status": "Aguardando geração..."}
        )
        
        # HeyGen processa de forma assíncrona e envia webhook quando completo
        # Por enquanto, apenas marcar como "processing"
        
        logger.info(f"Vídeo {video_id} enviado para HeyGen")
        
        return {
            "video_id": video_id,
            "status": "processing",
            "message": "Vídeo enviado para geração"
        }
        
    except Exception as e:
        logger.error(f"Erro ao gerar avatar para vídeo {video_id}: {e}", exc_info=True)
        
        supabase.table("videos").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", video_id).execute()
        
        raise


@celery_app.task
def cleanup_old_videos():
    """
    Limpa vídeos antigos do storage (task periódica)
    
    Remove vídeos com status "failed" ou "cancelled" com mais de 7 dias
    """
    try:
        logger.info("Iniciando limpeza de vídeos antigos")
        
        # Buscar vídeos para limpar
        result = supabase.table("videos").select("id, video_url").filter(
            "status", "in", '("failed","cancelled")'
        ).filter(
            "created_at", "lt", "now() - interval '7 days'"
        ).execute()
        
        videos = result.data if hasattr(result, "data") else []
        
        for video in videos:
            video_id = video["id"]
            video_url = video.get("video_url")
            
            # Deletar do storage
            if video_url:
                try:
                    # Extrair path do storage
                    path = video_url.split("/")[-1]
                    supabase.storage.from_("videos-raw").remove([path])
                    logger.info(f"Vídeo {video_id} removido do storage")
                except Exception as e:
                    logger.warning(f"Erro ao remover vídeo {video_id} do storage: {e}")
            
            # Deletar registro do banco
            supabase.table("videos").delete().eq("id", video_id).execute()
            logger.info(f"Registro do vídeo {video_id} removido do banco")
        
        logger.info(f"Limpeza concluída: {len(videos)} vídeos removidos")
        
        return {
            "videos_removed": len(videos),
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"Erro na limpeza de vídeos: {e}", exc_info=True)
        raise


@celery_app.task(bind=True, base=CallbackTask)
def batch_process_videos(self, video_ids: list[str]):
    """
    Processa múltiplos vídeos em lote
    
    Args:
        video_ids: Lista de IDs de vídeos
    
    Returns:
        dict: Resultado do processamento em lote
    """
    try:
        logger.info(f"Iniciando processamento em lote de {len(video_ids)} vídeos")
        
        results = []
        total = len(video_ids)
        
        for i, video_id in enumerate(video_ids):
            # Atualizar progresso
            self.update_state(
                state="PROGRESS",
                meta={
                    "current": i + 1,
                    "total": total,
                    "status": f"Processando vídeo {i + 1}/{total}"
                }
            )
            
            # Processar vídeo
            try:
                result = process_video.delay(video_id, "")
                results.append({
                    "video_id": video_id,
                    "task_id": result.id,
                    "status": "queued"
                })
            except Exception as e:
                logger.error(f"Erro ao enfileirar vídeo {video_id}: {e}")
                results.append({
                    "video_id": video_id,
                    "status": "error",
                    "error": str(e)
                })
        
        logger.info(f"Processamento em lote concluído: {len(results)} vídeos enfileirados")
        
        return {
            "total": total,
            "results": results,
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"Erro no processamento em lote: {e}", exc_info=True)
        raise
