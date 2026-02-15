"""
HeyGen API Service

Serviço para integração com a API do HeyGen para geração de vídeos com avatares.
Todos os métodos são assíncronos e utilizam httpx.AsyncClient.
"""

import httpx
from typing import Optional, Dict, Any
from app.utils.logger import get_logger

logger = get_logger("heygen")


class HeyGenService:
    """
    Serviço para interação com a API do HeyGen.
    
    Responsável por:
    - Validação de credenciais
    - Listagem de avatares e vozes
    - Geração de vídeos
    - Consulta de status de vídeos
    - Download de vídeos gerados
    """
    
    BASE_URL = "https://api.heygen.com"
    TIMEOUT = 30.0  # seconds
    
    # Mapeamento de códigos HTTP para mensagens user-friendly
    ERROR_MESSAGES = {
        401: "Credenciais HeyGen inválidas. Verifique sua API Key em Configurações.",
        402: "Créditos HeyGen insuficientes. Recarregue sua conta em heygen.com.",
        404: "Recurso não encontrado. Verifique os IDs fornecidos.",
        429: "Limite de requisições excedido. Tente novamente em alguns minutos.",
        500: "Erro no servidor HeyGen. Tente novamente mais tarde.",
        "timeout": "Tempo de conexão esgotado. Verifique sua conexão e tente novamente.",
        "connection": "Não foi possível conectar ao HeyGen. Verifique sua conexão.",
        "default": "Erro ao comunicar com HeyGen. Tente novamente."
    }
    
    def __init__(self):
        """Inicializa o serviço HeyGen."""
        pass
    
    def _get_headers(self, api_key: str) -> Dict[str, str]:
        """
        Constrói os headers HTTP para requisições à API HeyGen.
        
        Args:
            api_key: API Key do HeyGen
            
        Returns:
            Dict com headers necessários (X-Api-Key e Content-Type)
        """
        return {
            "X-Api-Key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    def _handle_error(self, error: Exception, endpoint: str = "") -> Dict[str, Any]:
        """
        Mapeia erros HTTP para mensagens user-friendly.
        
        NUNCA expõe detalhes técnicos da API HeyGen ao usuário.
        
        Args:
            error: Exceção capturada
            endpoint: Endpoint que gerou o erro (para logging)
            
        Returns:
            Dict com 'error' contendo mensagem user-friendly e código
        """
        error_response = {
            "error": {
                "code": "unknown",
                "message": self.ERROR_MESSAGES["default"]
            }
        }
        
        # HTTPStatusError - erro com status code
        if isinstance(error, httpx.HTTPStatusError):
            status_code = error.response.status_code
            error_response["error"]["code"] = str(status_code)
            error_response["error"]["message"] = self.ERROR_MESSAGES.get(
                status_code,
                self.ERROR_MESSAGES["default"]
            )
            
            # Log detalhado apenas no servidor (não exposto ao usuário)
            logger.error(
                f"HeyGen API error on {endpoint}: {status_code} - {error.response.text}"
            )
        
        # TimeoutException
        elif isinstance(error, httpx.TimeoutException):
            error_response["error"]["code"] = "timeout"
            error_response["error"]["message"] = self.ERROR_MESSAGES["timeout"]
            logger.error(f"HeyGen API timeout on {endpoint}")
        
        # ConnectError
        elif isinstance(error, httpx.ConnectError):
            error_response["error"]["code"] = "connection"
            error_response["error"]["message"] = self.ERROR_MESSAGES["connection"]
            logger.error(f"HeyGen API connection error on {endpoint}")
        
        # Outros erros
        else:
            error_response["error"]["code"] = "unknown"
            error_response["error"]["message"] = self.ERROR_MESSAGES["default"]
            logger.error(f"HeyGen API unknown error on {endpoint}: {str(error)}")
        
        return error_response

    async def test_credentials(self, api_key: str) -> Dict[str, Any]:
        """
        Testa se as credenciais HeyGen são válidas.
        
        Faz uma requisição GET para /v1/user/remaining_quota para validar a API Key
        e obter informações da conta.
        
        Args:
            api_key: API Key do HeyGen para testar
            
        Returns:
            Dict com:
            - valid (bool): Se as credenciais são válidas
            - credits_remaining (int): Créditos disponíveis (se válido)
            - error (dict): Informações de erro (se inválido)
            
        Nota:
            O campo account_name não está disponível na resposta da API /v1/user/remaining_quota
            
        Raises:
            Não lança exceções - retorna dict com error em caso de falha
        """
        endpoint = "/v1/user/remaining_quota"
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(api_key)
                )
                response.raise_for_status()
                
                data = response.json()
                
                return {
                    "valid": True,
                    "credits_remaining": data.get("remaining_quota", 0)
                }
                
        except Exception as error:
            error_response = self._handle_error(error, endpoint)
            return {
                "valid": False,
                **error_response
            }

    async def get_avatars(self, api_key: str) -> Dict[str, Any]:
        """
        Lista todos os avatares disponíveis na conta HeyGen.
        
        Args:
            api_key: API Key do HeyGen
            
        Returns:
            Dict com:
            - avatars (list): Lista de avatares disponíveis
            - error (dict): Informações de erro (se houver falha)
            
        Formato de cada avatar:
            - avatar_id (str): ID único do avatar
            - avatar_name (str): Nome do avatar
            - preview_image_url (str): URL da imagem de preview
            - gender (str): Gênero do avatar (se disponível)
        """
        endpoint = "/v2/avatars"
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(api_key)
                )
                response.raise_for_status()
                
                data = response.json()
                avatars_data = data.get("data", {}).get("avatars", [])
                
                # Formatar lista de avatares
                avatars = []
                for avatar in avatars_data:
                    avatars.append({
                        "avatar_id": avatar.get("avatar_id"),
                        "avatar_name": avatar.get("avatar_name"),
                        "preview_image_url": avatar.get("preview_image_url"),
                        "gender": avatar.get("gender")
                    })
                
                return {
                    "avatars": avatars
                }
                
        except Exception as error:
            return self._handle_error(error, endpoint)

    async def get_voices(self, api_key: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Lista todas as vozes disponíveis na conta HeyGen.
        
        Args:
            api_key: API Key do HeyGen
            language: Filtro opcional por idioma (ex: "Portuguese", "English")
            
        Returns:
            Dict com:
            - voices (list): Lista de vozes disponíveis
            - error (dict): Informações de erro (se houver falha)
            
        Formato de cada voz:
            - voice_id (str): ID único da voz
            - voice_name (str): Nome da voz
            - language (str): Idioma da voz
            - gender (str): Gênero da voz
            - preview_audio_url (str|None): URL do áudio de preview (pode ser null)
        """
        endpoint = "/v2/voices"
        url = f"{self.BASE_URL}{endpoint}"
        
        # Adicionar query param se language foi fornecido
        params = {}
        if language:
            params["language"] = language
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(api_key),
                    params=params
                )
                response.raise_for_status()
                
                data = response.json()
                voices_data = data.get("data", {}).get("voices", [])
                
                # Formatar lista de vozes
                voices = []
                for voice in voices_data:
                    # preview_audio pode ser null, string vazia, ou URL
                    preview_audio = voice.get("preview_audio")
                    if preview_audio == "":
                        preview_audio = None
                    
                    voices.append({
                        "voice_id": voice.get("voice_id"),
                        "voice_name": voice.get("name"),
                        "language": voice.get("language"),
                        "gender": voice.get("gender"),
                        "preview_audio_url": preview_audio
                    })
                
                return {
                    "voices": voices
                }
                
        except Exception as error:
            return self._handle_error(error, endpoint)

    async def get_credits(self, api_key: str) -> Dict[str, Any]:
        """
        Consulta os créditos disponíveis na conta HeyGen.
        
        Args:
            api_key: API Key do HeyGen
            
        Returns:
            Dict com:
            - remaining_credits (int): Créditos restantes
            - total_credits (int): Total de créditos da conta
            - credits_used (int): Créditos já utilizados
            - error (dict): Informações de erro (se houver falha)
        """
        endpoint = "/v1/user/remaining_quota"
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(api_key)
                )
                response.raise_for_status()
                
                data = response.json()
                remaining = data.get("remaining_quota", 0)
                
                # Se a API não retornar total_credits, usar remaining como fallback
                total = data.get("total_quota", remaining)
                used = max(0, total - remaining)
                
                return {
                    "remaining_credits": remaining,
                    "total_credits": total,
                    "credits_used": used
                }
                
        except Exception as error:
            return self._handle_error(error, endpoint)

    async def create_video(
        self,
        api_key: str,
        script: str,
        avatar_id: str,
        voice_id: str,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Cria um novo vídeo com avatar HeyGen.
        
        Args:
            api_key: API Key do HeyGen
            script: Texto do script (1-5000 caracteres)
            avatar_id: ID do avatar a ser usado
            voice_id: ID da voz a ser usada
            title: Título opcional do vídeo
            
        Returns:
            Dict com:
            - video_id (str): ID do vídeo gerado
            - status (str): Status inicial (geralmente "pending")
            - error (dict): Informações de erro (se houver falha)
            
        Nota:
            Erro 402 indica créditos insuficientes
        """
        endpoint = "/v2/video/generate"
        url = f"{self.BASE_URL}{endpoint}"
        
        # Construir payload conforme estrutura HeyGen
        payload = {
            "title": title or "Video gerado via AvatarAI",
            "aspect_ratio": "16:9",
            "caption": False,
            "dimension": {
                "width": 1920,
                "height": 1080
            },
            "video_inputs": [
                {
                    "character": {
                        "type": "avatar",
                        "avatar_id": avatar_id,
                        "scale": 1,
                        "avatar_style": "normal",
                        "offset": {
                            "x": 0,
                            "y": 0
                        }
                    },
                    "voice": {
                        "type": "text",
                        "voice_id": voice_id,
                        "input_text": script
                    }
                }
            ]
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    url,
                    headers=self._get_headers(api_key),
                    json=payload
                )
                response.raise_for_status()
                
                data = response.json()
                video_data = data.get("data", {})
                
                return {
                    "video_id": video_data.get("video_id"),
                    "status": "pending"
                }
                
        except Exception as error:
            return self._handle_error(error, endpoint)

    async def get_video_status(self, api_key: str, video_id: str) -> Dict[str, Any]:
        """
        Consulta o status de geração de um vídeo.
        
        Args:
            api_key: API Key do HeyGen
            video_id: ID do vídeo a consultar
            
        Returns:
            Dict com:
            - video_id (str): ID do vídeo
            - status (str): Status atual (pending, processing, completed, failed)
            - video_url (str|None): URL de download (apenas se completed)
            - thumbnail_url (str|None): URL da thumbnail (apenas se completed)
            - duration (float|None): Duração em segundos (apenas se completed)
            - error (dict): Informações de erro (se status=failed ou se houver falha na requisição)
        """
        endpoint = "/v1/video_status.get"
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers(api_key),
                    params={"video_id": video_id}
                )
                response.raise_for_status()
                
                data = response.json()
                video_data = data.get("data", {})
                
                status = video_data.get("status")
                result = {
                    "video_id": video_data.get("video_id"),
                    "status": status
                }
                
                # Adicionar campos específicos baseado no status
                if status == "completed":
                    result["video_url"] = video_data.get("video_url")
                    result["thumbnail_url"] = video_data.get("thumbnail_url")
                    result["duration"] = video_data.get("duration")
                elif status == "failed":
                    error_info = video_data.get("error", {})
                    result["error"] = {
                        "code": error_info.get("code", "unknown"),
                        "message": error_info.get("message", "Falha na geração do vídeo")
                    }
                
                return result
                
        except Exception as error:
            return self._handle_error(error, endpoint)

    async def download_video(self, api_key: str, video_id: str) -> Dict[str, Any]:
        """
        Faz download do vídeo gerado pelo HeyGen.
        
        Primeiro consulta o status para obter a URL de download,
        depois faz o download dos bytes do vídeo.
        
        Args:
            api_key: API Key do HeyGen
            video_id: ID do vídeo a fazer download
            
        Returns:
            Dict com:
            - video_bytes (bytes): Bytes do arquivo de vídeo
            - video_url (str): URL original do vídeo
            - error (dict): Informações de erro (se houver falha)
            
        Nota:
            Retorna erro se o vídeo não estiver com status "completed"
        """
        # Primeiro obter o status e URL do vídeo
        status_result = await self.get_video_status(api_key, video_id)
        
        if "error" in status_result:
            return status_result
        
        if status_result.get("status") != "completed":
            return {
                "error": {
                    "code": "video_not_ready",
                    "message": "Vídeo ainda está sendo processado. Aguarde alguns minutos."
                }
            }
        
        video_url = status_result.get("video_url")
        if not video_url:
            return {
                "error": {
                    "code": "no_video_url",
                    "message": "URL de download não disponível"
                }
            }
        
        # Fazer download do vídeo
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:  # Timeout maior para download
                response = await client.get(video_url)
                response.raise_for_status()
                
                return {
                    "video_bytes": response.content,
                    "video_url": video_url
                }
                
        except Exception as error:
            return self._handle_error(error, f"download from {video_url}")
