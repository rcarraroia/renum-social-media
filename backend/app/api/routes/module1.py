from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.api.deps import get_current_organization, get_current_user
from app.services.tavily import TavilyService
from app.services.claude import ClaudeService
from app.models.scriptai import (
    GenerateScriptRequest, RegenerateScriptRequest, ScriptResponse,
    SaveDraftRequest, UpdateDraftRequest, DraftResponse, DraftListResponse
)
from app.database import supabase
from app.utils.logger import get_logger
from datetime import datetime
import asyncio
import uuid

router = APIRouter()
logger = get_logger("module1")


@router.post("/generate", response_model=ScriptResponse)
async def generate_script(
    request: GenerateScriptRequest,
    org_id: str = Depends(get_current_organization)
):
    """
    Gera script inteligente baseado em tema e parâmetros.

    Fluxo:
    1. Validar inputs
    2. Pesquisar contexto via Tavily
    3. Gerar script via Claude
    4. Retornar script + fontes + metadata
    5. Registrar em api_logs
    """
    start_time = datetime.utcnow()

    try:
        # Validar API keys antes de processar
        from app.config import settings
        if not settings.tavily_api_key or settings.tavily_api_key == "placeholder":
            logger.error("Tavily API key not configured")
            raise HTTPException(
                status_code=503,
                detail="Serviço de pesquisa não configurado. Contate o administrador."
            )
        
        if not settings.anthropic_api_key or settings.anthropic_api_key == "placeholder":
            logger.error("Anthropic API key not configured")
            raise HTTPException(
                status_code=503,
                detail="Serviço de geração de script não configurado. Contate o administrador."
            )
        
        # Tavily pesquisa contexto
        tavily_service = TavilyService()
        search_result = await tavily_service.search(
            request.topic,
            search_depth="advanced",
            max_results=5
        )
        await tavily_service.close()

        if "error" in search_result:
            logger.error(f"Tavily error: {search_result['error']}")
            raise HTTPException(
                status_code=502,
                detail=f"Erro na pesquisa: {search_result['error']['message']}"
            )

        # Construir contexto da pesquisa
        research_context = ""
        sources = []
        for result in search_result.get("results", []):
            research_context += f"\n\nTítulo: {result['title']}\nURL: {result['url']}\nConteúdo: {result['content']}"
            sources.append({
                "title": result["title"],
                "url": result["url"]
            })

        # Claude gera script
        claude_service = ClaudeService()
        script_result = await claude_service.generate_script_from_research(
            topic=request.topic,
            research_context=research_context,
            audience=request.audience,
            tone=request.tone,
            duration_seconds=request.duration,
            language=request.language
        )

        if not script_result.get("success"):
            logger.error(f"Claude error: {script_result}")
            raise HTTPException(
                status_code=502,
                detail="Erro ao gerar script. Tente novamente."
            )

        # Construir metadata
        metadata = {
            "generation_params": {
                "topic": request.topic,
                "audience": request.audience,
                "tone": request.tone,
                "duration": request.duration,
                "language": request.language
            },
            "sources": sources,
            "script_stats": {
                "word_count": script_result.get("word_count", 0),
                "estimated_duration": script_result.get("estimated_duration", 0),
                "generated_at": datetime.utcnow().isoformat(),
                "model": script_result.get("model", "")
            }
        }

        # Registrar em api_logs
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        def _log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "1",
                "endpoint": "/generate",
                "status_code": 200
            }).execute()
        await asyncio.to_thread(_log)

        return ScriptResponse(
            script=script_result["script"],
            sources=sources,
            metadata=metadata
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_script: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno. Tente novamente."
        )


@router.post("/regenerate", response_model=ScriptResponse)
async def regenerate_script(
    request: RegenerateScriptRequest,
    org_id: str = Depends(get_current_organization)
):
    """
    Regenera script com feedback adicional do usuário.

    Fluxo idêntico ao generate_script, mas inclui feedback no prompt.
    """
    start_time = datetime.utcnow()

    try:
        # Validar API keys antes de processar
        from app.config import settings
        if not settings.tavily_api_key or settings.tavily_api_key == "placeholder":
            logger.error("Tavily API key not configured")
            raise HTTPException(
                status_code=503,
                detail="Serviço de pesquisa não configurado. Contate o administrador."
            )
        
        if not settings.anthropic_api_key or settings.anthropic_api_key == "placeholder":
            logger.error("Anthropic API key not configured")
            raise HTTPException(
                status_code=503,
                detail="Serviço de geração de script não configurado. Contate o administrador."
            )
        
        # Tavily pesquisa contexto
        tavily_service = TavilyService()
        search_result = await tavily_service.search(
            request.topic,
            search_depth="advanced",
            max_results=5
        )
        await tavily_service.close()

        if "error" in search_result:
            logger.error(f"Tavily error: {search_result['error']}")
            raise HTTPException(
                status_code=502,
                detail=f"Erro na pesquisa: {search_result['error']['message']}"
            )

        # Construir contexto da pesquisa
        research_context = ""
        sources = []
        for result in search_result.get("results", []):
            research_context += f"\n\nTítulo: {result['title']}\nURL: {result['url']}\nConteúdo: {result['content']}"
            sources.append({
                "title": result["title"],
                "url": result["url"]
            })

        # Claude gera script com feedback
        claude_service = ClaudeService()
        script_result = await claude_service.generate_script_from_research(
            topic=request.topic,
            research_context=research_context,
            audience=request.audience,
            tone=request.tone,
            duration_seconds=request.duration,
            language=request.language,
            feedback=request.feedback
        )

        if not script_result.get("success"):
            logger.error(f"Claude error: {script_result}")
            raise HTTPException(
                status_code=502,
                detail="Erro ao gerar script. Tente novamente."
            )

        # Construir metadata
        metadata = {
            "generation_params": {
                "topic": request.topic,
                "audience": request.audience,
                "tone": request.tone,
                "duration": request.duration,
                "language": request.language
            },
            "sources": sources,
            "script_stats": {
                "word_count": script_result.get("word_count", 0),
                "estimated_duration": script_result.get("estimated_duration", 0),
                "generated_at": datetime.utcnow().isoformat(),
                "model": script_result.get("model", "")
            },
            "feedback_history": [
                {
                    "feedback": request.feedback,
                    "applied_at": datetime.utcnow().isoformat()
                }
            ]
        }

        # Registrar em api_logs
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        def _log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "1",
                "endpoint": "/regenerate",
                "status_code": 200
            }).execute()
        await asyncio.to_thread(_log)

        return ScriptResponse(
            script=script_result["script"],
            sources=sources,
            metadata=metadata
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in regenerate_script: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno. Tente novamente."
        )
@router.post("/drafts", response_model=DraftResponse)
async def save_draft(
    request: SaveDraftRequest,
    org_id: str = Depends(get_current_organization),
    user = Depends(get_current_user)
):
    """
    Salva script como rascunho.

    Cria registro na tabela videos com:
    - recording_source='script'
    - status='draft'
    - script, metadata
    """
    start_time = datetime.utcnow()

    try:
        draft_id = str(uuid.uuid4())

        # Inserir registro na tabela videos
        def _insert():
            return supabase.table("videos").insert({
                "id": draft_id,
                "organization_id": org_id,
                "user_id": user.id,
                "title": request.title,
                "script": request.script,
                "metadata": request.metadata,
                "recording_source": "script",
                "status": "draft"
            }).execute()
        
        result = await asyncio.to_thread(_insert)

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Erro ao salvar rascunho. Tente novamente."
            )

        # Registrar em api_logs
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        def _log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "1",
                "endpoint": "/drafts",
                "status_code": 200
            }).execute()
        await asyncio.to_thread(_log)

        return DraftResponse(
            id=draft_id,
            title=request.title,
            script=request.script,
            metadata=request.metadata,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in save_draft: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno. Tente novamente."
        )


@router.get("/drafts", response_model=DraftListResponse)
async def list_drafts(
    org_id: str = Depends(get_current_organization)
):
    """
    Lista todos os rascunhos da organização.

    Filtra por recording_source='script' e status='draft'.
    Aplica RLS automaticamente.
    """
    start_time = datetime.utcnow()

    try:
        def _select():
            return supabase.table("videos").select(
                "id, title, script, metadata, created_at, updated_at"
            ).eq("recording_source", "script").eq("status", "draft").order(
                "created_at", desc=True
            ).execute()
        
        result = await asyncio.to_thread(_select)

        drafts = []
        for item in result.data:
            drafts.append({
                "id": item["id"],
                "title": item["title"],
                "script": item["script"],
                "topic": item["metadata"].get("generation_params", {}).get("topic", ""),
                "audience": item["metadata"].get("generation_params", {}).get("audience", ""),
                "created_at": item["created_at"],
                "updated_at": item["updated_at"]
            })

        # Registrar em api_logs
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        def _log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "1",
                "endpoint": "/drafts",
                "status_code": 200
            }).execute()
        await asyncio.to_thread(_log)

        return DraftListResponse(
            drafts=drafts,
            total=len(drafts)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in list_drafts: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno. Tente novamente."
        )


@router.get("/drafts/{draft_id}", response_model=DraftResponse)
async def get_draft(
    draft_id: str,
    org_id: str = Depends(get_current_organization)
):
    """
    Obtém detalhes de um rascunho específico.

    Valida que o rascunho pertence à organização do usuário.
    """
    start_time = datetime.utcnow()

    try:
        def _select():
            return supabase.table("videos").select(
                "id, title, script, metadata, created_at, updated_at"
            ).eq("id", draft_id).eq("recording_source", "script").eq("status", "draft").execute()
        
        result = await asyncio.to_thread(_select)

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Rascunho não encontrado."
            )

        item = result.data[0]

        # Registrar em api_logs
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        def _log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "1",
                "endpoint": f"/drafts/{draft_id}",
                "status_code": 200
            }).execute()
        await asyncio.to_thread(_log)

        return DraftResponse(
            id=item["id"],
            title=item["title"],
            script=item["script"],
            metadata=item["metadata"],
            created_at=item["created_at"],
            updated_at=item["updated_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_draft: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno. Tente novamente."
        )


@router.put("/drafts/{draft_id}", response_model=DraftResponse)
async def update_draft(
    draft_id: str,
    request: UpdateDraftRequest,
    org_id: str = Depends(get_current_organization)
):
    """
    Atualiza um rascunho existente.

    Permite atualizar: title, script, metadata.
    Atualiza campo updated_at automaticamente.
    """
    start_time = datetime.utcnow()

    try:
        # Verificar se o rascunho existe e pertence à organização
        def _check():
            return supabase.table("videos").select("id").eq(
                "id", draft_id
            ).eq("recording_source", "script").eq("status", "draft").execute()
        
        check_result = await asyncio.to_thread(_check)

        if not check_result.data:
            raise HTTPException(
                status_code=404,
                detail="Rascunho não encontrado."
            )

        # Construir update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}

        if request.title is not None:
            update_data["title"] = request.title
        if request.script is not None:
            update_data["script"] = request.script
        if request.metadata is not None:
            update_data["metadata"] = request.metadata

        # Atualizar rascunho
        def _update():
            return supabase.table("videos").update(
                update_data
            ).eq("id", draft_id).execute()
        
        result = await asyncio.to_thread(_update)

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Erro ao atualizar rascunho. Tente novamente."
            )

        item = result.data[0]

        # Registrar em api_logs
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        def _log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "1",
                "endpoint": f"/drafts/{draft_id}",
                "status_code": 200
            }).execute()
        await asyncio.to_thread(_log)

        return DraftResponse(
            id=item["id"],
            title=item["title"],
            script=item["script"],
            metadata=item["metadata"],
            created_at=item["created_at"],
            updated_at=item["updated_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_draft: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno. Tente novamente."
        )


@router.delete("/drafts/{draft_id}")
async def delete_draft(
    draft_id: str,
    org_id: str = Depends(get_current_organization)
):
    """
    Deleta um rascunho.

    Remove registro da tabela videos.
    RLS garante que apenas rascunhos da organização podem ser deletados.
    """
    start_time = datetime.utcnow()

    try:
        # Deletar rascunho
        def _delete():
            return supabase.table("videos").delete().eq(
                "id", draft_id
            ).eq("recording_source", "script").eq("status", "draft").execute()
        
        result = await asyncio.to_thread(_delete)

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Rascunho não encontrado."
            )

        # Registrar em api_logs
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        def _log():
            return supabase.table("api_logs").insert({
                "organization_id": org_id,
                "module": "1",
                "endpoint": f"/drafts/{draft_id}",
                "status_code": 204
            }).execute()
        await asyncio.to_thread(_log)

        return {"message": "Rascunho deletado com sucesso."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in delete_draft: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno. Tente novamente."
        )
