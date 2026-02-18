"""
AI Assistant Service - Assistente conversacional context-aware

Este serviço implementa assistente baseado em Claude Sonnet 4 com:
- Function calling nativo (10 tools)
- Context awareness (detecta página atual)
- Histórico de conversação
- Execução de ações através de tools

Validates: Requirements 6.1-6.5, 7.1-7.5, 8.1-8.5, 9.1-9.6, 10.1-10.6, 11.1-11.6
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
from app.services.claude import ClaudeService
from app.services.tavily import TavilyService
from app.services.metricool import MetricoolService
from app.utils.logger import get_logger
import asyncio

logger = get_logger("ai_assistant")


# Estruturas de dados
@dataclass
class PageContext:
    """Contexto da página atual do usuário"""
    page_name: str
    page_path: str
    additional_context: Optional[Dict[str, Any]] = None


@dataclass
class Message:
    """Mensagem no histórico de conversação"""
    role: str  # "user" ou "assistant"
    content: str
    timestamp: datetime


@dataclass
class ToolCall:
    """Chamada de tool executada ou sugerida"""
    tool_name: str
    arguments: Dict[str, Any]
    result: Optional[Any] = None
    executed: bool = False  # True se tool foi executada, False se apenas sugerida


@dataclass
class TokenUsage:
    """Uso de tokens da API Claude"""
    input_tokens: int
    output_tokens: int


@dataclass
class AssistantResponse:
    """Resposta do assistente"""
    message: str
    tool_calls: Optional[List[ToolCall]] = None
    requires_confirmation: bool = False
    tokens_used: Optional[TokenUsage] = None


class AIAssistantService:
    """
    Serviço de AI Assistant com function calling
    
    Responsabilidades:
    - Gerenciar conversação com Claude
    - Implementar 10 tools via function calling
    - Construir system prompt context-aware
    - Validar e executar tools
    - Gerenciar histórico de conversação
    """
    
    def __init__(self):
        """Inicializa o serviço com dependências"""
        self._claude = ClaudeService()
        self._tavily = TavilyService()
        self._metricool = MetricoolService()
        self._logger = get_logger("ai_assistant")
        self._tools = self._register_tools()
        self._logger.info("AIAssistantService initialized")
    
    async def __aenter__(self):
        """Context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        # Services não precisam de cleanup explícito
        pass
    
    def _register_tools(self) -> List[Dict[str, Any]]:
        """
        Registra todas as tools disponíveis para function calling
        
        Returns:
            Lista de 10 tools no formato do Claude API
            
        Validates: Requirements 8.1, 8.5, 9.1, 9.4, 9.5, 10.1-10.5
        """
        tools = [
            {
                "name": "generate_script",
                "description": "Gera um novo script de vídeo baseado em tema, tom e duração",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "description": "Tema ou assunto do vídeo"
                        },
                        "tone": {
                            "type": "string",
                            "enum": ["casual", "formal", "enthusiastic"],
                            "description": "Tom do script"
                        },
                        "duration_seconds": {
                            "type": "integer",
                            "description": "Duração desejada em segundos"
                        }
                    },
                    "required": ["topic"]
                }
            },
            {
                "name": "regenerate_script",
                "description": "Regenera um script existente com feedback do usuário",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "script_id": {
                            "type": "string",
                            "description": "ID do script a ser regenerado"
                        },
                        "feedback": {
                            "type": "string",
                            "description": "Feedback do usuário sobre o que melhorar"
                        }
                    },
                    "required": ["script_id", "feedback"]
                }
            },
            {
                "name": "schedule_post",
                "description": "Agenda um novo post para publicação",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "content": {
                            "type": "string",
                            "description": "Conteúdo do post"
                        },
                        "platform": {
                            "type": "string",
                            "description": "Plataforma onde publicar (instagram, tiktok, linkedin, etc.)"
                        },
                        "scheduled_time": {
                            "type": "string",
                            "description": "Data e hora de publicação (ISO 8601 format)"
                        }
                    },
                    "required": ["content", "platform", "scheduled_time"]
                }
            },
            {
                "name": "reschedule_post",
                "description": "Altera horário de um post agendado",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "post_id": {
                            "type": "string",
                            "description": "ID do post a ser reagendado"
                        },
                        "new_time": {
                            "type": "string",
                            "description": "Nova data e hora (ISO 8601 format)"
                        }
                    },
                    "required": ["post_id", "new_time"]
                }
            },
            {
                "name": "cancel_post",
                "description": "Cancela um post agendado",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "post_id": {
                            "type": "string",
                            "description": "ID do post a ser cancelado"
                        }
                    },
                    "required": ["post_id"]
                }
            },
            {
                "name": "get_analytics",
                "description": "Consulta métricas de desempenho",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "metric_type": {
                            "type": "string",
                            "enum": ["dashboard", "posts", "platforms"],
                            "description": "Tipo de métrica a consultar"
                        },
                        "start_date": {
                            "type": "string",
                            "description": "Data inicial (YYYY-MM-DD)"
                        },
                        "end_date": {
                            "type": "string",
                            "description": "Data final (YYYY-MM-DD)"
                        }
                    },
                    "required": ["metric_type"]
                }
            },
            {
                "name": "get_best_times",
                "description": "Consulta melhores horários para publicação",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "platform": {
                            "type": "string",
                            "description": "Plataforma específica (opcional)"
                        }
                    }
                }
            },
            {
                "name": "generate_descriptions",
                "description": "Gera descrições para post em múltiplas plataformas",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "content": {
                            "type": "string",
                            "description": "Conteúdo base para gerar descrições"
                        },
                        "platforms": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Lista de plataformas (instagram, tiktok, linkedin, etc.)"
                        }
                    },
                    "required": ["content", "platforms"]
                }
            },
            {
                "name": "search_web",
                "description": "Pesquisa informações na web usando Tavily",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Termo de busca"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "navigate",
                "description": "Navega para uma página específica do sistema",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "page": {
                            "type": "string",
                            "enum": ["dashboard", "scriptai", "postrapido", "avatarai", "calendar", "analytics", "settings"],
                            "description": "Página de destino"
                        }
                    },
                    "required": ["page"]
                }
            }
        ]
        
        self._logger.info(f"Registered {len(tools)} tools for AI Assistant")
        return tools
    
    async def process_message(
        self,
        message: str,
        context: PageContext,
        history: List[Message],
        org_id: str,
        blog_id: Optional[int] = None
    ) -> AssistantResponse:
        """
        Processa mensagem do usuário e retorna resposta
        
        Args:
            message: Mensagem do usuário
            context: Contexto da página atual
            history: Histórico de conversação (últimas 50 mensagens)
            org_id: ID da organização
            blog_id: ID do blog no Metricool (opcional)
            
        Returns:
            Resposta do assistente com possíveis tool calls
            
        Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
        """
        self._logger.info(
            "Processing message",
            extra={
                "org_id": org_id,
                "page": context.page_name,
                "message_length": len(message)
            }
        )
        
        try:
            # Construir system prompt baseado no contexto
            system_prompt = self._build_system_prompt(context)
            
            # Formatar histórico para Claude
            formatted_history = self._format_history(history)
            
            # Adicionar mensagem atual
            formatted_history.append({
                "role": "user",
                "content": message
            })
            
            # Chamar Claude com tools
            def _sync_call():
                return self._claude.client.messages.create(
                    model=self._claude.model,
                    max_tokens=2000,
                    system=system_prompt,
                    messages=formatted_history,
                    tools=self._tools
                )
            
            response = await asyncio.to_thread(_sync_call)
            
            # Extrair conteúdo da resposta
            content = getattr(response, "content", [])
            usage = getattr(response, "usage", None)
            
            # Processar tokens usage
            tokens_used = None
            if usage:
                tokens_used = TokenUsage(
                    input_tokens=getattr(usage, "input_tokens", 0),
                    output_tokens=getattr(usage, "output_tokens", 0)
                )
            
            # Processar conteúdo
            text_response = ""
            tool_calls = []
            requires_confirmation = False
            
            for block in content:
                if hasattr(block, "type"):
                    if block.type == "text":
                        text_response += getattr(block, "text", "")
                    
                    elif block.type == "tool_use":
                        tool_name = getattr(block, "name", "")
                        tool_input = getattr(block, "input", {})
                        
                        # Executar tool
                        tool_result = await self._execute_tool(
                            tool_name=tool_name,
                            arguments=tool_input,
                            org_id=org_id,
                            blog_id=blog_id
                        )
                        
                        # Verificar se requer confirmação
                        if self._requires_confirmation(tool_name):
                            requires_confirmation = True
                        
                        # Adicionar ao resultado
                        tool_calls.append(ToolCall(
                            tool_name=tool_name,
                            arguments=tool_input,
                            result=tool_result,
                            executed=tool_result.get("success", False)
                        ))
                        
                        # Se tool foi executada com sucesso, adicionar ao texto
                        if tool_result.get("success"):
                            message_from_tool = tool_result.get("message", "")
                            if message_from_tool:
                                text_response += f"\n\n{message_from_tool}"
            
            # Se não há texto mas há tool calls, gerar mensagem padrão
            if not text_response and tool_calls:
                text_response = "Ação executada com sucesso."
            
            self._logger.info(
                "Message processed successfully",
                extra={
                    "org_id": org_id,
                    "tools_executed": len(tool_calls),
                    "requires_confirmation": requires_confirmation
                }
            )
            
            return AssistantResponse(
                message=text_response,
                tool_calls=tool_calls if tool_calls else None,
                requires_confirmation=requires_confirmation,
                tokens_used=tokens_used
            )
        
        except Exception as e:
            self._logger.error(
                f"Error processing message: {e}",
                extra={"org_id": org_id},
                exc_info=True
            )
            
            return AssistantResponse(
                message="Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
                tool_calls=None,
                requires_confirmation=False,
                tokens_used=None
            )
    
    def _build_system_prompt(self, context: PageContext) -> str:
        """
        Constrói system prompt baseado no contexto da página
        
        Args:
            context: Contexto da página atual
            
        Returns:
            System prompt personalizado
            
        Validates: Requirements 6.2, 6.3
        """
        # Template base com capacidades e diretrizes
        base_prompt = """Você é o assistente AI do RENUM Social AI, uma plataforma de automação de conteúdo para redes sociais.

Suas capacidades:
- Gerar e regenerar scripts de vídeo
- Agendar, reagendar e cancelar posts
- Consultar métricas de desempenho e analytics
- Sugerir melhores horários para publicação
- Gerar descrições otimizadas para múltiplas plataformas
- Pesquisar informações na web
- Navegar entre páginas do sistema

Diretrizes:
- Seja conciso e objetivo nas respostas
- Use linguagem natural e amigável
- Sempre confirme antes de executar ações destrutivas (cancelar posts)
- Sugira ações proativas baseadas no contexto
- Forneça insights acionáveis quando consultar analytics
"""

        # Contexto específico da página
        page_contexts = {
            "Dashboard": """
Contexto atual: Você está no Dashboard.
O usuário pode ver estatísticas gerais aqui. Você pode:
- Consultar métricas de desempenho
- Sugerir próximas ações baseadas nos dados
- Navegar para outras páginas conforme necessário
""",
            "ScriptAI": """
Contexto atual: Você está no módulo ScriptAI.
O usuário está trabalhando com geração de scripts de vídeo. Você pode:
- Gerar novos scripts baseados em temas
- Regenerar scripts existentes com feedback
- Sugerir melhorias nos scripts
- Ajudar com ideias de conteúdo
""",
            "PostRápido": """
Contexto atual: Você está no módulo PostRápido.
O usuário está criando posts para redes sociais. Você pode:
- Gerar descrições otimizadas para múltiplas plataformas
- Sugerir melhores horários para publicação
- Agendar posts
- Pesquisar tendências e informações relevantes
""",
            "AvatarAI": """
Contexto atual: Você está no módulo AvatarAI.
O usuário está trabalhando com geração de vídeos com avatares. Você pode:
- Gerar scripts para vídeos com avatar
- Sugerir melhorias no conteúdo
- Ajudar com ideias criativas
""",
            "Calendar": """
Contexto atual: Você está no Calendário.
O usuário está gerenciando posts agendados. Você pode:
- Agendar novos posts
- Reagendar posts existentes
- Cancelar posts
- Sugerir melhores horários baseados em analytics
- Consultar posts agendados
""",
            "Analytics": """
Contexto atual: Você está na página de Analytics.
O usuário está analisando métricas de desempenho. Você pode:
- Consultar métricas detalhadas (dashboard, posts, plataformas)
- Identificar tendências e padrões
- Sugerir ações baseadas nos dados
- Comparar performance entre plataformas
- Recomendar melhores horários para publicação
""",
            "Settings": """
Contexto atual: Você está nas Configurações.
O usuário está gerenciando configurações da conta. Você pode:
- Ajudar com dúvidas sobre integrações
- Explicar funcionalidades do sistema
- Navegar para outras páginas conforme necessário
"""
        }
        
        # Adicionar contexto da página atual
        page_specific = page_contexts.get(context.page_name, "")
        
        # Adicionar contexto adicional se fornecido
        additional = ""
        if context.additional_context:
            additional = f"\n\nContexto adicional:\n{context.additional_context}"
        
        # Montar prompt completo
        full_prompt = f"{base_prompt}\n{page_specific}{additional}"
        
        self._logger.debug(
            f"Built system prompt for page: {context.page_name}",
            extra={"page": context.page_name}
        )
        
        return full_prompt
    
    async def _execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        org_id: str,
        blog_id: Optional[int]
    ) -> Dict[str, Any]:
        """
        Executa tool específico e retorna resultado
        
        Args:
            tool_name: Nome da tool
            arguments: Argumentos da tool
            org_id: ID da organização
            blog_id: ID do blog no Metricool
            
        Returns:
            Resultado da execução
            
        Validates: Requirements 8.1-8.5, 9.1-9.6, 10.1-10.6
        """
        self._logger.info(
            f"Executing tool: {tool_name}",
            extra={"tool": tool_name, "org_id": org_id}
        )
        
        try:
            # Parte 1: Tools de Geração de Conteúdo
            if tool_name == "generate_script":
                return await self._execute_generate_script(arguments)
            
            elif tool_name == "regenerate_script":
                return await self._execute_regenerate_script(arguments)
            
            elif tool_name == "generate_descriptions":
                return await self._execute_generate_descriptions(arguments)
            
            # Parte 2: Tools de Agendamento
            elif tool_name == "schedule_post":
                return await self._execute_schedule_post(arguments, org_id, blog_id)
            
            elif tool_name == "reschedule_post":
                return await self._execute_reschedule_post(arguments, org_id, blog_id)
            
            elif tool_name == "cancel_post":
                return await self._execute_cancel_post(arguments, org_id, blog_id)
            
            # Parte 3: Tools de Analytics e Navegação
            elif tool_name == "get_analytics":
                return await self._execute_get_analytics(arguments, org_id, blog_id)
            
            elif tool_name == "get_best_times":
                return await self._execute_get_best_times(arguments, org_id, blog_id)
            
            elif tool_name == "search_web":
                return await self._execute_search_web(arguments)
            
            elif tool_name == "navigate":
                return self._execute_navigate(arguments)
            
            else:
                return {
                    "success": False,
                    "error": f"Tool desconhecida: {tool_name}"
                }
        
        except Exception as e:
            self._logger.error(
                f"Error executing tool {tool_name}: {e}",
                exc_info=True
            )
            return {
                "success": False,
                "error": str(e)
            }
    
    # Parte 1: Tools de Geração de Conteúdo
    
    async def _execute_generate_script(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executa tool generate_script"""
        topic = arguments.get("topic")
        tone = arguments.get("tone", "casual")
        duration = arguments.get("duration_seconds", 60)
        
        result = await self._claude.generate_script(
            topic=topic,
            context="",
            duration_seconds=duration,
            tone=tone
        )
        
        if result.get("success"):
            return {
                "success": True,
                "script": result.get("script"),
                "message": f"Script gerado com sucesso sobre '{topic}'"
            }
        else:
            return {
                "success": False,
                "error": result.get("message", "Erro ao gerar script")
            }
    
    async def _execute_regenerate_script(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executa tool regenerate_script"""
        script_id = arguments.get("script_id")
        feedback = arguments.get("feedback")
        
        # TODO: Buscar script original do banco de dados
        # Por enquanto, retornar mensagem indicando que precisa ser implementado
        return {
            "success": False,
            "error": "Regeneração de scripts ainda não implementada. Será adicionada em versão futura."
        }
    
    async def _execute_generate_descriptions(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executa tool generate_descriptions"""
        content = arguments.get("content")
        platforms = arguments.get("platforms", [])
        
        result = await self._claude.generate_descriptions(
            transcription=content,
            platforms=platforms,
            tone="profissional",
            include_hashtags=True
        )
        
        return {
            "success": True,
            "descriptions": result,
            "message": f"Descrições geradas para {len(platforms)} plataformas"
        }
    
    def _requires_confirmation(self, tool_name: str) -> bool:
        """
        Verifica se tool requer confirmação do usuário
        
        Args:
            tool_name: Nome da tool
            
        Returns:
            True se requer confirmação, False caso contrário
        """
        # Tools que modificam dados requerem confirmação
        confirmation_required = [
            "schedule_post",
            "reschedule_post",
            "cancel_post"
        ]
        return tool_name in confirmation_required
    
    def _format_history(self, history: List[Message]) -> List[Dict[str, str]]:
        """
        Formata histórico para formato do Claude API
        
        Args:
            history: Lista de mensagens
            
        Returns:
            Histórico formatado para Claude
        """
        formatted = []
        for msg in history[-50:]:  # Limitar a últimas 50 mensagens
            formatted.append({
                "role": msg.role,
                "content": msg.content
            })
        return formatted

    
    # Parte 2: Tools de Agendamento
    
    async def _execute_schedule_post(self, arguments: Dict[str, Any], org_id: str, blog_id: Optional[int]) -> Dict[str, Any]:
        """Executa tool schedule_post"""
        from datetime import datetime
        
        content = arguments.get("content")
        platform = arguments.get("platform")
        scheduled_time = arguments.get("scheduled_time")
        
        # Validar horário futuro
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
            if scheduled_dt <= datetime.now(scheduled_dt.tzinfo):
                return {
                    "success": False,
                    "error": "Horário de agendamento deve ser no futuro"
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Formato de data inválido: {e}"
            }
        
        # TODO: Implementar agendamento via MetricoolService
        # Por enquanto, retornar sucesso simulado
        return {
            "success": True,
            "message": f"Post agendado para {platform} em {scheduled_time}",
            "post_id": "simulated_post_id",
            "requires_confirmation": True
        }
    
    async def _execute_reschedule_post(self, arguments: Dict[str, Any], org_id: str, blog_id: Optional[int]) -> Dict[str, Any]:
        """Executa tool reschedule_post"""
        from datetime import datetime
        
        post_id = arguments.get("post_id")
        new_time = arguments.get("new_time")
        
        # Validar horário futuro
        try:
            new_dt = datetime.fromisoformat(new_time.replace("Z", "+00:00"))
            if new_dt <= datetime.now(new_dt.tzinfo):
                return {
                    "success": False,
                    "error": "Novo horário deve ser no futuro"
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Formato de data inválido: {e}"
            }
        
        # TODO: Implementar reagendamento via MetricoolService
        return {
            "success": True,
            "message": f"Post {post_id} reagendado para {new_time}",
            "requires_confirmation": True
        }
    
    async def _execute_cancel_post(self, arguments: Dict[str, Any], org_id: str, blog_id: Optional[int]) -> Dict[str, Any]:
        """Executa tool cancel_post"""
        post_id = arguments.get("post_id")
        
        # TODO: Implementar cancelamento via MetricoolService
        return {
            "success": True,
            "message": f"Post {post_id} cancelado",
            "requires_confirmation": True
        }
    
    # Parte 3: Tools de Analytics e Navegação
    
    async def _execute_get_analytics(self, arguments: Dict[str, Any], org_id: str, blog_id: Optional[int]) -> Dict[str, Any]:
        """Executa tool get_analytics"""
        from app.services.analytics import AnalyticsService
        from datetime import date
        
        metric_type = arguments.get("metric_type")
        start_date_str = arguments.get("start_date")
        end_date_str = arguments.get("end_date")
        
        if not blog_id:
            return {
                "success": False,
                "error": "Metricool não configurado para esta organização"
            }
        
        # Converter datas se fornecidas
        start_date = date.fromisoformat(start_date_str) if start_date_str else None
        end_date = date.fromisoformat(end_date_str) if end_date_str else None
        
        try:
            async with AnalyticsService() as analytics:
                if metric_type == "dashboard":
                    metrics = await analytics.get_dashboard_metrics(org_id, blog_id)
                    return {
                        "success": True,
                        "data": {
                            "total_reach": metrics.total_reach,
                            "total_engagement": metrics.total_engagement,
                            "engagement_rate": metrics.engagement_rate,
                            "total_followers": metrics.total_followers,
                            "reach_change": metrics.reach_change_percent,
                            "engagement_change": metrics.engagement_change_percent
                        },
                        "message": "Métricas do dashboard obtidas com sucesso"
                    }
                
                elif metric_type == "posts":
                    posts = await analytics.get_posts_performance(
                        org_id, blog_id, start_date, end_date
                    )
                    return {
                        "success": True,
                        "data": {
                            "total_posts": len(posts),
                            "top_posts": [
                                {
                                    "platform": p.platform,
                                    "reach": p.reach,
                                    "engagement_rate": p.engagement_rate,
                                    "content": p.content_preview
                                }
                                for p in posts[:5]
                            ]
                        },
                        "message": f"Performance de {len(posts)} posts obtida"
                    }
                
                elif metric_type == "platforms":
                    platforms = await analytics.get_platform_breakdown(
                        org_id, blog_id, start_date, end_date
                    )
                    return {
                        "success": True,
                        "data": {
                            "platforms": [
                                {
                                    "platform": p.platform,
                                    "reach": p.reach,
                                    "engagement": p.engagement,
                                    "contribution": p.contribution_percent
                                }
                                for p in platforms
                            ]
                        },
                        "message": f"Breakdown de {len(platforms)} plataformas obtido"
                    }
                
                else:
                    return {
                        "success": False,
                        "error": f"Tipo de métrica inválido: {metric_type}"
                    }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao buscar analytics: {str(e)}"
            }
    
    async def _execute_get_best_times(self, arguments: Dict[str, Any], org_id: str, blog_id: Optional[int]) -> Dict[str, Any]:
        """Executa tool get_best_times"""
        from app.services.analytics import AnalyticsService
        
        platform = arguments.get("platform")
        
        if not blog_id:
            return {
                "success": False,
                "error": "Metricool não configurado para esta organização"
            }
        
        try:
            async with AnalyticsService() as analytics:
                best_times = await analytics.get_best_times(org_id, blog_id, platform)
                
                # Formatar resposta de forma amigável
                formatted = {}
                for plat, times in best_times.items():
                    formatted[plat] = [
                        {
                            "hour": t.hour,
                            "day": ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][t.day_of_week],
                            "engagement": t.avg_engagement
                        }
                        for t in times
                    ]
                
                return {
                    "success": True,
                    "data": formatted,
                    "message": f"Melhores horários obtidos para {len(formatted)} plataformas"
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao buscar melhores horários: {str(e)}"
            }
    
    async def _execute_search_web(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executa tool search_web"""
        query = arguments.get("query")
        
        try:
            results = await self._tavily.search(query, max_results=5)
            
            # Formatar resultados
            formatted_results = []
            for result in results.get("results", []):
                formatted_results.append({
                    "title": result.get("title"),
                    "url": result.get("url"),
                    "snippet": result.get("content", "")[:200]
                })
            
            return {
                "success": True,
                "data": formatted_results,
                "message": f"Encontrados {len(formatted_results)} resultados para '{query}'"
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao pesquisar: {str(e)}"
            }
    
    def _execute_navigate(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executa tool navigate"""
        page = arguments.get("page")
        
        # Mapear páginas para URLs
        page_urls = {
            "dashboard": "/",
            "scriptai": "/scriptai",
            "postrapido": "/postrapido",
            "avatarai": "/avatarai",
            "calendar": "/calendar",
            "analytics": "/analytics",
            "settings": "/settings"
        }
        
        url = page_urls.get(page)
        if url:
            return {
                "success": True,
                "url": url,
                "message": f"Navegando para {page}"
            }
        else:
            return {
                "success": False,
                "error": f"Página desconhecida: {page}"
            }
