"""
Testes de integração para endpoints de vídeos

Valida fluxos completos de upload, listagem e gerenciamento de vídeos.
"""
import pytest
from httpx import AsyncClient
from fastapi import status
from unittest.mock import Mock, patch
import io


@pytest.mark.integration
class TestVideosIntegration:
    """Testes de integração para vídeos"""
    
    @pytest.mark.asyncio
    async def test_list_videos_requires_authentication(self, async_client: AsyncClient):
        """Testa que listar vídeos requer autenticação"""
        response = await async_client.get("/api/videos")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_list_videos_with_auth(self, async_client: AsyncClient, auth_headers: dict):
        """Testa listagem de vídeos com autenticação"""
        response = await async_client.get(
            "/api/videos",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_list_videos_filters_by_organization(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_video
    ):
        """Testa que listagem filtra por organização"""
        # Criar vídeo na organização do usuário
        video = await create_test_video()
        
        response = await async_client.get(
            "/api/videos",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        videos = response.json()
        
        # Verificar que apenas vídeos da organização são retornados
        for v in videos:
            assert v["organization_id"] == video["organization_id"]
    
    @pytest.mark.asyncio
    async def test_get_video_by_id(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_video
    ):
        """Testa obter vídeo por ID"""
        video = await create_test_video()
        
        response = await async_client.get(
            f"/api/videos/{video['id']}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == video["id"]
    
    @pytest.mark.asyncio
    async def test_get_video_from_different_organization_fails(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_video
    ):
        """Testa que não consegue acessar vídeo de outra organização"""
        # Criar vídeo em outra organização
        video = await create_test_video(organization_id="other_org_id")
        
        response = await async_client.get(
            f"/api/videos/{video['id']}",
            headers=auth_headers
        )
        
        # RLS deve bloquear acesso
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.asyncio
    async def test_upload_video_requires_authentication(self, async_client: AsyncClient):
        """Testa que upload requer autenticação"""
        files = {"file": ("test.mp4", io.BytesIO(b"fake video content"), "video/mp4")}
        
        response = await async_client.post(
            "/api/videos/upload",
            files=files
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_upload_video_validates_file_type(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Testa que upload valida tipo de arquivo"""
        # Tentar upload de arquivo não-vídeo
        files = {"file": ("test.txt", io.BytesIO(b"not a video"), "text/plain")}
        
        response = await async_client.post(
            "/api/videos/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "file type" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_upload_video_validates_file_size(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Testa que upload valida tamanho do arquivo"""
        # Criar arquivo muito grande (> 500MB simulado)
        large_content = b"x" * (501 * 1024 * 1024)  # 501 MB
        files = {"file": ("large.mp4", io.BytesIO(large_content), "video/mp4")}
        
        response = await async_client.post(
            "/api/videos/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    
    @pytest.mark.asyncio
    async def test_delete_video_requires_authentication(self, async_client: AsyncClient):
        """Testa que deletar vídeo requer autenticação"""
        response = await async_client.delete("/api/videos/test_id")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_delete_own_video(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_video
    ):
        """Testa deletar próprio vídeo"""
        video = await create_test_video()
        
        response = await async_client.delete(
            f"/api/videos/{video['id']}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    @pytest.mark.asyncio
    async def test_delete_video_from_different_organization_fails(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_video
    ):
        """Testa que não consegue deletar vídeo de outra organização"""
        video = await create_test_video(organization_id="other_org_id")
        
        response = await async_client.delete(
            f"/api/videos/{video['id']}",
            headers=auth_headers
        )
        
        # RLS deve bloquear
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.asyncio
    async def test_update_video_metadata(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict,
        create_test_video
    ):
        """Testa atualizar metadados do vídeo"""
        video = await create_test_video()
        
        update_data = {
            "title": "Updated Title",
            "description": "Updated description"
        }
        
        response = await async_client.patch(
            f"/api/videos/{video['id']}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]
