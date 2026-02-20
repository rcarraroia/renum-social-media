"""
Sistema de cache distribuído usando Redis
"""
import json
import logging
from typing import Optional, Any, Callable
from functools import wraps
import redis
from app.config import settings

logger = logging.getLogger(__name__)


class CacheManager:
    """Gerenciador de cache com Redis"""
    
    def __init__(self):
        """Inicializa conexão com Redis"""
        try:
            self.redis_client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                password=settings.redis_password,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            # Testar conexão
            self.redis_client.ping()
            self.enabled = True
            logger.info("Cache Redis conectado com sucesso")
        except Exception as e:
            logger.warning(f"Redis não disponível, cache desabilitado: {e}")
            self.redis_client = None
            self.enabled = False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Busca valor do cache
        
        Args:
            key: Chave do cache
        
        Returns:
            Valor do cache ou None se não encontrado
        """
        if not self.enabled:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar cache {key}: {e}")
            return None
    
    def set(
        self,
        key: str,
        value: Any,
        ttl: int = 300
    ) -> bool:
        """
        Salva valor no cache
        
        Args:
            key: Chave do cache
            value: Valor a ser cacheado
            ttl: Tempo de vida em segundos (default: 5 minutos)
        
        Returns:
            True se salvou com sucesso
        """
        if not self.enabled:
            return False
        
        try:
            serialized = json.dumps(value)
            self.redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar cache {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Remove valor do cache
        
        Args:
            key: Chave do cache
        
        Returns:
            True se removeu com sucesso
        """
        if not self.enabled:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar cache {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Remove múltiplas chaves por padrão
        
        Args:
            pattern: Padrão de chaves (ex: "user:*")
        
        Returns:
            Número de chaves removidas
        """
        if not self.enabled:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Erro ao deletar padrão {pattern}: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """
        Verifica se chave existe no cache
        
        Args:
            key: Chave do cache
        
        Returns:
            True se existe
        """
        if not self.enabled:
            return False
        
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Erro ao verificar cache {key}: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Incrementa valor numérico no cache
        
        Args:
            key: Chave do cache
            amount: Quantidade a incrementar
        
        Returns:
            Novo valor ou None se erro
        """
        if not self.enabled:
            return None
        
        try:
            return self.redis_client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Erro ao incrementar cache {key}: {e}")
            return None
    
    def get_ttl(self, key: str) -> Optional[int]:
        """
        Retorna tempo de vida restante da chave
        
        Args:
            key: Chave do cache
        
        Returns:
            TTL em segundos ou None
        """
        if not self.enabled:
            return None
        
        try:
            ttl = self.redis_client.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            logger.error(f"Erro ao buscar TTL {key}: {e}")
            return None


# Instância global do cache
cache = CacheManager()


def cached(
    ttl: int = 300,
    key_prefix: str = "",
    key_builder: Optional[Callable] = None
):
    """
    Decorator para cachear resultado de função
    
    Args:
        ttl: Tempo de vida em segundos (default: 5 minutos)
        key_prefix: Prefixo da chave de cache
        key_builder: Função customizada para gerar chave
    
    Example:
        @cached(ttl=600, key_prefix="user")
        def get_user(user_id: str):
            return db.query(User).filter(User.id == user_id).first()
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Gerar chave de cache
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Chave padrão: prefix:func_name:args:kwargs
                args_str = ":".join(str(arg) for arg in args)
                kwargs_str = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = f"{key_prefix}:{func.__name__}:{args_str}:{kwargs_str}"
            
            # Tentar buscar do cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value
            
            # Executar função
            logger.debug(f"Cache miss: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Salvar no cache
            cache.set(cache_key, result, ttl)
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Gerar chave de cache
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                args_str = ":".join(str(arg) for arg in args)
                kwargs_str = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = f"{key_prefix}:{func.__name__}:{args_str}:{kwargs_str}"
            
            # Tentar buscar do cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value
            
            # Executar função
            logger.debug(f"Cache miss: {cache_key}")
            result = func(*args, **kwargs)
            
            # Salvar no cache
            cache.set(cache_key, result, ttl)
            
            return result
        
        # Retornar wrapper apropriado
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


def invalidate_cache(pattern: str) -> int:
    """
    Invalida cache por padrão
    
    Args:
        pattern: Padrão de chaves (ex: "user:*")
    
    Returns:
        Número de chaves removidas
    
    Example:
        # Invalidar cache de usuário específico
        invalidate_cache("user:123:*")
        
        # Invalidar todo cache de usuários
        invalidate_cache("user:*")
    """
    return cache.delete_pattern(pattern)


# Funções de conveniência para casos comuns
def cache_user_data(user_id: str, data: dict, ttl: int = 600) -> bool:
    """Cachear dados de usuário"""
    return cache.set(f"user:{user_id}", data, ttl)


def get_cached_user_data(user_id: str) -> Optional[dict]:
    """Buscar dados de usuário do cache"""
    return cache.get(f"user:{user_id}")


def invalidate_user_cache(user_id: str) -> int:
    """Invalidar todo cache de usuário"""
    return cache.delete_pattern(f"user:{user_id}:*")


def cache_organization_data(org_id: str, data: dict, ttl: int = 600) -> bool:
    """Cachear dados de organização"""
    return cache.set(f"org:{org_id}", data, ttl)


def get_cached_organization_data(org_id: str) -> Optional[dict]:
    """Buscar dados de organização do cache"""
    return cache.get(f"org:{org_id}")


def invalidate_organization_cache(org_id: str) -> int:
    """Invalidar todo cache de organização"""
    return cache.delete_pattern(f"org:{org_id}:*")


def cache_analytics(org_id: str, period: str, data: dict, ttl: int = 3600) -> bool:
    """Cachear dados de analytics"""
    return cache.set(f"analytics:{org_id}:{period}", data, ttl)


def get_cached_analytics(org_id: str, period: str) -> Optional[dict]:
    """Buscar analytics do cache"""
    return cache.get(f"analytics:{org_id}:{period}")
