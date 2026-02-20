"""
Database connection and session management
"""
from supabase import create_client, Client
from app.config import settings
from typing import AsyncGenerator
from contextlib import asynccontextmanager

# Cliente Supabase global
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)


class AsyncSupabaseSession:
    """
    Wrapper assíncrono para operações do Supabase
    Simula comportamento de AsyncSession do SQLAlchemy
    """
    def __init__(self, client: Client):
        self.client = client
        self._in_transaction = False
    
    async def execute(self, query: str, params: dict = None):
        """
        Executa query SQL raw via Supabase RPC
        """
        import asyncio
        
        def _sync_execute():
            # Para queries SELECT
            if query.strip().upper().startswith("SELECT"):
                # Extrair tabela e condições (simplificado)
                if "FROM" in query.upper():
                    parts = query.upper().split("FROM")[1].split("WHERE")
                    table = parts[0].strip()
                    
                    result = self.client.table(table).select("*")
                    
                    if params:
                        for key, value in params.items():
                            result = result.eq(key, value)
                    
                    return result.execute()
            
            # Para queries INSERT
            elif query.strip().upper().startswith("INSERT"):
                # Extrair tabela (simplificado)
                table = query.split("INTO")[1].split("(")[0].strip()
                
                if params:
                    return self.client.table(table).insert(params).execute()
            
            return None
        
        return await asyncio.to_thread(_sync_execute)
    
    async def commit(self):
        """Commit da transação (no-op para Supabase)"""
        self._in_transaction = False
    
    async def rollback(self):
        """Rollback da transação (no-op para Supabase)"""
        self._in_transaction = False


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSupabaseSession, None]:
    """
    Dependency para obter sessão do banco de dados
    
    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute("SELECT * FROM items")
            return result
    """
    session = AsyncSupabaseSession(supabase)
    try:
        yield session
    finally:
        # Cleanup se necessário
        pass


async def get_organization_by_user_id(user_id: str) -> str | None:
    """
    Busca o ID da organização associada a um usuário
    
    Args:
        user_id: ID do usuário no Supabase Auth
    
    Returns:
        ID da organização ou None se não encontrado
    """
    import asyncio
    
    def _sync_query():
        result = supabase.table("users").select("organization_id").eq("id", user_id).single().execute()
        return result
    
    try:
        result = await asyncio.to_thread(_sync_query)
        data = result.data if hasattr(result, "data") else result.get("data")
        return data.get("organization_id") if data else None
    except Exception:
        return None


async def log_api_call(
    org_id: str,
    module: str,
    endpoint: str,
    method: str,
    request_data: dict,
    response_data: dict,
    status_code: int,
    duration_ms: int
) -> None:
    """
    Registra chamada de API na tabela api_logs
    
    Args:
        org_id: ID da organização
        module: Nome do módulo (ex: "module2")
        endpoint: Endpoint da API (ex: "/upload")
        method: Método HTTP (ex: "POST")
        request_data: Dados da requisição
        response_data: Dados da resposta
        status_code: Código de status HTTP
        duration_ms: Duração da chamada em milissegundos
    """
    import asyncio
    from datetime import datetime
    
    def _sync_log():
        try:
            supabase.table("api_logs").insert({
                "org_id": org_id,
                "module": module,
                "endpoint": endpoint,
                "method": method,
                "request_data": request_data,
                "response_data": response_data,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error logging API call: {e}")
    
    await asyncio.to_thread(_sync_log)
