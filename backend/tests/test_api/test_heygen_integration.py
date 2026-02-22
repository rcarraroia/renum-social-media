"""
Testes para endpoint POST /api/integrations/heygen/validate-key

Testa validação de API Key HeyGen sem salvar no banco.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import asyncio
from app.main import app
from app.api.deps import get_current_organization, get_current_user


# ============================================================================
# Fixtures de autenticação
# ============================================================================

class MockUser:
    id = "550e8400-e29b-41d4-a716-446655440000"  # UUID válido


MOCK_ORG_ID = "550e8400-e29b-41d4-a716-446655440001"  # UUID válido


async def mock_get_user():
    return MockUser()


async def mock_get_org():
    return MOCK_ORG_ID


def build_supabase_mock():
    """
    Constrói mock do supabase que resolve a chain:
    .table().select().eq().single().execute()
    retornando {"plan": "pro"} para bypass do require_plan.
    """
    mock_execute = MagicMock()
    mock_execute.data = {"plan": "pro"}

    mock_builder = MagicMock()
    mock_builder.execute.return_value = mock_execute
    mock_builder.single.return_value = mock_builder
    mock_builder.eq.return_value = mock_builder
    mock_builder.select.return_value = mock_builder

    mock_supabase = MagicMock()
    mock_supabase.table.return_value = mock_builder

    return mock_supabase


@pytest.fixture(autouse=True)
def override_auth():
    """
    Configura mocks de autenticação para todos os testes.

    Estratégia:
    - Override direto de get_current_user e get_current_organization
    - Patch de app.database.get_organization_by_user_id (usado internamente por require_plan)
    - Patch de app.database.supabase mockando a query de plano
    """
    # Override das dependências de auth
    app.dependency_overrides[get_current_user] = mock_get_user
    app.dependency_overrides[get_current_organization] = mock_get_org

    # Patch do supabase e da função de database usados internamente por require_plan
    mock_supabase = build_supabase_mock()

    with patch("app.database.get_organization_by_user_id", new_callable=AsyncMock) as mock_get_org_by_user, \
         patch("app.database.supabase", mock_supabase):

        mock_get_org_by_user.return_value = MOCK_ORG_ID

        yield

    app.dependency_overrides.clear()


# ============================================================================
# Testes
# ============================================================================

@pytest.mark.asyncio
async def test_validate_key_success(test_client):
    """
    Testa validação bem-sucedida de API Key válida.

    Cenário:
    - API Key válida fornecida
    - HeyGen retorna valid=True com créditos

    Resultado esperado:
    - Status 200
    - Retorna valid=True, credits_remaining, plan="pro"
    """
    with patch("app.api.routes.integrations.HeyGenService") as MockHeyGenService:
        # Mock do serviço HeyGen
        mock_service = MockHeyGenService.return_value
        mock_service.test_credentials = AsyncMock(return_value={
            "valid": True,
            "credits_remaining": 150.5,
            "account_name": "Test Account"
        })

        # Fazer requisição
        response = test_client.post(
            "/api/integrations/heygen/validate-key",
            json={"api_key": "valid_key_123"}
        )

        # Verificar resposta
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["credits_remaining"] == 150.5
        assert data["plan"] == "pro"

        # Verificar que test_credentials foi chamado
        mock_service.test_credentials.assert_called_once_with("valid_key_123")


@pytest.mark.asyncio
async def test_validate_key_invalid_401(test_client):
    """
    Testa validação com API Key inválida (erro 401).

    Cenário:
    - API Key inválida fornecida
    - HeyGen retorna valid=False com error.code=401

    Resultado esperado:
    - Status 400
    - Mensagem: "API Key inválida. Verifique suas credenciais no HeyGen."
    """
    with patch("app.api.routes.integrations.HeyGenService") as MockHeyGenService:
        mock_service = MockHeyGenService.return_value
        mock_service.test_credentials = AsyncMock(return_value={
            "valid": False,
            "error": {
                "code": "401",
                "message": "Unauthorized"
            }
        })

        response = test_client.post(
            "/api/integrations/heygen/validate-key",
            json={"api_key": "invalid_key"}
        )

        assert response.status_code == 400
        data = response.json()
        assert "API Key inválida" in data["detail"]


@pytest.mark.asyncio
async def test_validate_key_account_suspended_403(test_client):
    """
    Testa validação com conta HeyGen suspensa (erro 403).

    Cenário:
    - API Key válida mas conta suspensa
    - HeyGen retorna valid=False com error.code=403

    Resultado esperado:
    - Status 403
    - Mensagem: "Conta HeyGen suspensa. Entre em contato com o suporte do HeyGen."
    """
    with patch("app.api.routes.integrations.HeyGenService") as MockHeyGenService:
        mock_service = MockHeyGenService.return_value
        mock_service.test_credentials = AsyncMock(return_value={
            "valid": False,
            "error": {
                "code": "403",
                "message": "Account suspended"
            }
        })

        response = test_client.post(
            "/api/integrations/heygen/validate-key",
            json={"api_key": "suspended_account_key"}
        )

        assert response.status_code == 403
        data = response.json()
        assert "Conta HeyGen suspensa" in data["detail"]


@pytest.mark.asyncio
async def test_validate_key_timeout(test_client):
    """
    Testa timeout na validação (3 segundos).

    Cenário:
    - Requisição ao HeyGen demora mais de 3 segundos
    - asyncio.TimeoutError é lançado

    Resultado esperado:
    - Status 408
    - Mensagem: "Tempo de conexão esgotado. Verifique sua conexão e tente novamente."
    """
    with patch("app.api.routes.integrations.HeyGenService") as MockHeyGenService:
        mock_service = MockHeyGenService.return_value

        # Simula timeout: lança TimeoutError diretamente via asyncio.wait_for
        async def lazy_credentials(api_key):
            await asyncio.sleep(10)  # Muito além do timeout de 3s
            return {"valid": True}

        mock_service.test_credentials = lazy_credentials

        response = test_client.post(
            "/api/integrations/heygen/validate-key",
            json={"api_key": "slow_key_1234"}
        )

        assert response.status_code == 408
        data = response.json()
        assert "Tempo de conexão esgotado" in data["detail"]


@pytest.mark.asyncio
async def test_validate_key_generic_error(test_client):
    """
    Testa erro genérico do HeyGen (não 401/403).

    Cenário:
    - HeyGen retorna valid=False com error.code desconhecido

    Resultado esperado:
    - Status 500
    - Mensagem: "Erro ao validar API Key. Tente novamente."
    """
    with patch("app.api.routes.integrations.HeyGenService") as MockHeyGenService:
        mock_service = MockHeyGenService.return_value
        mock_service.test_credentials = AsyncMock(return_value={
            "valid": False,
            "error": {
                "code": "500",
                "message": "Internal server error"
            }
        })

        response = test_client.post(
            "/api/integrations/heygen/validate-key",
            json={"api_key": "error_key_123"}
        )

        assert response.status_code == 500
        data = response.json()
        assert "Erro ao validar API Key" in data["detail"]


@pytest.mark.asyncio
async def test_validate_key_exception(test_client):
    """
    Testa exceção inesperada durante validação.

    Cenário:
    - HeyGenService.test_credentials lança exceção

    Resultado esperado:
    - Status 500
    - Mensagem: "Erro ao validar API Key. Tente novamente."
    """
    with patch("app.api.routes.integrations.HeyGenService") as MockHeyGenService:
        mock_service = MockHeyGenService.return_value
        mock_service.test_credentials = AsyncMock(side_effect=Exception("Network error"))

        response = test_client.post(
            "/api/integrations/heygen/validate-key",
            json={"api_key": "exception_key"}
        )

        assert response.status_code == 500
        data = response.json()
        assert "Erro ao validar API Key" in data["detail"]
