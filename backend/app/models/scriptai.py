from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class GenerateScriptRequest(BaseModel):
    """Request para geração de script."""
    topic: str = Field(..., min_length=3, max_length=500, description="Tema do script")
    audience: str = Field(..., description="Audiência alvo")
    tone: str = Field(..., description="Tom do script")
    duration: int = Field(..., description="Duração em segundos")
    language: str = Field(default="pt-BR", description="Idioma do script")

    @validator("audience")
    def validate_audience(cls, v):
        allowed = ["mlm", "politics", "general"]
        if v not in allowed:
            raise ValueError(f"audience deve ser um de: {', '.join(allowed)}")
        return v

    @validator("tone")
    def validate_tone(cls, v):
        allowed = ["informal", "professional", "inspirational"]
        if v not in allowed:
            raise ValueError(f"tone deve ser um de: {', '.join(allowed)}")
        return v

    @validator("duration")
    def validate_duration(cls, v):
        allowed = [30, 60, 90]
        if v not in allowed:
            raise ValueError(f"duration deve ser um de: {', '.join(map(str, allowed))}")
        return v


class RegenerateScriptRequest(GenerateScriptRequest):
    """Request para regeneração de script com feedback."""
    feedback: str = Field(..., min_length=10, max_length=500, description="Feedback para ajuste")


class ScriptResponse(BaseModel):
    """Response de geração de script."""
    script: str
    sources: List[Dict[str, str]]  # [{"title": str, "url": str}]
    metadata: Dict[str, Any]  # {topic, audience, tone, duration, language, word_count, etc}


class SaveDraftRequest(BaseModel):
    """Request para salvar rascunho."""
    title: str = Field(..., min_length=3, max_length=200)
    script: str = Field(..., min_length=10)
    metadata: Dict[str, Any]  # Parâmetros de geração + fontes


class UpdateDraftRequest(BaseModel):
    """Request para atualizar rascunho."""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    script: Optional[str] = Field(None, min_length=10)
    metadata: Optional[Dict[str, Any]] = None


class DraftResponse(BaseModel):
    """Response de rascunho."""
    id: str
    title: str
    script: str
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class DraftListResponse(BaseModel):
    """Response de listagem de rascunhos."""
    drafts: List[Dict[str, Any]]
    total: int
