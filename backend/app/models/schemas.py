from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TestMetricoolRequest(BaseModel):
    user_token: str
    user_id: str
    blog_id: Optional[int] = None

class MetricoolStatusResponse(BaseModel):
    connected: bool
    user_id: Optional[str]
    blog_id: Optional[int]
    last_sync: Optional[str]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str

# ===== MODULE 2 SCHEMAS =====

# Upload
class VideoUploadResponse(BaseModel):
    videoId: str
    videoUrl: str
    duration: float
    metadata: Dict[str, Any]

# Transcription
class TranscriptionSegment(BaseModel):
    start: float
    end: float
    text: str

class TranscriptionRequest(BaseModel):
    videoId: str
    language: str = "pt"

class TranscriptionResponse(BaseModel):
    transcription: str
    segments: List[TranscriptionSegment]
    waveform: List[float]
    language: str
    duration: float

# Silence Detection
class SilenceItem(BaseModel):
    start: float
    end: float
    duration: float

class SilenceDetectionRequest(BaseModel):
    videoId: str
    minSilenceDuration: float = 1.0
    silenceThreshold: int = -30

class SilenceDetectionResponse(BaseModel):
    silences: List[SilenceItem]
    totalSilenceDuration: float
    videoDuration: float
    silencePercentage: float

# Video Processing
class SubtitleStyle(BaseModel):
    preset: str = "word-by-word"
    textColor: str = "#FFFFFF"
    highlightColor: str = "#FFD700"
    backgroundColor: str = "#000000"
    backgroundOpacity: float = 0.7
    fontFamily: str = "Montserrat"
    fontSize: int = 32
    position: str = "bottom"
    marginBottom: int = 10

class SubtitleConfig(BaseModel):
    enabled: bool
    style: SubtitleStyle
    segments: List[TranscriptionSegment]

class TrimConfig(BaseModel):
    start: float
    end: float

class SilenceRemovalConfig(BaseModel):
    enabled: bool
    silences: List[SilenceItem]

class VideoProcessRequest(BaseModel):
    videoId: str
    subtitles: Optional[SubtitleConfig] = None
    trim: Optional[TrimConfig] = None
    silenceRemoval: Optional[SilenceRemovalConfig] = None

class VideoProcessResponse(BaseModel):
    jobId: str
    status: str
    message: str

class VideoProcessStatus(BaseModel):
    jobId: str
    status: str
    progress: int
    currentStep: str
    processedVideoUrl: Optional[str] = None
    processedDuration: Optional[float] = None
    processedSizeMb: Optional[float] = None
    error: Optional[str] = None

# Description Generation
class PlatformDescription(BaseModel):
    text: str
    characterCount: int
    maxCharacters: int
    hashtags: List[str]

class DescriptionGenerateRequest(BaseModel):
    videoId: str
    platforms: List[str]
    tone: str = "profissional"
    includeHashtags: bool = True

class DescriptionGenerateResponse(BaseModel):
    descriptions: Dict[str, PlatformDescription]

class DescriptionRegenerateRequest(BaseModel):
    videoId: str
    platform: str
    instructions: str

# Scheduling
class ScheduleItem(BaseModel):
    platform: str
    description: str
    scheduledAt: str

class ScheduleRequest(BaseModel):
    videoId: str
    schedules: List[ScheduleItem]

class ScheduledPost(BaseModel):
    postId: str
    platform: str
    scheduledAt: str
    status: str

class ScheduleResponse(BaseModel):
    scheduled: List[ScheduledPost]
    message: str
