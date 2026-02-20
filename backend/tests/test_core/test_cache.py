"""
Testes do sistema de cache
"""
import pytest
import time
from app.core.cache import (
    CacheManager,
    cached,
    invalidate_cache,
    cache_user_data,
    get_cached_user_data,
    invalidate_user_cache
)


class TestCacheManager:
    """Testes do gerenciador de cache"""
    
    def setup_method(self):
        """Setup antes de cada teste"""
        self.cache = CacheManager()
        # Limpar cache de teste
        if self.cache.enabled:
            self.cache.delete_pattern("test:*")
    
    def test_cache_set_and_get(self):
        """Testa salvar e buscar do cache"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        # Salvar no cache
        result = self.cache.set("test:key1", {"data": "value"}, ttl=60)
        assert result is True
        
        # Buscar do cache
        value = self.cache.get("test:key1")
        assert value == {"data": "value"}
    
    def test_cache_expiration(self):
        """Testa expiração do cache"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        # Salvar com TTL curto
        self.cache.set("test:expire", {"data": "temp"}, ttl=1)
        
        # Deve existir imediatamente
        assert self.cache.exists("test:expire") is True
        
        # Aguardar expiração
        time.sleep(2)
        
        # Não deve mais existir
        assert self.cache.exists("test:expire") is False
    
    def test_cache_delete(self):
        """Testa remoção do cache"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        # Salvar no cache
        self.cache.set("test:delete", {"data": "value"})
        assert self.cache.exists("test:delete") is True
        
        # Deletar
        result = self.cache.delete("test:delete")
        assert result is True
        assert self.cache.exists("test:delete") is False
    
    def test_cache_delete_pattern(self):
        """Testa remoção por padrão"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        # Salvar múltiplas chaves
        self.cache.set("test:user:1", {"id": 1})
        self.cache.set("test:user:2", {"id": 2})
        self.cache.set("test:user:3", {"id": 3})
        
        # Deletar por padrão
        deleted = self.cache.delete_pattern("test:user:*")
        assert deleted == 3
        
        # Verificar que foram deletadas
        assert self.cache.exists("test:user:1") is False
        assert self.cache.exists("test:user:2") is False
        assert self.cache.exists("test:user:3") is False
    
    def test_cache_increment(self):
        """Testa incremento de valor"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        # Incrementar (cria se não existe)
        value = self.cache.increment("test:counter", 1)
        assert value == 1
        
        # Incrementar novamente
        value = self.cache.increment("test:counter", 5)
        assert value == 6
    
    def test_cache_get_ttl(self):
        """Testa buscar TTL restante"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        # Salvar com TTL
        self.cache.set("test:ttl", {"data": "value"}, ttl=60)
        
        # Buscar TTL
        ttl = self.cache.get_ttl("test:ttl")
        assert ttl is not None
        assert 50 < ttl <= 60  # Deve estar entre 50 e 60 segundos
    
    def test_cache_fallback_when_disabled(self):
        """Testa que cache funciona mesmo quando Redis está indisponível"""
        # Criar cache desabilitado
        cache_disabled = CacheManager()
        cache_disabled.enabled = False
        cache_disabled.redis_client = None
        
        # Operações devem retornar valores padrão sem erro
        assert cache_disabled.get("any_key") is None
        assert cache_disabled.set("any_key", "value") is False
        assert cache_disabled.delete("any_key") is False
        assert cache_disabled.exists("any_key") is False
        assert cache_disabled.increment("any_key") is None


class TestCachedDecorator:
    """Testes do decorator @cached"""
    
    def setup_method(self):
        """Setup antes de cada teste"""
        self.cache = CacheManager()
        if self.cache.enabled:
            self.cache.delete_pattern("test:*")
        self.call_count = 0
    
    def test_cached_decorator_sync(self):
        """Testa decorator em função síncrona"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        @cached(ttl=60, key_prefix="test")
        def expensive_function(x: int) -> int:
            self.call_count += 1
            return x * 2
        
        # Primeira chamada - executa função
        result1 = expensive_function(5)
        assert result1 == 10
        assert self.call_count == 1
        
        # Segunda chamada - usa cache
        result2 = expensive_function(5)
        assert result2 == 10
        assert self.call_count == 1  # Não incrementou
        
        # Chamada com argumento diferente - executa função
        result3 = expensive_function(10)
        assert result3 == 20
        assert self.call_count == 2
    
    @pytest.mark.asyncio
    async def test_cached_decorator_async(self):
        """Testa decorator em função assíncrona"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        @cached(ttl=60, key_prefix="test")
        async def async_expensive_function(x: int) -> int:
            self.call_count += 1
            return x * 3
        
        # Primeira chamada - executa função
        result1 = await async_expensive_function(5)
        assert result1 == 15
        assert self.call_count == 1
        
        # Segunda chamada - usa cache
        result2 = await async_expensive_function(5)
        assert result2 == 15
        assert self.call_count == 1  # Não incrementou
    
    def test_cached_with_custom_key_builder(self):
        """Testa decorator com key builder customizado"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        def custom_key(user_id: str, action: str) -> str:
            return f"test:custom:{user_id}:{action}"
        
        @cached(ttl=60, key_builder=custom_key)
        def user_action(user_id: str, action: str) -> str:
            self.call_count += 1
            return f"{user_id} did {action}"
        
        # Primeira chamada
        result1 = user_action("user123", "login")
        assert result1 == "user123 did login"
        assert self.call_count == 1
        
        # Segunda chamada - usa cache
        result2 = user_action("user123", "login")
        assert result2 == "user123 did login"
        assert self.call_count == 1


class TestCacheHelpers:
    """Testes das funções helper de cache"""
    
    def setup_method(self):
        """Setup antes de cada teste"""
        self.cache = CacheManager()
        if self.cache.enabled:
            self.cache.delete_pattern("user:*")
            self.cache.delete_pattern("org:*")
    
    def test_cache_user_data(self):
        """Testa cachear dados de usuário"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        user_data = {"id": "123", "name": "Test User"}
        
        # Salvar
        result = cache_user_data("123", user_data)
        assert result is True
        
        # Buscar
        cached = get_cached_user_data("123")
        assert cached == user_data
    
    def test_invalidate_user_cache(self):
        """Testa invalidar cache de usuário"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        # Salvar múltiplos dados do usuário
        self.cache.set("user:123:profile", {"name": "Test"})
        self.cache.set("user:123:settings", {"theme": "dark"})
        self.cache.set("user:123:videos", [])
        
        # Invalidar tudo
        deleted = invalidate_user_cache("123")
        assert deleted == 3
        
        # Verificar que foram deletados
        assert self.cache.exists("user:123:profile") is False
        assert self.cache.exists("user:123:settings") is False
        assert self.cache.exists("user:123:videos") is False
    
    def test_invalidate_cache_pattern(self):
        """Testa invalidar cache por padrão"""
        if not self.cache.enabled:
            pytest.skip("Redis não disponível")
        
        # Salvar dados
        self.cache.set("org:1:users", [])
        self.cache.set("org:1:videos", [])
        self.cache.set("org:2:users", [])
        
        # Invalidar apenas org 1
        deleted = invalidate_cache("org:1:*")
        assert deleted == 2
        
        # Org 2 deve continuar
        assert self.cache.exists("org:2:users") is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
