from fastapi import APIRouter
from datetime import datetime
from app.database import supabase
from app.config import settings
import subprocess
import asyncio

router = APIRouter()

@router.get("/")
async def health_check():
    """
    Health check with service verification
    """
    # Check FFmpeg availability
    ffmpeg_status = "available"
    try:
        result = await asyncio.to_thread(
            subprocess.run, 
            ["ffmpeg", "-version"], 
            capture_output=True, 
            timeout=5
        )
        if result.returncode != 0:
            ffmpeg_status = "error"
    except Exception:
        ffmpeg_status = "missing"
    
    # Check Supabase connection
    supabase_status = "connected"
    try:
        def _sync_check():
            return supabase.table("organizations").select("id").limit(1).execute()
        await asyncio.to_thread(_sync_check)
    except Exception:
        supabase_status = "error"
    
    # Check Whisper (if using local)
    whisper_status = "not_configured"
    if settings.whisper_model and not settings.deepgram_api_key:
        try:
            import whisper
            whisper_status = "available"
        except ImportError:
            whisper_status = "missing"
    elif settings.deepgram_api_key:
        whisper_status = "using_deepgram"
    
    overall_status = "ok" if ffmpeg_status == "available" and supabase_status == "connected" else "degraded"
    
    return {
        "status": overall_status,
        "version": "0.4.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "RENUM Social AI API",
        "environment": settings.environment,
        "services": {
            "supabase": supabase_status,
            "ffmpeg": ffmpeg_status,
            "transcription": whisper_status
        }
    }

@router.get("/ready")
async def readiness_check():
    """
    Readiness check (verificar dependências críticas)
    """
    ready = True
    errors = []
    
    # Check Supabase
    try:
        def _sync_check():
            return supabase.table("organizations").select("id").limit(1).execute()
        await asyncio.to_thread(_sync_check)
    except Exception as e:
        ready = False
        errors.append(f"Supabase: {str(e)}")
    
    # Check FFmpeg
    try:
        result = await asyncio.to_thread(
            subprocess.run, 
            ["ffmpeg", "-version"], 
            capture_output=True, 
            timeout=5
        )
        if result.returncode != 0:
            ready = False
            errors.append("FFmpeg not available")
    except Exception as e:
        ready = False
        errors.append(f"FFmpeg: {str(e)}")
    
    return {
        "status": "ready" if ready else "not_ready",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "errors": errors if errors else None
    }