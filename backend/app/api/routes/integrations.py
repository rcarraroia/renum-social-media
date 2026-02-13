from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_current_organization
from app.services.metricool import MetricoolService
from app.database import supabase
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("integrations")

class TestMetricoolRequest(BaseModel):
    user_token: str
    user_id: str
    blog_id: Optional[int] = None

@router.post("/metricool/test")
async def test_metricool(
    request: TestMetricoolRequest,
    org_id: str = Depends(get_current_organization)
):
    """
    Testa conexão com Metricool (usado no onboarding)
    """
    # Atualizar tokens temporariamente no organizations
    def _sync_update():
        return supabase.table("organizations").update({
            "metricool_user_token": request.user_token,
            "metricool_user_id": request.user_id,
            "metricool_blog_id": request.blog_id
        }).eq("id", org_id).execute()
    await __import__("asyncio").to_thread(_sync_update)

    metricool = MetricoolService(org_id)
    result = await metricool.test_connection()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Erro ao testar Metricool"))
    return result

@router.get("/metricool/status")
async def get_metricool_status(org_id: str = Depends(get_current_organization)):
    """
    Retorna status da integração Metricool
    """
    org = supabase.table("organizations").select("metricool_user_token, metricool_user_id, metricool_blog_id").eq("id", org_id).single().execute()
    data = org.data if hasattr(org, "data") else org.get("data")
    has_tokens = bool(data and data.get("metricool_user_token"))
    if has_tokens:
        metricool = MetricoolService(org_id)
        test_result = await metricool.test_connection()
        return {
            "connected": test_result.get("success", False),
            "user_id": data.get("metricool_user_id"),
            "blog_id": data.get("metricool_blog_id"),
            "last_sync": None
        }
    else:
        return {"connected": False, "message": "Tokens não configurados"}