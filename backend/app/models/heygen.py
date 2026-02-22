"""
HeyGen API Models

Pydantic models for HeyGen API integration.
These models handle validation and serialization for HeyGen requests/responses.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime


class HeyGenCredentials(BaseModel):
    """Credenciais HeyGen fornecidas pelo usuário"""
    api_key: str = Field(..., min_length=10, description="HeyGen API Key")
    avatar_id: str = Field(..., min_length=1, description="Default Avatar ID")
    voice_id: str = Field(..., min_length=1, description="Default Voice ID")


class HeyGenApiKeyOnly(BaseModel):
    """Modelo para validação de API Key (não salva no banco)"""
    api_key: str = Field(..., min_length=10, description="HeyGen API Key")


class HeyGenAvatar(BaseModel):
    """Avatar disponível no HeyGen"""
    avatar_id: str = Field(..., description="Unique avatar identifier")
    avatar_name: str = Field(..., description="Avatar display name")
    preview_image_url: str = Field(..., description="Avatar preview image URL")
    gender: str = Field(..., description="Avatar gender")


class HeyGenVoice(BaseModel):
    """Voz disponível no HeyGen"""
    voice_id: str = Field(..., description="Unique voice identifier")
    voice_name: str = Field(..., description="Voice display name")
    language: str = Field(..., description="Voice language code")
    gender: str = Field(..., description="Voice gender")
    preview_audio_url: Optional[str] = Field(None, description="Voice preview audio URL")


class VideoGenerationRequest(BaseModel):
    """Request para geração de vídeo"""
    script: str = Field(
        ..., 
        min_length=1, 
        max_length=5000,
        description="Script text for avatar to narrate"
    )
    title: Optional[str] = Field(
        None, 
        max_length=200,
        description="Video title"
    )
    avatar_id: Optional[str] = Field(
        None,
        description="Avatar ID (uses org default if not provided)"
    )
    voice_id: Optional[str] = Field(
        None,
        description="Voice ID (uses org default if not provided)"
    )
    dimension: Optional[Dict[str, int]] = Field(
        default={"width": 1920, "height": 1080},
        description="Video dimensions"
    )
    
    @validator('script')
    def script_not_empty(cls, v):
        """Validate script is not empty after stripping whitespace"""
        if not v.strip():
            raise ValueError('Script não pode estar vazio')
        return v.strip()


class VideoGenerationResponse(BaseModel):
    """Response de geração de vídeo"""
    success: bool = Field(..., description="Whether generation started successfully")
    job_id: str = Field(..., description="Internal job ID for tracking")
    video_id: str = Field(..., description="HeyGen video ID")
    status: str = Field(..., description="Current status (processing)")
    message: str = Field(..., description="User-friendly status message")


class VideoStatusResponse(BaseModel):
    """Response de status de vídeo"""
    job_id: str = Field(..., description="Internal job ID")
    video_id: str = Field(..., description="HeyGen video ID")
    status: str = Field(
        ..., 
        description="Current status: processing, completed, failed"
    )
    progress: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Progress percentage (0-100)"
    )
    estimated_time_remaining: Optional[int] = Field(
        None,
        description="Estimated seconds remaining"
    )
    video_url: Optional[str] = Field(
        None,
        description="Video URL (when completed)"
    )
    duration: Optional[float] = Field(
        None,
        description="Video duration in seconds"
    )
    thumbnail_url: Optional[str] = Field(
        None,
        description="Video thumbnail URL"
    )
    error: Optional[str] = Field(
        None,
        description="Error message (when failed)"
    )
    created_at: Optional[datetime] = Field(
        None,
        description="Video creation timestamp"
    )


class SendToPostRapidoRequest(BaseModel):
    """Request para enviar vídeo ao PostRápido"""
    video_id: str = Field(..., description="Video job ID to send to PostRápido")
