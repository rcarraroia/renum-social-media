from anthropic import Anthropic
from typing import List, Dict, Any
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("claude")

class ClaudeService:
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
        self.model = "claude-sonnet-4-20250514"

    async def generate_script(self, topic: str, context: str, duration_seconds: int = 60, tone: str = "casual") -> Dict[str, Any]:
        if not self.client:
            return {"success": False, "message": "Anthropic API key not configured"}
        prompt = f"""
You are a specialist in short social video scripts.
Topic: {topic}
Context: {context}
Duration: {duration_seconds} seconds
Tone: {tone}
Return only the script.
"""
        try:
            # Anthropic SDK is sync — call in thread
            def _sync_call():
                return self.client.messages.create(model=self.model, max_tokens=1200, messages=[{"role": "user", "content": prompt}])
            res = await __import__("asyncio").to_thread(_sync_call)
            # Extract text safely
            content = getattr(res, "content", None)
            text = None
            if content:
                if isinstance(content, list) and len(content) > 0:
                    text = content[0].text if hasattr(content[0], "text") else str(content[0])
                elif hasattr(content, "text"):
                    text = content.text
            return {"success": True, "script": text or "", "model": self.model}
        except Exception as e:
            logger.error("Error generating script", exc_info=True)
            return {"success": False, "message": str(e)}