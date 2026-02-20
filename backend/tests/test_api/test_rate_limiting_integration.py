"""
Testes de integração para rate limiting

Valida que rate limiting funciona corretamente em endpoints críticos.
"""
import pytest
from httpx import AsyncClient
from fastapi import status
import asyncio


@pytest.mark.integration
class TestRateLimitingIntegration:
    """Testes de integração para rate limiting"""
    
    @pytest.mark.asyncio
    async def test_rate_limit_on_login_endpoint(self, async_client: AsyncClient):
        """Testa rate limiting no endpoint de login"""
        login_data = {
            "email": "test@example.com",
            "password": "wrong_password"
        }
        
        # Fazer múltiplas requisições
        responses = []
        for _ in range(6):  # Limite é 5/minuto
            response = await async_client.post("/api/auth/login", json=login_data)
            responses.append(response)
            await asyncio.sleep(0.1)  # Pequeno delay
        
        # Primeiras 5 devem passar (mesmo que falhem autenticação)
        for response in responses[:5]:
            assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_200_OK]
        
        # Sexta deve ser bloqueada por rate limit
        assert responses[5].status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "retry_after" in responses[5].json() or "Retry-After" in responses[5].headers
    
    @pytest.mark.asyncio
    async def test_rate_limit_headers_present(self, async_client: AsyncClient):
        """Testa que headers de rate limit estão presentes"""
        response = await async_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password"}
        )
        
        # Verificar headers de rate limiting
        assert "X-RateLimit-Limit" in response.headers or response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    
    @pytest.mark.asyncio
    async def test_rate_limit_on_register_endpoint(self, async_client: AsyncClient):
        """Testa rate limiting no endpoint de registro"""
        # Fazer múltiplas tentativas de registro
        responses = []
        for i in range(4):  # Limite é 3/hora
            response = await async_client.post(
                "/api/auth/register",
                json={
                    "email": f"test{i}@example.com",
                    "password": "password123",
                    "full_name": f"Test User {i}"
                }
            )
            responses.append(response)
            await asyncio.sleep(0.1)
        
        # Quarta requisição deve ser bloqueada
        assert responses[3].status_code == status.HTTP_429_TOO_MANY_REQUESTS
    
    @pytest.mark.asyncio
    async def test_rate_limit_per_ip_address(self, async_client: AsyncClient):
        """Testa que rate limiting é por endereço IP"""
        # Fazer requisições do mesmo IP
        responses = []
        for _ in range(6):
            response = await async_client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password"}
            )
            responses.append(response)
            await asyncio.sleep(0.1)
        
        # Verificar que foi bloqueado
        assert any(r.status_code == status.HTTP_429_TOO_MANY_REQUESTS for r in responses)
    
    @pytest.mark.asyncio
    async def test_rate_limit_resets_after_window(self, async_client: AsyncClient):
        """Testa que rate limit reseta após janela de tempo"""
        # Fazer requisições até atingir limite
        for _ in range(5):
            await async_client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password"}
            )
            await asyncio.sleep(0.1)
        
        # Verificar que está bloqueado
        response = await async_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password"}
        )
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        
        # Aguardar janela de tempo (1 minuto + margem)
        await asyncio.sleep(61)
        
        # Tentar novamente - deve funcionar
        response = await async_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password"}
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_200_OK]
    
    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_rate_limit_on_video_upload(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Testa rate limiting no endpoint de upload de vídeo"""
        import io
        
        # Fazer múltiplos uploads
        responses = []
        for i in range(11):  # Limite é 10/hora
            files = {"file": (f"test{i}.mp4", io.BytesIO(b"fake video"), "video/mp4")}
            response = await async_client.post(
                "/api/videos/upload",
                files=files,
                headers=auth_headers
            )
            responses.append(response)
            await asyncio.sleep(0.2)
        
        # 11ª requisição deve ser bloqueada
        assert responses[10].status_code == status.HTTP_429_TOO_MANY_REQUESTS
