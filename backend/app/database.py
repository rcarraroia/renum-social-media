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
