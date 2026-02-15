from app.config import settings
from app.utils.logger import get_logger
import httpx
from typing import Optional, List, Dict, Any

logger = get_logger("tavily")


class TavilyService:
    """
    Serviço de integração com Tavily API para pesquisa web contextualizada.
    
    A API Key é configurada como credencial da organização RENUM, não do usuário.
    """
    
    BASE_URL = "https://api.tavily.com"
    API_KEY = settings.tavily_api_key
    TIMEOUT = 30.0  # segundos
    
    # Mapeamento de erros HTTP para mensagens user-friendly
    ERROR_MESSAGES = {
        401: "Credenciais Tavily inválidas. Contate o suporte.",
        429: "Limite de requisições excedido. Tente novamente em alguns minutos.",
        500: "Erro no servidor Tavily. Tente novamente mais tarde.",
        "timeout": "Tempo de conexão esgotado. Verifique sua conexão.",
        "connection": "Não foi possível conectar ao Tavily.",
        "default": "Erro ao realizar pesquisa. Tente novamente."
    }
    
    def __init__(self):
        """Inicializa o serviço Tavily."""
        self.client = httpx.AsyncClient(timeout=self.TIMEOUT)
    
    async def search(
        self,
        query: str,
        search_depth: str = "basic",
        max_results: int = 5,
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Realiza pesquisa web usando Tavily API.
        
        Args:
            query: Termo de pesquisa
            search_depth: Profundidade da pesquisa ("basic" ou "advanced")
            max_results: Número máximo de resultados (1-10)
            include_domains: Lista de domínios para incluir
            exclude_domains: Lista de domínios para excluir
        
        Returns:
            {
                "results": [
                    {
                        "title": str,
                        "url": str,
                        "content": str,
                        "score": float
                    }
                ],
                "query": str
            }
        
        Raises:
            Não lança exceções - retorna dict com "error" em caso de falha
        """
        if not self.API_KEY:
            return {"error": {"code": "no_api_key", "message": "API Key Tavily não configurada"}}
        
        url = f"{self.BASE_URL}/search"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.API_KEY}"
        }
        
        payload = {
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results
        }
        
        if include_domains:
            payload["include_domains"] = include_domains
        if exclude_domains:
            payload["exclude_domains"] = exclude_domains
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                # Transformar resultados para o formato esperado
                results = []
                for item in data.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "content": item.get("content", ""),
                        "score": item.get("score", 0.0)
                    })
                return {
                    "results": results,
                    "query": data.get("query", query)
                }
            else:
                return self._handle_error(response, "search")
                
        except httpx.TimeoutException:
            return {"error": {"code": "timeout", "message": self.ERROR_MESSAGES["timeout"]}}
        except httpx.RequestError as e:
            return {"error": {"code": "connection", "message": f"{self.ERROR_MESSAGES['connection']}: {str(e)}"}}
        except Exception as e:
            logger.error(f"Unexpected error in TavilyService.search: {e}", exc_info=True)
            return {"error": {"code": "default", "message": self.ERROR_MESSAGES["default"]}}
    
    async def extract(self, urls: List[str]) -> Dict[str, Any]:
        """
        Extrai conteúdo de URLs específicas (se disponível na API).
        
        Args:
            urls: Lista de URLs para extrair conteúdo
        
        Returns:
            {
                "extractions": [
                    {
                        "url": str,
                        "content": str,
                        "title": str
                    }
                ]
            }
        
        Raises:
            Não lança exceções - retorna dict com "error" em caso de falha
        """
        if not self.API_KEY:
            return {"error": {"code": "no_api_key", "message": "API Key Tavily não configurada"}}
        
        url = f"{self.BASE_URL}/extract"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.API_KEY}"
        }
        
        payload = {
            "urls": urls
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                # Transformar resultados para o formato esperado
                extractions = []
                for item in data.get("results", []):
                    extractions.append({
                        "url": item.get("url", ""),
                        "content": item.get("raw_content", ""),
                        "title": ""
                    })
                return {
                    "extractions": extractions
                }
            else:
                return self._handle_error(response, "extract")
                
        except httpx.TimeoutException:
            return {"error": {"code": "timeout", "message": self.ERROR_MESSAGES["timeout"]}}
        except httpx.RequestError as e:
            return {"error": {"code": "connection", "message": f"{self.ERROR_MESSAGES['connection']}: {str(e)}"}}
        except Exception as e:
            logger.error(f"Unexpected error in TavilyService.extract: {e}", exc_info=True)
            return {"error": {"code": "default", "message": self.ERROR_MESSAGES["default"]}}
    
    def _handle_error(self, response: httpx.Response, endpoint: str = "") -> Dict[str, Any]:
        """
        Mapeia erros HTTP para mensagens user-friendly.
        
        Args:
            error: Exceção capturada
            endpoint: Endpoint que gerou o erro (para logging)
        
        Returns:
            Dict com "error" contendo mensagem user-friendly e código
        """
        status_code = response.status_code
        message = self.ERROR_MESSAGES.get(status_code, self.ERROR_MESSAGES["default"])
        
        logger.error(f"Tavily API error [{endpoint}]: {status_code} - {message}")
        
        return {
            "error": {
                "code": str(status_code),
                "message": message
            }
        }
    
    async def close(self):
        """Fecha o cliente HTTP."""
        await self.client.aclose()
