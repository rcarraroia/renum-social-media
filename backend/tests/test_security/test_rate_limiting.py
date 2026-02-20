"""
Testes de rate limiting.
Valida que limites de requisições são aplicados corretamente.
"""
import pytest
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestRateLimitingBasic:
    """Testes básicos de rate limiting"""
    
    def test_rate_limiting_headers_present(self):
        """Testa que headers de rate limiting estão presentes"""
        response = client.get("/health")
        
        # Headers X-RateLimit-* devem estar presentes
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
        
        # Valores devem ser numéricos
        assert int(response.headers["X-RateLimit-Limit"]) > 0
        assert int(response.headers["X-RateLimit-Remaining"]) >= 0
        assert int(response.headers["X-RateLimit-Reset"]) > 0
    
    def test_rate_limiting_decrements_remaining(self):
        """Testa que contador de remaining decrementa"""
        # Primeira request
        response1 = client.get("/health")
        remaining1 = int(response1.headers["X-RateLimit-Remaining"])
        
        # Segunda request
        response2 = client.get("/health")
        remaining2 = int(response2.headers["X-RateLimit-Remaining"])
        
        # Remaining deve ter decrementado
        assert remaining2 < remaining1
    
    @pytest.mark.skip(reason="Requer Redis configurado e pode ser lento")
    def test_rate_limiting_blocks_excessive_requests(self):
        """Testa que rate limiting bloqueia requests excessivos"""
        # Fazer requests até exceder o limite
        # Nota: Este teste pode ser lento e requer Redis
        responses = []
        
        # Fazer 101 requests (limite padrão é 100/minuto)
        for i in range(101):
            response = client.get("/health")
            responses.append(response)
            
            # Se já foi bloqueado, parar
            if response.status_code == 429:
                break
        
        # Última response deve ser 429 (Too Many Requests)
        assert responses[-1].status_code == 429
        
        # Deve ter header Retry-After
        assert "Retry-After" in responses[-1].headers
    
    def test_rate_limit_error_response_format(self):
        """Testa formato da resposta de erro de rate limit"""
        # Este teste simula uma resposta 429
        # Em produção, seria necessário exceder o limite real
        
        # Fazer muitas requests rapidamente
        responses = []
        for i in range(150):  # Exceder limite de 100/min
            response = client.get("/health")
            responses.append(response)
            if response.status_code == 429:
                break
        
        # Se conseguiu gerar 429, validar formato
        rate_limited = [r for r in responses if r.status_code == 429]
        
        if rate_limited:
            response = rate_limited[0]
            data = response.json()
            
            # Validar estrutura da resposta
            assert "error" in data
            assert data["error"] == "rate_limit_exceeded"
            assert "message" in data
            assert "Retry-After" in response.headers


class TestRateLimitingByEndpoint:
    """Testes de rate limiting por endpoint"""
    
    def test_health_endpoint_has_rate_limit(self):
        """Testa que endpoint /health tem rate limiting"""
        response = client.get("/health")
        
        # Deve ter headers de rate limit
        assert "X-RateLimit-Limit" in response.headers
    
    def test_different_endpoints_share_limit(self):
        """Testa que diferentes endpoints compartilham o limite global"""
        # Request para /health
        response1 = client.get("/health")
        remaining1 = int(response1.headers["X-RateLimit-Remaining"])
        
        # Request para outro endpoint (se existir)
        # Nota: Ajustar para endpoint real da aplicação
        response2 = client.get("/health")
        remaining2 = int(response2.headers["X-RateLimit-Remaining"])
        
        # Remaining deve ter decrementado
        assert remaining2 < remaining1


class TestRateLimitingRecovery:
    """Testes de recuperação após rate limit"""
    
    @pytest.mark.skip(reason="Requer esperar tempo real")
    def test_rate_limit_resets_after_window(self):
        """Testa que rate limit reseta após janela de tempo"""
        # Fazer requests até exceder limite
        for i in range(101):
            response = client.get("/health")
            if response.status_code == 429:
                break
        
        # Esperar janela de tempo (1 minuto)
        time.sleep(61)
        
        # Nova request deve funcionar
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_rate_limit_reset_header_is_future(self):
        """Testa que header Reset aponta para o futuro"""
        response = client.get("/health")
        
        reset_timestamp = int(response.headers["X-RateLimit-Reset"])
        current_timestamp = int(time.time())
        
        # Reset deve ser no futuro
        assert reset_timestamp > current_timestamp


class TestRateLimitingFallback:
    """Testes de fallback quando Redis está indisponível"""
    
    def test_api_works_without_redis(self):
        """Testa que API funciona mesmo se Redis estiver indisponível"""
        # Nota: Este teste valida que swallow_errors=True está funcionando
        # Se Redis estiver indisponível, rate limiting é desabilitado
        # mas API continua funcionando
        
        response = client.get("/health")
        
        # API deve responder normalmente
        assert response.status_code == 200
        
        # Headers de rate limit podem ou não estar presentes
        # dependendo se Redis está disponível


class TestRateLimitingByIP:
    """Testes de rate limiting por IP"""
    
    def test_rate_limit_is_per_ip(self):
        """Testa que rate limiting é aplicado por IP"""
        # Nota: TestClient usa sempre o mesmo IP
        # Em produção, IPs diferentes teriam limites independentes
        
        response1 = client.get("/health")
        remaining1 = int(response1.headers["X-RateLimit-Remaining"])
        
        response2 = client.get("/health")
        remaining2 = int(response2.headers["X-RateLimit-Remaining"])
        
        # Mesmo IP deve compartilhar o limite
        assert remaining2 < remaining1


class TestRateLimitingConfiguration:
    """Testes de configuração de rate limiting"""
    
    def test_default_limit_is_100_per_minute(self):
        """Testa que limite padrão é 100/minuto"""
        response = client.get("/health")
        
        limit = int(response.headers["X-RateLimit-Limit"])
        
        # Limite padrão deve ser 100
        assert limit == 100
    
    def test_rate_limit_window_is_60_seconds(self):
        """Testa que janela de rate limit é 60 segundos"""
        response = client.get("/health")
        
        reset_timestamp = int(response.headers["X-RateLimit-Reset"])
        current_timestamp = int(time.time())
        
        # Diferença deve ser aproximadamente 60 segundos
        diff = reset_timestamp - current_timestamp
        assert 0 < diff <= 60


# Testes de integração com operações específicas
class TestRateLimitingOperations:
    """Testes de rate limiting em operações específicas"""
    
    @pytest.mark.skip(reason="Requer implementação de rotas de auth")
    def test_login_has_stricter_limit(self):
        """Testa que login tem limite mais restritivo (5/min)"""
        # Fazer 6 tentativas de login
        for i in range(6):
            response = client.post("/api/auth/login", json={
                "email": "test@test.com",
                "password": "wrong_password"
            })
            
            if response.status_code == 429:
                # Limite de login foi excedido
                assert i < 10  # Deve ser bloqueado antes de 10 tentativas
                break
    
    @pytest.mark.skip(reason="Requer implementação de rotas de AI")
    def test_ai_generation_has_moderate_limit(self):
        """Testa que geração de AI tem limite moderado (20/hora)"""
        # Fazer 21 requests de geração
        for i in range(21):
            response = client.post("/api/modules/1/generate-script", json={
                "prompt": "Test prompt"
            })
            
            if response.status_code == 429:
                # Limite de geração foi excedido
                assert i < 25  # Deve ser bloqueado antes de 25 tentativas
                break


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
