from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Optional
import asyncio
import os
import uuid
from datetime import datetime

from app.api.deps import get_current_user, get_current_organization
from app.models.schemas import (
    VideoUploadResponse,
    TranscriptionRequest, TranscriptionResponse,
    SilenceDetectionRequest, SilenceDetectionResponse,
    VideoProcessRequest, VideoProcessResponse, VideoProcessStatus,
    DescriptionGenerateRequest, DescriptionGenerateResponse,
    DescriptionRegenerateRequest,
    ScheduleRequest, ScheduleResponse
)
from app.services.video_processing import VideoProcessingService
from app.services.transcription import TranscriptionService
from app.database import supabase, log_api_call
from app.config import settings
from app.utils.logger import get_logger

# Dual mode: OpenRouter ou Anthropic
if settings.use_openrouter:
    from app.services.openrouter import OpenRouterService
    ai_service = OpenRouterService()
else:
    from app.services.claude import ClaudeService
    ai_service = ClaudeService()

logger = get_logger("module2")
router = APIRouter()

# In-memory job storage (in production, use Redis or database)
processing_jobs = {}

# Plan limits for video upload (MB)
PLAN_LIMITS = {
    "free": 100,
    "starter": 500,
    "pro": 2048
}

ALLOWED_FORMATS = ["mp4", "mov", "avi", "webm"]


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    user = Depends(get_current_user),
    org_id: str = Depends(get_current_organization)
):
    """
    Upload video to Supabase Storage and create video record
    """
    start_time = datetime.utcnow()
    
    try:
        # Get organization plan
        def _get_org():
            return supabase.table("organizations").select("plan").eq("id", org_id).single().execute()
        org_res = await asyncio.to_thread(_get_org)
        org_data = org_res.data if hasattr(org_res, "data") else org_res.get("data")
        plan = org_data.get("plan", "free") if org_data else "free"
        
        # Validate file format
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ALLOWED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Formato não suportado. Use {', '.join(ALLOWED_FORMATS).upper()}."
            )
        
        # Read file and check size
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        
        max_size = PLAN_LIMITS.get(plan, 100)
        if file_size_mb > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo excede o limite do seu plano ({plan}: {max_size}MB)."
            )
        
        # Generate unique filename
        video_id = str(uuid.uuid4())
        storage_path = f"{org_id}/{video_id}.{file_ext}"
        
        # Upload to Supabase Storage
        def _upload():
            return supabase.storage.from_("videos-raw").upload(
                storage_path,
                file_content,
                {"content-type": file.content_type}
            )
        
        upload_res = await asyncio.to_thread(_upload)
        
        # Get public URL
        def _get_url():
            return supabase.storage.from_("videos-raw").get_public_url(storage_path)
        video_url = await asyncio.to_thread(_get_url)
        
        # Extract metadata using FFmpeg
        video_service = VideoProcessingService()
        temp_path = f"/tmp/{video_id}.{file_ext}"
        
        # Save temp file for metadata extraction
        with open(temp_path, "wb") as f:
            f.write(file_content)
        
        metadata = await video_service.extract_metadata(temp_path)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        # Insert video record
        video_title = title or file.filename
        def _insert_video():
            return supabase.table("videos").insert({
                "id": video_id,
                "organization_id": org_id,
                "title": video_title,
                "raw_url": video_url,
                "recording_source": "upload",
                "duration": metadata.get("duration", 0),
                "status": "uploaded",
                "metadata": metadata
            }).execute()
        
        await asyncio.to_thread(_insert_video)
        
        # Log API call
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        await log_api_call(
            org_id, "module2", "/upload", "POST",
            {"filename": file.filename, "size_mb": file_size_mb},
            {"videoId": video_id},
            200, duration_ms
        )
        
        return VideoUploadResponse(
            videoId=video_id,
            videoUrl=video_url,
            duration=metadata.get("duration", 0),
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro no upload do vídeo")


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_video(
    request: TranscriptionRequest,
    user = Depends(get_current_user),
    org_id: str = Depends(get_current_organization)
):
    """
    Transcribe video audio using Deepgram or Whisper
    """
    start_time = datetime.utcnow()
    
    try:
        # Get video from database
        def _get_video():
            return supabase.table("videos").select("*").eq("id", request.videoId).eq("organization_id", org_id).single().execute()
        
        video_res = await asyncio.to_thread(_get_video)
        video_data = video_res.data if hasattr(video_res, "data") else video_res.get("data")
        
        if not video_data:
            raise HTTPException(status_code=404, detail="Vídeo não encontrado")
        
        # Initialize transcription service
        transcription_service = TranscriptionService()
        
        # Transcribe
        result = await transcription_service.transcribe_video(
            video_url=video_data["raw_url"],
            language=request.language
        )
        
        # Update video with transcription
        def _update_video():
            return supabase.table("videos").update({
                "transcription": result["transcription"]
            }).eq("id", request.videoId).execute()
        
        await asyncio.to_thread(_update_video)
        
        # Log API call
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        await log_api_call(
            org_id, "module2", "/transcribe", "POST",
            {"videoId": request.videoId},
            {"success": True},
            200, duration_ms
        )
        
        return TranscriptionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro na transcrição")


@router.post("/detect-silences", response_model=SilenceDetectionResponse)
async def detect_silences(
    request: SilenceDetectionRequest,
    user = Depends(get_current_user),
    org_id: str = Depends(get_current_organization)
):
    """
    Detect silences in video audio using FFmpeg
    """
    start_time = datetime.utcnow()
    
    try:
        # Get video from database
        def _get_video():
            return supabase.table("videos").select("*").eq("id", request.videoId).eq("organization_id", org_id).single().execute()
        
        video_res = await asyncio.to_thread(_get_video)
        video_data = video_res.data if hasattr(video_res, "data") else video_res.get("data")
        
        if not video_data:
            raise HTTPException(status_code=404, detail="Vídeo não encontrado")
        
        # Initialize video processing service
        video_service = VideoProcessingService()
        
        # Detect silences
        result = await video_service.detect_silences(
            video_url=video_data["raw_url"],
            min_silence_duration=request.minSilenceDuration,
            silence_threshold=request.silenceThreshold
        )
        
        # Log API call
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        await log_api_call(
            org_id, "module2", "/detect-silences", "POST",
            {"videoId": request.videoId},
            {"silences_found": len(result["silences"])},
            200, duration_ms
        )
        
        return SilenceDetectionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Silence detection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro na detecção de silêncios")


@router.post("/process", response_model=VideoProcessResponse)
async def process_video(
    request: VideoProcessRequest,
    user = Depends(get_current_user),
    org_id: str = Depends(get_current_organization)
):
    """
    Process video with subtitles, trim, and silence removal (async job)
    """
    start_time = datetime.utcnow()
    
    try:
        # Get video from database
        def _get_video():
            return supabase.table("videos").select("*").eq("id", request.videoId).eq("organization_id", org_id).single().execute()
        
        video_res = await asyncio.to_thread(_get_video)
        video_data = video_res.data if hasattr(video_res, "data") else video_res.get("data")
        
        if not video_data:
            raise HTTPException(status_code=404, detail="Vídeo não encontrado")
        
        # Validate configurations
        if request.trim:
            if request.trim.start >= request.trim.end:
                raise HTTPException(status_code=400, detail="Trim inválido: start deve ser menor que end")
            if request.trim.end - request.trim.start < 3:
                raise HTTPException(status_code=400, detail="Duração mínima de 3 segundos")
        
        # Create job
        job_id = str(uuid.uuid4())
        processing_jobs[job_id] = {
            "status": "processing",
            "progress": 0,
            "currentStep": "Iniciando processamento...",
            "processedVideoUrl": None,
            "processedDuration": None,
            "processedSizeMb": None,
            "error": None
        }
        
        # Start background processing
        asyncio.create_task(
            _process_video_background(job_id, request, video_data, org_id)
        )
        
        # Log API call
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        await log_api_call(
            org_id, "module2", "/process", "POST",
            {"videoId": request.videoId},
            {"jobId": job_id},
            202, duration_ms
        )
        
        return VideoProcessResponse(
            jobId=job_id,
            status="processing",
            message="Vídeo em processamento"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Process video error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao iniciar processamento")


async def _process_video_background(job_id: str, request: VideoProcessRequest, video_data: dict, org_id: str):
    """Background task for video processing"""
    try:
        video_service = VideoProcessingService()
        
        # Update progress
        processing_jobs[job_id]["progress"] = 10
        processing_jobs[job_id]["currentStep"] = "Baixando vídeo..."
        
        # Process video
        result = await video_service.process_video(
            video_url=video_data["raw_url"],
            video_id=request.videoId,
            subtitles=request.subtitles.dict() if request.subtitles else None,
            trim=request.trim.dict() if request.trim else None,
            silence_removal=request.silenceRemoval.dict() if request.silenceRemoval else None,
            progress_callback=lambda p, s: _update_job_progress(job_id, p, s)
        )
        
        # Upload processed video to Supabase Storage
        processing_jobs[job_id]["progress"] = 95
        processing_jobs[job_id]["currentStep"] = "Fazendo upload..."
        
        storage_path = f"{org_id}/processed/{request.videoId}.mp4"
        
        with open(result["output_path"], "rb") as f:
            file_content = f.read()
        
        def _upload():
            return supabase.storage.from_("videos-processed").upload(
                storage_path,
                file_content,
                {"content-type": "video/mp4"}
            )
        
        await asyncio.to_thread(_upload)
        
        def _get_url():
            return supabase.storage.from_("videos-processed").get_public_url(storage_path)
        processed_url = await asyncio.to_thread(_get_url)
        
        # Update video record
        def _update_video():
            return supabase.table("videos").update({
                "processed_url": processed_url,
                "status": "processed",
                "subtitle_style": request.subtitles.style.dict() if request.subtitles else None
            }).eq("id", request.videoId).execute()
        
        await asyncio.to_thread(_update_video)
        
        # Clean up temp files
        if os.path.exists(result["output_path"]):
            os.remove(result["output_path"])
        
        # Update job status
        processing_jobs[job_id]["status"] = "completed"
        processing_jobs[job_id]["progress"] = 100
        processing_jobs[job_id]["currentStep"] = "Concluído"
        processing_jobs[job_id]["processedVideoUrl"] = processed_url
        processing_jobs[job_id]["processedDuration"] = result.get("duration", 0)
        processing_jobs[job_id]["processedSizeMb"] = len(file_content) / (1024 * 1024)
        
    except Exception as e:
        logger.error(f"Background processing error: {e}", exc_info=True)
        processing_jobs[job_id]["status"] = "error"
        processing_jobs[job_id]["error"] = str(e)


def _update_job_progress(job_id: str, progress: int, step: str):
    """Update job progress"""
    if job_id in processing_jobs:
        processing_jobs[job_id]["progress"] = progress
        processing_jobs[job_id]["currentStep"] = step


@router.get("/process/{job_id}/status", response_model=VideoProcessStatus)
async def get_process_status(
    job_id: str,
    user = Depends(get_current_user)
):
    """
    Get processing job status
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    
    job = processing_jobs[job_id]
    
    return VideoProcessStatus(
        jobId=job_id,
        **job
    )


@router.post("/descriptions/generate", response_model=DescriptionGenerateResponse)
async def generate_descriptions(
    request: DescriptionGenerateRequest,
    user = Depends(get_current_user),
    org_id: str = Depends(get_current_organization)
):
    """
    Generate platform-optimized descriptions using Claude
    """
    start_time = datetime.utcnow()
    
    try:
        # Get video with transcription
        def _get_video():
            return supabase.table("videos").select("*").eq("id", request.videoId).eq("organization_id", org_id).single().execute()
        
        video_res = await asyncio.to_thread(_get_video)
        video_data = video_res.data if hasattr(video_res, "data") else video_res.get("data")
        
        if not video_data:
            raise HTTPException(status_code=404, detail="Vídeo não encontrado")
        
        if not video_data.get("transcription"):
            raise HTTPException(status_code=400, detail="Vídeo não possui transcrição")
        
        # Get organization profile for context
        def _get_org():
            return supabase.table("organizations").select("professional_profiles").eq("id", org_id).single().execute()
        org_res = await asyncio.to_thread(_get_org)
        org_data = org_res.data if hasattr(org_res, "data") else org_res.get("data")
        profile_context = str(org_data.get("professional_profiles", "")) if org_data else ""
        
        # Generate descriptions
        descriptions = await ai_service.generate_descriptions(
            transcription=video_data["transcription"],
            platforms=request.platforms,
            tone=request.tone,
            include_hashtags=request.includeHashtags,
            profile_context=profile_context
        )
        
        # Log API call
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        await log_api_call(
            org_id, "module2", "/descriptions/generate", "POST",
            {"videoId": request.videoId, "platforms": request.platforms},
            {"platforms_generated": len(descriptions)},
            200, duration_ms
        )
        
        return DescriptionGenerateResponse(descriptions=descriptions)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Description generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao gerar descrições")


@router.post("/descriptions/regenerate")
async def regenerate_description(
    request: DescriptionRegenerateRequest,
    user = Depends(get_current_user),
    org_id: str = Depends(get_current_organization)
):
    """
    Regenerate description for a single platform with custom instructions
    """
    start_time = datetime.utcnow()
    
    try:
        # Get video with transcription
        def _get_video():
            return supabase.table("videos").select("*").eq("id", request.videoId).eq("organization_id", org_id).single().execute()
        
        video_res = await asyncio.to_thread(_get_video)
        video_data = video_res.data if hasattr(video_res, "data") else video_res.get("data")
        
        if not video_data:
            raise HTTPException(status_code=404, detail="Vídeo não encontrado")
        
        if not video_data.get("transcription"):
            raise HTTPException(status_code=400, detail="Vídeo não possui transcrição")
        
        # Regenerate description
        description = await ai_service.regenerate_description(
            transcription=video_data["transcription"],
            platform=request.platform,
            instructions=request.instructions
        )
        
        # Log API call
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        await log_api_call(
            org_id, "module2", "/descriptions/regenerate", "POST",
            {"videoId": request.videoId, "platform": request.platform},
            {"success": True},
            200, duration_ms
        )
        
        return {request.platform: description}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Description regeneration error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao regenerar descrição")


@router.post("/schedule", response_model=ScheduleResponse)
async def schedule_posts(
    request: ScheduleRequest,
    user = Depends(get_current_user),
    org_id: str = Depends(get_current_organization)
):
    """
    Schedule posts to social media platforms
    
    NOTA: Funcionalidade de agendamento temporariamente desabilitada.
    Será reimplementada com Mixpost em sprint futura.
    """
    raise HTTPException(
        status_code=501,
        detail="Funcionalidade de agendamento temporariamente desabilitada. Será reimplementada em breve."
    )

