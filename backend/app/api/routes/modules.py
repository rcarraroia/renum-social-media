from fastapi import APIRouter, Depends
from app.api.deps import get_current_organization, require_plan

router = APIRouter()

@router.post("/1/generate-script")
async def module1_generate_script(org_id: str = Depends(get_current_organization)):
    return {"message": "Módulo 1 em desenvolvimento", "coming_soon": True}

@router.post("/2/upload")
async def module2_upload(org_id: str = Depends(get_current_organization)):
    return {"message": "Módulo 2 em desenvolvimento", "coming_soon": True}

@router.post("/3/create-avatar-video")
async def module3_create_avatar_video(org_id: str = Depends(get_current_organization), user = Depends(require_plan("pro"))):
    return {"message": "Módulo 3 em desenvolvimento", "coming_soon": True}