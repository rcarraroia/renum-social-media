import httpx
from typing import Dict, Any
from datetime import datetime
from app.utils.logger import get_logger
from app.database import log_api_call

logger = get_logger("opusclip")

BASE_URL = "https://api.opus.pro/v1"

class OpusClipService:
    def __init__(self, api_key: str, organization_id: str):
        self.api_key = api_key
        self.organization_id = organization_id

    async def add_captions(self, video_url: str, language: str = "pt-BR", style: str = "default") -> Dict[str, Any]:
        start = datetime.utcnow()
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{BASE_URL}/captions/generate",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json={"video_url": video_url, "language": language, "caption_style": style},
                    timeout=120.0
                )
                duration_ms = int((datetime.utcnow() - start).total_seconds() * 1000)
                await log_api_call(self.organization_id, "opusclip", "/captions/generate", "POST", {"video_url": video_url, "language": language}, response.json(), response.status_code, duration_ms)
                if response.status_code == 200:
                    return {"success": True, "job_id": response.json().get("job_id"), "status": response.json().get("status")}
                else:
                    return {"success": False, "message": response.json()}
            except Exception as e:
                logger.error("Error calling OpusClip", exc_info=True)
                return {"success": False, "message": str(e)}