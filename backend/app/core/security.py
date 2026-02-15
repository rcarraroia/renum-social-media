"""
Security middleware for authentication and authorization
"""
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Tuple
from app.database import supabase
from app.utils.logger import setup_logger
import asyncio

logger = setup_logger()
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Tuple[str, str]:
    """
    Extract and validate JWT token from Authorization header
    
    Returns:
        Tuple of (user_id, organization_id)
        
    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    token = credentials.credentials
    
    try:
        # Validate token with Supabase Auth
        def _sync_get_user():
            return supabase.auth.get_user(token)
        
        response = await asyncio.to_thread(_sync_get_user)
        user = response.user if hasattr(response, 'user') else response.get('user')
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        
        user_id = user.id
        
        # Get organization_id from users table
        def _sync_get_org():
            return supabase.table("users").select("organization_id").eq("id", user_id).single().execute()
        
        org_response = await asyncio.to_thread(_sync_get_org)
        org_data = org_response.data if hasattr(org_response, 'data') else org_response.get('data')
        
        if not org_data or not org_data.get('organization_id'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User organization not found"
            )
        
        organization_id = org_data['organization_id']
        
        return user_id, organization_id
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

async def verify_plan(
    required_plan: str,
    user_org: Tuple[str, str] = Depends(get_current_user)
) -> Tuple[str, str]:
    """
    Verify that user's organization has the required plan
    
    Args:
        required_plan: Minimum plan required ('free', 'starter', 'pro')
        user_org: Tuple of (user_id, organization_id) from get_current_user
        
    Returns:
        Tuple of (user_id, organization_id)
        
    Raises:
        HTTPException: 403 if plan is insufficient
    """
    user_id, organization_id = user_org
    
    # Plan hierarchy
    plan_hierarchy = {
        'free': 0,
        'starter': 1,
        'pro': 2
    }
    
    try:
        # Get organization plan
        def _sync_get_plan():
            return supabase.table("organizations").select("plan").eq("id", organization_id).single().execute()
        
        response = await asyncio.to_thread(_sync_get_plan)
        org_data = response.data if hasattr(response, 'data') else response.get('data')
        
        if not org_data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organization not found"
            )
        
        current_plan = org_data.get('plan', 'free')
        
        # Check if current plan meets requirement
        if plan_hierarchy.get(current_plan, 0) < plan_hierarchy.get(required_plan, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires {required_plan} plan or higher. Current plan: {current_plan}"
            )
        
        return user_id, organization_id
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Plan verification error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Plan verification failed"
        )

def require_pro_plan(user_org: Tuple[str, str] = Depends(get_current_user)) -> Tuple[str, str]:
    """Dependency that requires Pro plan"""
    return verify_plan('pro', user_org)

def require_starter_plan(user_org: Tuple[str, str] = Depends(get_current_user)) -> Tuple[str, str]:
    """Dependency that requires Starter plan or higher"""
    return verify_plan('starter', user_org)
