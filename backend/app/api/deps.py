from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_organization_by_user_id
from app.utils.logger import get_logger
import asyncio
from app import database

logger = get_logger("deps")
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate Supabase JWT token and return user object (calls Supabase REST verify)
    The Supabase Python client does not expose a direct JWT verification helper, so we call auth.get_user.
    """
    token = credentials.credentials
    try:
        # supabase.auth.get_user expects a bearer token parameter in v2 client; calling in thread
        def _sync():
            return database.supabase.auth.get_user(token)
        res = await asyncio.to_thread(_sync)
        user = res.data.user if hasattr(res, "data") and getattr(res.data, "user", None) else getattr(res, "user", None)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")
        return user
    except Exception as e:
        logger.error("Auth failure", exc_info=True)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autenticado")

async def get_current_organization(user = Depends(get_current_user)):
    org_id = await get_organization_by_user_id(user.id)
    if not org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organização não encontrada")
    return org_id

def require_plan(min_plan: str):
    async def plan_checker(user = Depends(get_current_user)):
        org_id = await get_organization_by_user_id(user.id)
        def _sync():
            return database.supabase.table("organizations").select("plan").eq("id", org_id).single().execute()
        res = await asyncio.to_thread(_sync)
        data = res.data if hasattr(res, "data") else res.get("data")
        user_plan = data.get("plan", "free") if data else "free"
        plan_hierarchy = {"free": 0, "starter": 1, "pro": 2}
        if plan_hierarchy.get(user_plan, 0) < plan_hierarchy.get(min_plan, 0):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Este recurso requer plano {min_plan}")
        return user
    return plan_checker