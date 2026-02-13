import asyncio
from supabase import create_client, Client
from app.config import settings
from typing import Any, Optional, Dict

# create client using service role key for backend operations
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

async def get_organization_by_user_id(user_id: str) -> Optional[str]:
    """
    Busca organization_id do usuário (async wrapper)
    """
    def _sync():
        return supabase.table("users").select("organization_id").eq("id", user_id).single().execute()
    res = await asyncio.to_thread(_sync)
    data = res.data if hasattr(res, "data") else res.get("data")
    return data.get("organization_id") if data else None

async def log_api_call(
    organization_id: Optional[str],
    service: str,
    endpoint: str,
    method: str,
    request_body: Dict[str, Any],
    response_body: Dict[str, Any],
    status_code: int,
    duration_ms: int
) -> None:
    """
    Registra chamada de API na tabela api_logs (async wrapper)
    """
    def _sync_insert():
        return supabase.table("api_logs").insert({
            "organization_id": organization_id,
            "service": service,
            "endpoint": endpoint,
            "method": method,
            "request_body": request_body,
            "response_body": response_body,
            "status_code": status_code,
            "duration_ms": duration_ms
        }).execute()
    try:
        await asyncio.to_thread(_sync_insert)
    except Exception:
        # do not raise from logger helper
        pass