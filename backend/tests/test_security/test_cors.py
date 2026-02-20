"""
Testes de segurança para configuração de CORS.
Valida que apenas origens autorizadas podem acessar a API.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestCORSConfiguration:
    """Testes para validar configuração de CORS"""
    
    def test_cors_allows_authorized_origin_localhost(self):
        """Testa que CORS permite origem localhost autorizada"""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        # Preflight deve retornar 200
        assert response.status_code == 200
        
        # Headers CORS devem estar presentes
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
        assert "access-control-allow-credentials" in response.headers
        assert response.headers["access-control-allow-credentials"] == "true"
    
    def test_cors_allows_authorized_origin_production(self):
        """Testa que CORS permite origem de produção autorizada"""
        response = client.options(
            "/health",
            headers={
                "Origin": "https://renum.vercel.app",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "https://renum.vercel.app"
    
    def test_cors_blocks_unauthorized_origin(self):
        """Testa que CORS bloqueia origem não autorizada"""
        response = client.options(
            "/health",
            headers={
                "Origin": "https://evil-site.com",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        # Preflight pode retornar 200, mas não deve incluir a origem maliciosa
        # no header Access-Control-Allow-Origin
        if "access-control-allow-origin" in response.headers:
            assert response.headers["access-control-allow-origin"] != "https://evil-site.com"
            # Deve ser null ou não estar presente
            assert response.headers.get("access-control-allow-origin") in [None, "null"]
    
    def test_cors_blocks_wildcard_origin(self):
        """Testa que CORS não aceita wildcard (*) como origem"""
        response = client.options(
            "/health",
            headers={
                "Origin": "*",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        # Wildcard não deve ser aceito
        if "access-control-allow-origin" in response.headers:
            assert response.headers["access-control-allow-origin"] != "*"
    
    def test_cors_allows_credentials(self):
        """Testa que CORS permite credenciais (cookies, auth headers)"""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-credentials") == "true"
    
    def test_cors_allows_required_methods(self):
        """Testa que CORS permite métodos HTTP necessários"""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            }
        )
        
        assert response.status_code == 200
        allowed_methods = response.headers.get("access-control-allow-methods", "")
        
        # Verificar que métodos críticos estão permitidos
        assert "GET" in allowed_methods
        assert "POST" in allowed_methods
        assert "PUT" in allowed_methods
        assert "DELETE" in allowed_methods
        assert "PATCH" in allowed_methods
        assert "OPTIONS" in allowed_methods
    
    def test_cors_allows_required_headers(self):
        """Testa que CORS permite headers necessários"""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization,Content-Type",
            }
        )
        
        assert response.status_code == 200
        allowed_headers = response.headers.get("access-control-allow-headers", "").lower()
        
        # Verificar que headers críticos estão permitidos
        assert "authorization" in allowed_headers
        assert "content-type" in allowed_headers
    
    def test_cors_exposes_request_id_header(self):
        """Testa que CORS expõe header X-Request-ID"""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        assert response.status_code == 200
        exposed_headers = response.headers.get("access-control-expose-headers", "").lower()
        
        # X-Request-ID deve estar exposto para tracking
        assert "x-request-id" in exposed_headers
    
    def test_cors_has_max_age_cache(self):
        """Testa que CORS tem cache de preflight configurado"""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        assert response.status_code == 200
        max_age = response.headers.get("access-control-max-age")
        
        # Deve ter cache configurado (3600 segundos = 1 hora)
        assert max_age is not None
        assert int(max_age) > 0
    
    def test_actual_request_with_authorized_origin(self):
        """Testa request real (não preflight) com origem autorizada"""
        response = client.get(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
            }
        )
        
        # Request deve ser bem-sucedido
        assert response.status_code == 200
        
        # Headers CORS devem estar presentes na resposta
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    
    def test_actual_request_with_unauthorized_origin(self):
        """Testa request real com origem não autorizada"""
        response = client.get(
            "/health",
            headers={
                "Origin": "https://evil-site.com",
            }
        )
        
        # Request pode ser processado (backend não bloqueia),
        # mas browser bloqueará pela ausência do header CORS correto
        if "access-control-allow-origin" in response.headers:
            assert response.headers["access-control-allow-origin"] != "https://evil-site.com"


class TestCORSSecurityVulnerabilities:
    """Testes para vulnerabilidades comuns de CORS"""
    
    def test_cors_does_not_reflect_origin(self):
        """Testa que CORS não reflete a origem do request (vulnerabilidade comum)"""
        malicious_origin = "https://attacker.com"
        
        response = client.options(
            "/health",
            headers={
                "Origin": malicious_origin,
                "Access-Control-Request-Method": "GET",
            }
        )
        
        # CORS não deve simplesmente refletir a origem do request
        # Isso seria uma vulnerabilidade crítica
        if "access-control-allow-origin" in response.headers:
            assert response.headers["access-control-allow-origin"] != malicious_origin
    
    def test_cors_does_not_allow_null_origin(self):
        """Testa que CORS não permite origem 'null' (vulnerabilidade comum)"""
        response = client.options(
            "/health",
            headers={
                "Origin": "null",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        # Origem 'null' não deve ser aceita
        # (pode ser explorada via sandboxed iframes)
        if "access-control-allow-origin" in response.headers:
            assert response.headers["access-control-allow-origin"] != "null"
    
    def test_cors_with_credentials_not_wildcard(self):
        """Testa que CORS com credentials não usa wildcard (violação de spec)"""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        # Se allow-credentials é true, allow-origin NÃO pode ser "*"
        # Isso violaria a especificação CORS
        if response.headers.get("access-control-allow-credentials") == "true":
            assert response.headers.get("access-control-allow-origin") != "*"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
