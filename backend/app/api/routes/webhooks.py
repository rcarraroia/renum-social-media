from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
from app.database import supabase
from app.utils.logger import get_logger
from app.core.webhooks import require_webhook_signature
from app.config import settings

router = APIRouter()
logger = get_logger("webhooks")

@router.post("/heygen")
async def heygen_webhook(
    request: Request,
    x_heygen_signature: Optional[str] = Header(None)
):
    """
    Webhook do HeyGen para status de geração de vídeo
    
    Requer assinatura HMAC-SHA256 no header X-HeyGen-Signature
    """
    try:
        # Ler payload
        payload = await request.body()
        
        # Validar assinatura HMAC (se secret configurado)
        if settings.heygen_webhook_secret:
            require_webhook_signature(
                x_heygen_signature,
                payload,
                settings.heygen_webhook_secret,
                "X-HeyGen-Signature"
            )
        else:
            logger.warning("HeyGen webhook secret not configured - skipping signature validation")
        
        # Processar payload
        data = await request.json()
        video_id = data.get("video_id")
        status = data.get("status")
        video_url = data.get("video_url")

        logger.info(f"Webhook HeyGen: video_id={video_id}, status={status}")

        if video_id and status == "completed":
            supabase.table("videos").update({
                "video_processed_url": video_url,
                "status": "ready"
            }).eq("id", video_id).execute()

        return {"received": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erro no webhook HeyGen", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao processar webhook")
