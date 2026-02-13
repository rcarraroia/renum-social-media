from fastapi import APIRouter, Request, HTTPException
from app.database import supabase
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("webhooks")

@router.post("/opusclip")
async def opusclip_webhook(request: Request):
    try:
        payload = await request.json()
        job_id = payload.get("job_id")
        status = payload.get("status")
        video_url = payload.get("processed_video_url")
        captions = payload.get("captions", [])

        logger.info(f"Webhook OpusClip: job_id={job_id}, status={status}")

        if job_id and status == "completed":
            supabase.table("videos").update({
                "video_processed_url": video_url,
                "captions": captions,
                "status": "ready"
            }).eq("id", job_id).execute()
        elif job_id and status == "failed":
            supabase.table("videos").update({"status": "failed"}).eq("id", job_id).execute()

        return {"received": True}
    except Exception as e:
        logger.error("Erro no webhook OpusClip", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao processar webhook")

@router.post("/heygen")
async def heygen_webhook(request: Request):
    try:
        payload = await request.json()
        video_id = payload.get("video_id")
        status = payload.get("status")
        video_url = payload.get("video_url")

        logger.info(f"Webhook HeyGen: video_id={video_id}, status={status}")

        if video_id and status == "completed":
            supabase.table("videos").update({
                "video_processed_url": video_url,
                "status": "ready"
            }).eq("id", video_id).execute()

        return {"received": True}
    except Exception as e:
        logger.error("Erro no webhook HeyGen", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao processar webhook")