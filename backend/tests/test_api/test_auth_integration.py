"""
Testes de integração para endpoints de autenticação

Valida fluxos completos de login, registro e gerenciamento de sessão.
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.integration
class TestAuthIntegration:
    """Testes de integração para autenticação"""
    
    @pytest.mark.asyncio
    async def test_register_new_user_success(self, async_client: AsyncClient, test_user_data: dict):
        """Testa registro de novo usuário com sucesso"""
        response = await async_client.post(
            "/api/auth/register",
            json=test_user_data
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "user" in data
        assert "session" in data
        assert data["user"]["email"] == test_user_data["email"]
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email_fails(self, async_client: AsyncClient, test_user_data: dict):
        """Testa que registro com email duplicado falha"""
        # Primeiro registro
        await async_client.post("/api/auth/register", json=test_user_data)
        
        # Segundo registro com mesmo email
        response = await async_client.post("/api/auth/register", json=test_user_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_register_invalid_email_fails(self, async_client: AsyncClient, test_user_data: dict):
        """Testa que registro com email inválido falha"""
        test_user_data["email"] = "invalid-email"
        
        response = await async_client.post("/api/auth/register", json=test_user_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    async def test_login_with_valid_credentials(self, async_client: AsyncClient, test_user_data: dict):
        """Testa login com credenciais válidas"""
        # Registrar usuário
        await async_client.post("/api/auth/register", json=test_user_data)
        
        # Login
        response = await async_client.post(
            "/api/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "user" in data
    
    @pytest.mark.asyncio
    async def test_login_with_invalid_password(self, async_client: AsyncClient, test_user_data: dict):
        """Testa que login com senha incorreta falha"""
        # Registrar usuário
        await async_client.post("/api/auth/register", json=test_user_data)
        
        # Login com senha errada
        response = await async_client.post(
            "/api/auth/login",
            json={
                "email": test_user_data["email"],
                "password": "wrong_password"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_login_with_nonexistent_user(self, async_client: AsyncClient):
        """Testa que login com usuário inexistente falha"""
        response = await async_client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_logout_with_valid_token(self, async_client: AsyncClient, auth_headers: dict):
        """Testa logout com token válido"""
        response = await async_client.post(
            "/api/auth/logout",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    @pytest.mark.asyncio
    async def test_logout_without_token_fails(self, async_client: AsyncClient):
        """Testa que logout sem token falha"""
        response = await async_client.post("/api/auth/logout")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_get_current_user_with_valid_token(self, async_client: AsyncClient, auth_headers: dict):
        """Testa obter usuário atual com token válido"""
        response = await async_client.get(
            "/api/auth/me",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "organization_id" in data
    
    @pytest.mark.asyncio
    async def test_get_current_user_without_token_fails(self, async_client: AsyncClient):
        """Testa que obter usuário sem token falha"""
        response = await async_client.get("/api/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
