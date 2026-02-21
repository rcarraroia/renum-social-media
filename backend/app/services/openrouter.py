"""
OpenRouter Service - Unified AI model provider

Provides access to 400+ AI models through a single API.
Implements fallback chains and maintains compatibility with ClaudeService interface.
"""
from openai import OpenAI
from typing import List, Dict, Any, Optional
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("openrouter")


class OpenRouterService:
    """
    Service for interacting with OpenRouter API
    
    Provides unified access to multiple AI models with automatic fallback.
    Maintains interface compatibility with ClaudeService.
    """
    
    # OpenRouter API base URL
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
    
    # Platform character limits (same as ClaudeService)
    PLATFORM_LIMITS = {
        "linkedin": 3000,
        "x": 280,
        "twitter": 280,
        "instagram": 2200,
        "tiktok": 2200,
        "facebook": 2200,
        "youtube": 5000
    }
    
    def __init__(self):
        """
        Initialize OpenRouter service
        
        Validates API key and model configuration.
        Raises exception if configuration is invalid.
        """
        # Validate API key
        if not self._is_valid_api_key(settings.openrouter_api_key):
            logger.error("OpenRouter API key is invalid or not configured")
            self.client = None
            return
        
        # Initialize OpenAI client with OpenRouter base URL
        self.client = OpenAI(
            base_url=self.OPENROUTER_BASE_URL,
            api_key=settings.openrouter_api_key
        )
        
        # Store configured models
        self.script_model = settings.openrouter_script_model
        self.description_model = settings.openrouter_description_model
        self.assistant_model = settings.openrouter_assistant_model
        self.fallback_model = settings.openrouter_fallback_model
        
        logger.info(
            "OpenRouter service initialized",
            extra={
                "script_model": self.script_model or "not configured",
                "description_model": self.description_model or "not configured",
                "assistant_model": self.assistant_model or "not configured",
                "fallback_model": self.fallback_model or "not configured"
            }
        )
    
    def _is_valid_api_key(self, key: Optional[str]) -> bool:
        """
        Validate if API key is valid
        
        Args:
            key: API key to validate
            
        Returns:
            True if valid, False otherwise
        """
        if key is None:
            return False
        
        if key.strip() == "":
            return False
        
        if key.lower() == "placeholder":
            return False
        
        return True
    
    def _validate_model_configured(self, model: Optional[str], service_name: str) -> None:
        """
        Validate that a model is configured for a service
        
        Args:
            model: Model identifier
            service_name: Name of the service (for error messages)
            
        Raises:
            Exception if model is not configured
        """
        if not model:
            raise Exception(
                f"{service_name} model not configured. "
                f"Please configure OPENROUTER_{service_name.upper()}_MODEL environment variable. "
                f"Configuration will be done by administrator via admin panel."
            )

    
    async def generate_script_from_research(
        self,
        topic: str,
        research_context: str,
        audience: str,
        tone: str,
        duration_seconds: int,
        language: str,
        feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gera script para vídeo baseado em pesquisa contextualizada.
        
        Implementa fallback chain: tenta modelo primário, se falhar tenta próximos.
        
        Args:
            topic: Tema do script
            research_context: Contexto obtido da pesquisa Tavily
            audience: Audiência alvo ('mlm', 'politics', 'general')
            tone: Tom do script ('informal', 'professional', 'inspirational')
            duration_seconds: Duração alvo em segundos (30, 60, 90)
            language: Idioma do script ('pt-BR', 'en-US', 'es-ES')
            feedback: Feedback opcional para regeneração
            
        Returns:
            {
                "success": bool,
                "script": str,
                "word_count": int,
                "estimated_duration": int,
                "model": str
            }
            
        Raises:
            Exception se API Key não configurada ou todos os modelos falharem
        """
        if not self.client:
            return {"success": False, "message": "OpenRouter API key not configured"}
        
        # Validar que modelo está configurado
        self._validate_model_configured(self.script_model, "script")
        
        # Mapear públicos para instruções específicas
        audience_instructions = {
            "mlm": "Use tom empoderador e focado em vendas. Inclua call-to-action direto.",
            "politics": "Mantenha tom informativo e propositivo. Foco em fatos e soluções.",
            "general": "Mantenha tom educativo e acessível. Explique conceitos claramente."
        }
        
        # Mapear tons para instruções específicas
        tone_instructions = {
            "informal": "Use linguagem casual, coloquial e direta. Quebre o quarto parede.",
            "professional": "Use linguagem formal e técnica. Foco em credibilidade.",
            "inspirational": "Use linguagem motivacional e empoderadora. Inclua histórias de sucesso."
        }
        
        # Construir prompt específico para geração de scripts
        prompt = f"""
Você é um especialista em roteiro para vídeos de redes sociais.

TEMA DO VÍDEO: {topic}

CONTEXTO DA PESQUISA:
{research_context}

PARÂMETROS DO VÍDEO:
- Duração alvo: {duration_seconds} segundos
- Público-alvo: {audience.upper()}
- Tom do vídeo: {tone.upper()}
- Idioma: {language.upper()}

INSTRUÇÕES DO PÚBLICO:
{audience_instructions.get(audience, "")}

INSTRUÇÕES DO TOM:
{tone_instructions.get(tone, "")}

INSTRUÇÕES DE FORMATO:
- Crie um script pronto para ser lido/falado (texto corrido)
- Inclua: gancho de abertura (primeiros 3 segundos), desenvolvimento com dados/fatos das fontes, CTA final
- Use dados REAIS das fontes fornecidas (não invente informações)
- Não inclua marcações de cena ou direções (ex: [CÂMERA], [MÚSICA])
- O script deve ser fluido e natural para leitura

{f"FEEDBACK DO USUÁRIO: {feedback}" if feedback else ""}

Gere o script completo em {language} seguindo todas as instruções acima.
Retorne apenas o texto do script, sem explicações adicionais.
"""
        
        # Tentar gerar com fallback chain
        models_to_try = [self.script_model]
        if self.fallback_model:
            models_to_try.append(self.fallback_model)
        
        for model in models_to_try:
            try:
                logger.info(f"Attempting script generation with model: {model}")
                
                response = await self._call_openrouter(
                    model=model,
                    prompt=prompt,
                    max_tokens=2000
                )
                
                text = response.get("text", "")
                
                # Calcular estatísticas
                word_count = len(text.split()) if text else 0
                estimated_duration = int(word_count / 2.5 * 60)  # ~150 palavras por minuto
                
                logger.info(
                    f"Script generated successfully with {model}",
                    extra={
                        "model": model,
                        "word_count": word_count,
                        "estimated_duration": estimated_duration
                    }
                )
                
                return {
                    "success": True,
                    "script": text,
                    "word_count": word_count,
                    "estimated_duration": estimated_duration,
                    "model": model
                }
                
            except Exception as e:
                logger.error(
                    f"Script generation failed with {model}: {str(e)}",
                    exc_info=True
                )
                
                # Se não há mais modelos para tentar, retornar erro
                if model == models_to_try[-1]:
                    return {
                        "success": False,
                        "message": f"All models failed. Last error: {str(e)}"
                    }
                
                # Continuar para próximo modelo
                logger.info(f"Trying next model in fallback chain...")
                continue
    
    async def _call_openrouter(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1500
    ) -> Dict[str, Any]:
        """
        Chama OpenRouter API com modelo específico
        
        Args:
            model: Identificador do modelo (ex: "anthropic/claude-sonnet-4")
            prompt: Prompt para o modelo
            max_tokens: Número máximo de tokens na resposta
            
        Returns:
            {"text": str, "model": str}
            
        Raises:
            Exception se chamada falhar
        """
        try:
            # Chamar OpenRouter via SDK OpenAI
            def _sync_call():
                return self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens
                )
            
            response = await __import__("asyncio").to_thread(_sync_call)
            
            # Extrair texto da resposta
            text = ""
            if response.choices and len(response.choices) > 0:
                text = response.choices[0].message.content or ""
            
            return {
                "text": text,
                "model": model
            }
            
        except Exception as e:
            logger.error(f"OpenRouter API call failed: {str(e)}", exc_info=True)
            raise

    
    async def generate_descriptions(
        self, 
        transcription: str, 
        platforms: List[str], 
        tone: str = "profissional",
        include_hashtags: bool = True,
        profile_context: str = ""
    ) -> Dict[str, Dict[str, Any]]:
        """
        Generate optimized descriptions for multiple platforms based on video transcription
        
        Args:
            transcription: Video transcription text
            platforms: List of platform names
            tone: Tone of the description
            include_hashtags: Whether to include hashtags
            profile_context: Additional context about the profile
            
        Returns:
            Dict mapping platform to description data
            
        Raises:
            Exception if API key not configured or model not configured
        """
        if not self.client:
            raise Exception("OpenRouter API key not configured")
        
        # Validar que modelo está configurado
        self._validate_model_configured(self.description_model, "description")
        
        results = {}
        
        for platform in platforms:
            platform_lower = platform.lower()
            max_chars = self.PLATFORM_LIMITS.get(platform_lower, 2200)
            
            prompt = self._build_description_prompt(
                transcription, 
                platform_lower, 
                max_chars, 
                tone, 
                include_hashtags,
                profile_context
            )
            
            try:
                logger.info(f"Generating description for {platform_lower} with {self.description_model}")
                
                # Tentar com modelo primário, depois fallback se configurado
                models_to_try = [self.description_model]
                if self.fallback_model:
                    models_to_try.append(self.fallback_model)
                
                last_error = None
                for model in models_to_try:
                    try:
                        response = await self._call_openrouter(
                            model=model,
                            prompt=prompt,
                            max_tokens=1500
                        )
                        
                        text = response.get("text", "")
                        
                        # Extract hashtags
                        hashtags = self._extract_hashtags(text) if include_hashtags else []
                        
                        results[platform_lower] = {
                            "text": text.strip(),
                            "characterCount": len(text.strip()),
                            "maxCharacters": max_chars,
                            "hashtags": hashtags
                        }
                        
                        logger.info(
                            f"Description generated for {platform_lower}",
                            extra={
                                "platform": platform_lower,
                                "model": model,
                                "char_count": len(text.strip())
                            }
                        )
                        break  # Sucesso, sair do loop de fallback
                        
                    except Exception as model_error:
                        last_error = model_error
                        if model == models_to_try[-1]:
                            # Último modelo falhou, propagar erro
                            raise
                        logger.warning(f"Model {model} failed, trying fallback...")
                        continue
                
            except Exception as e:
                logger.error(f"Error generating description for {platform}", exc_info=True)
                results[platform_lower] = {
                    "text": f"Erro ao gerar descrição: {str(e)}",
                    "characterCount": 0,
                    "maxCharacters": max_chars,
                    "hashtags": []
                }
        
        return results
    
    async def regenerate_description(
        self,
        transcription: str,
        platform: str,
        instructions: str,
        current_description: str = ""
    ) -> Dict[str, Any]:
        """
        Regenerate description for a single platform with additional instructions
        
        Args:
            transcription: Video transcription text
            platform: Platform name
            instructions: Additional instructions for regeneration
            current_description: Current description (optional)
            
        Returns:
            Dict with description data
            
        Raises:
            Exception if API key not configured or model not configured
        """
        if not self.client:
            raise Exception("OpenRouter API key not configured")
        
        # Validar que modelo está configurado
        self._validate_model_configured(self.description_model, "description")
        
        platform_lower = platform.lower()
        max_chars = self.PLATFORM_LIMITS.get(platform_lower, 2200)
        
        prompt = f"""
Você é um especialista em copywriting para redes sociais.

TRANSCRIÇÃO DO VÍDEO:
{transcription}

PLATAFORMA: {platform_lower.upper()}
LIMITE DE CARACTERES: {max_chars}

DESCRIÇÃO ATUAL:
{current_description}

INSTRUÇÕES ADICIONAIS:
{instructions}

Gere uma nova descrição otimizada seguindo as instruções fornecidas.
Mantenha o limite de caracteres da plataforma.
Retorne apenas a descrição, sem explicações adicionais.
"""
        
        try:
            logger.info(f"Regenerating description for {platform_lower} with {self.description_model}")
            
            response = await self._call_openrouter(
                model=self.description_model,
                prompt=prompt,
                max_tokens=1500
            )
            
            text = response.get("text", "")
            hashtags = self._extract_hashtags(text)
            
            logger.info(
                f"Description regenerated for {platform_lower}",
                extra={
                    "platform": platform_lower,
                    "model": self.description_model,
                    "char_count": len(text.strip())
                }
            )
            
            return {
                "text": text.strip(),
                "characterCount": len(text.strip()),
                "maxCharacters": max_chars,
                "hashtags": hashtags
            }
            
        except Exception as e:
            logger.error(f"Error regenerating description for {platform}", exc_info=True)
            raise
    
    def _build_description_prompt(
        self, 
        transcription: str, 
        platform: str, 
        max_chars: int, 
        tone: str,
        include_hashtags: bool,
        profile_context: str
    ) -> str:
        """Build platform-specific prompt for description generation"""
        
        platform_guidelines = {
            "linkedin": "Profissional, informativo, com foco em insights e valor. Use parágrafos curtos.",
            "x": "Conciso, direto, impactante. Máximo 280 caracteres. Seja criativo.",
            "twitter": "Conciso, direto, impactante. Máximo 280 caracteres. Seja criativo.",
            "instagram": "Visual, engajador, com emojis. Quebre linhas para facilitar leitura.",
            "tiktok": "Jovem, viral, com call-to-action. Use linguagem casual e emojis.",
            "facebook": "Conversacional, storytelling, engajador. Incentive comentários.",
            "youtube": "Descritivo, com timestamps se relevante. Inclua contexto completo."
        }
        
        guideline = platform_guidelines.get(platform, "Engajador e otimizado para a plataforma.")
        
        hashtag_instruction = "\nInclua hashtags relevantes no final." if include_hashtags else "\nNÃO inclua hashtags."
        
        prompt = f"""
Você é um especialista em copywriting para redes sociais.

TRANSCRIÇÃO DO VÍDEO:
{transcription}

PLATAFORMA: {platform.upper()}
LIMITE DE CARACTERES: {max_chars}
TOM: {tone}
DIRETRIZES DA PLATAFORMA: {guideline}
{hashtag_instruction}

{f"CONTEXTO DO PERFIL: {profile_context}" if profile_context else ""}

Gere uma descrição otimizada para esta plataforma que:
1. Capture a essência do vídeo
2. Seja engajadora e incentive interação
3. Respeite o limite de caracteres ({max_chars})
4. Siga o tom especificado ({tone})
5. Adapte-se às características da plataforma

Retorne apenas a descrição, sem explicações adicionais.
"""
        return prompt
    
    def _extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text"""
        import re
        hashtags = re.findall(r'#\w+', text)
        return hashtags
