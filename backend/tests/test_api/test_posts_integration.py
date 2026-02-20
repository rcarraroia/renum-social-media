"""
Testes de integração para endpoints de posts

Valida fluxos completos de criação, listagem e gerenciamento de posts.
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.integration
class TestPostsIntegration:
    """Testes de integração para posts"""
    
    @pytest.mark.asyncio
    async def test_list_posts_requires_authentication(self, async_client: AsyncClient):
        """Testa que listar posts requer autenticação"""
        response = await async_client.get("/api/posts")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_list_posts_with_auth(self, async_client: AsyncClient, auth_headers: dict):
        """Testa listagem de posts com autenticação"""
        response = await async_client.get(
            "/api/posts",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_create_post_requires_authentication(self, async_client: AsyncClient):
        """Testa que criar post requer autenticação"""
        post_data = {
            "content": "Test post content",
            "platform": "instagram"
        }
        
        response = await async_client.post("/api/posts", json=post_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_create_post_with_valid_data(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Testa criar post com dados válidos"""
        post_data = {
            "content": "Test post content",
            "platform": "instagram",
            "scheduled_for": "2024-12-31T10:00:00Z"
        }
        
        response = await async_client.post(
            "/api/posts",
            json=post_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["content"] == post_data["content"]
        assert data["platform"] == post_data["platform"]
    
    @pytest.mark.asyncio
    async def test_create_post_validates_platform(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Testa que criar post valida plataforma"""
        post_data = {
            "content": "Test post",
            "platform": "invalid_platform"
        }
        
        response = await async_client.post(
            "/api/posts",
            json=post_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    async def test_create_post_validates_content_length(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Testa que criar post valida tamanho do conteúdo"""
        post_data = {
            "content": "",  # Conteúdo vazio
            "platform": "instagram"
        }
        
        response = await async_client.post(
            "/api/posts",
            json=post_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    async def test_get_post_by_id(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_post
    ):
        """Testa obter post por ID"""
        post = await create_test_post()
        
        response = await async_client.get(
            f"/api/posts/{post['id']}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == post["id"]
    
    @pytest.mark.asyncio
    async def test_update_post(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_post
    ):
        """Testa atualizar post"""
        post = await create_test_post()
        
        update_data = {
            "content": "Updated content",
            "status": "published"
        }
        
        response = await async_client.patch(
            f"/api/posts/{post['id']}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["content"] == update_data["content"]
    
    @pytest.mark.asyncio
    async def test_delete_post(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_post
    ):
        """Testa deletar post"""
        post = await create_test_post()
        
        response = await async_client.delete(
            f"/api/posts/{post['id']}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    @pytest.mark.asyncio
    async def test_filter_posts_by_platform(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_post
    ):
        """Testa filtrar posts por plataforma"""
        # Criar posts em diferentes plataformas
        await create_test_post(platform="instagram")
        await create_test_post(platform="facebook")
        
        response = await async_client.get(
            "/api/posts?platform=instagram",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        posts = response.json()
        
        # Verificar que apenas posts do Instagram foram retornados
        for post in posts:
            assert post["platform"] == "instagram"
    
    @pytest.mark.asyncio
    async def test_filter_posts_by_status(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_post
    ):
        """Testa filtrar posts por status"""
        # Criar posts com diferentes status
        await create_test_post(status="draft")
        await create_test_post(status="published")
        
        response = await async_client.get(
            "/api/posts?status=draft",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        posts = response.json()
        
        # Verificar que apenas drafts foram retornados
        for post in posts:
            assert post["status"] == "draft"
    
    @pytest.mark.asyncio
    async def test_posts_isolated_by_organization(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_post
    ):
        """Testa que posts são isolados por organização (RLS)"""
        # Criar post em outra organização
        other_org_post = await create_test_post(organization_id="other_org_id")
        
        # Tentar acessar
        response = await async_client.get(
            f"/api/posts/{other_org_post['id']}",
            headers=auth_headers
        )
        
        # RLS deve bloquear
        assert response.status_code == status.HTTP_404_NOT_FOUND
