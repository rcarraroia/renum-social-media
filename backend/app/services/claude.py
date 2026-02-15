from anthropic import Anthropic
from typing import List, Dict, Any, Optional
from app.config import settings
from app.utils.logger import get_logger
import re

logger = get_logger("claude")

class ClaudeService:
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
        self.model = "claude-sonnet-4-20250514"
    
    # Platform character limits
    PLATFORM_LIMITS = {
        "linkedin": 3000,
        "x": 280,
        "twitter": 280,
        "instagram": 2200,
        "tiktok": 2200,
        "facebook": 2200,
        "youtube": 5000
    }

    async def generate_script(self, topic: str, context: str, duration_seconds: int = 60, tone: str = "casual") -> Dict[str, Any]:
        if not self.client:
            return {"success": False, "message": "Anthropic API key not configured"}
        prompt = f"""
You are a specialist in short social video scripts.
Topic: {topic}
Context: {context}
Duration: {duration_seconds} seconds
Tone: {tone}
Return only the script.
"""
        try:
            # Anthropic SDK is sync — call in thread
            def _sync_call():
                return self.client.messages.create(model=self.model, max_tokens=1200, messages=[{"role": "user", "content": prompt}])
            res = await __import__("asyncio").to_thread(_sync_call)
            # Extract text safely
            content = getattr(res, "content", None)
            text = None
            if content:
                if isinstance(content, list) and len(content) > 0:
                    text = content[0].text if hasattr(content[0], "text") else str(content[0])
                elif hasattr(content, "text"):
                    text = content.text
            return {"success": True, "script": text or "", "model": self.model}
        except Exception as e:
            logger.error("Error generating script", exc_info=True)
            return {"success": False, "message": str(e)}
    
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
        """
        if not self.client:
            raise Exception("Anthropic API key not configured")
        
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
                def _sync_call():
                    return self.client.messages.create(
                        model=self.model, 
                        max_tokens=1500, 
                        messages=[{"role": "user", "content": prompt}]
                    )
                res = await __import__("asyncio").to_thread(_sync_call)
                
                content = getattr(res, "content", None)
                text = ""
                if content:
                    if isinstance(content, list) and len(content) > 0:
                        text = content[0].text if hasattr(content[0], "text") else str(content[0])
                    elif hasattr(content, "text"):
                        text = content.text
                
                # Extract hashtags
                hashtags = self._extract_hashtags(text) if include_hashtags else []
                
                results[platform_lower] = {
                    "text": text.strip(),
                    "characterCount": len(text.strip()),
                    "maxCharacters": max_chars,
                    "hashtags": hashtags
                }
                
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
        """
        if not self.client:
            raise Exception("Anthropic API key not configured")
        
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
            def _sync_call():
                return self.client.messages.create(
                    model=self.model, 
                    max_tokens=1500, 
                    messages=[{"role": "user", "content": prompt}]
                )
            res = await __import__("asyncio").to_thread(_sync_call)
            
            content = getattr(res, "content", None)
            text = ""
            if content:
                if isinstance(content, list) and len(content) > 0:
                    text = content[0].text if hasattr(content[0], "text") else str(content[0])
                elif hasattr(content, "text"):
                    text = content.text
            
            hashtags = self._extract_hashtags(text)
            
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
        hashtags = re.findall(r'#\w+', text)
        return hashtags

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
            Exception se API Key não configurada ou erro na API
        """
        if not self.client:
            return {"success": False, "message": "Anthropic API key not configured"}

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

        try:
            def _sync_call():
                return self.client.messages.create(model=self.model, max_tokens=2000, messages=[{"role": "user", "content": prompt}])
            res = await __import__("asyncio").to_thread(_sync_call)

            content = getattr(res, "content", None)
            text = None
            if content:
                if isinstance(content, list) and len(content) > 0:
                    text = content[0].text if hasattr(content[0], "text") else str(content[0])
                elif hasattr(content, "text"):
                    text = content.text

            # Calcular estatísticas
            word_count = len(text.split()) if text else 0
            estimated_duration = int(word_count / 2.5 * 60)  # ~150 palavras por minuto

            return {
                "success": True,
                "script": text or "",
                "word_count": word_count,
                "estimated_duration": estimated_duration,
                "model": self.model
            }
        except Exception as e:
            logger.error("Error generating script from research", exc_info=True)
            return {"success": False, "message": str(e)}
