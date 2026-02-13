from app.database import supabase
from typing import Any, Dict, Optional

def get_organization(org_id: str) -> Optional[Dict[str, Any]]:
    res = supabase.table("organizations").select("*").eq("id", org_id).single().execute()
    return res.data if hasattr(res, "data") else res.get("data")

def update_organization_tokens(org_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    res = supabase.table("organizations").update(payload).eq("id", org_id).select().single().execute()
    return res.data if hasattr(res, "data") else res.get("data")