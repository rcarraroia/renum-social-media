# DESIGN - OpenRouter Integration + Transcription Fixes

## 📐 ARQUITETURA DA SOLUÇÃO

### Visão Geral

A solução implementa uma camada de abstração para modelos de IA, permitindo uso de múltiplos providers (Anthropic direto ou OpenRouter) com fallback automático e configuração por serviço.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 FASTAPI BACKEND                             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (module1.py, module2.py, ai_assistant)  │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Service Abstraction Layer                 │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────┐      │  │
│  │  │ ClaudeService   │      │OpenRouterService│      │  │
│  │  │ (Anthropic SDK) │      │  (OpenAI SDK)   │      │  │
│  │  └─────────────────┘      └─────────────────┘      │  │
│  │           ▲                        ▲                 │  │
│  │           │                        │                 │  │
│  │           └────────┬───────────────┘                 │  │
│  │                    │                                 │  │
│  │         USE_OPENROUTER flag                         │  │
│  └────────────────────┼─────────────────────────────────┘  │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐         ┌──────────────────────┐
│  Anthropic API   │         │   OpenRouter API     │
│  (Claude Models) │         │  (400+ Models)       │
└──────────────────┘         └──────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  Anthropic   │  │   Google     │  │    xAI       │
            │   (Claude)   │  │  (Gemini)    │  │   (Grok)     │
            └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🏗️ COMPONENTES PRINCIPAIS

### 1. OpenRouterService

**Localização:** `backend/app/services/openrouter.py`

**Responsabilidades:**
- Gerenciar conexão com OpenRouter API
- Implementar fallback chain por serviço
- Manter interface compatível com ClaudeService
- Validar API keys antes de processar
- Logar uso de modelos

**Dependências:**
- `openai` SDK (para compatibilidade OpenAI)
- `app.config.settings`
- `app.utils.logger`

**Interface Pública:**
```python
class OpenRouterService:
    def __init__(self)
    async def generate_script_from_research(...) -> Dict[str, Any]
    async def generate_descriptions(...) -> Dict[str, Dict[str, Any]]
    async def regenerate_description(...) -> Dict[str, Any]
```

### 2. TranscriptionService (Modificado)

**Localização:** `backend/app/services/transcription.py`

**Modificações:**
- Corrigir validação de `DEEPGRAM_API_KEY` no `__init__`
- Adicionar try-catch em `transcribe_audio()` para fallback
- Adicionar campo `provider` no response
- Melhorar logging de erros

**Fluxo de Fallback:**
```
transcribe_audio()
    │
    ├─> Deepgram key válida?
    │   ├─> SIM: Tentar Deepgram
    │   │   ├─> Sucesso: Retornar resultado
    │   │   └─> Falha: Logar erro → Tentar Whisper
    │   │
    │   └─> NÃO: Usar Whisper diretamente
    │
    └─> Whisper disponível?
        ├─> SIM: Retornar resultado
        └─> NÃO: Retornar erro
```

### 3. Configuration (Settings)

**Localização:** `backend/app/config.py`

**Novas Variáveis:**
```python
# OpenRouter
use_openrouter: bool = False
openrouter_api_key: str | None = None
openrouter_script_model: str | None = None
openrouter_description_model: str | None = None
openrouter_assistant_model: str | None = None
```

**Nota:** Modelos não têm valores padrão. A configuração será feita pelo administrador via painel admin (ainda não desenvolvido).

### 4. API Routes (Modificados)

**Arquivos Afetados:**
- `backend/app/api/routes/module1.py` (ScriptAI)
- `backend/app/api/routes/module2.py` (PostRápido)
- `backend/app/services/ai_assistant.py` (AI Assistant)

**Modificação:**
```python
# Antes
from app.services.claude import ClaudeService
claude_service = ClaudeService()

# Depois
from app.config import settings

if settings.use_openrouter:
    from app.services.openrouter import OpenRouterService
    ai_service = OpenRouterService()
else:
    from app.services.claude import ClaudeService
    ai_service = ClaudeService()
```

---

## 🔄 FLUXOS DE DADOS

### Fluxo 1: Geração de Script com OpenRouter

```
1. POST /api/scriptai/generate
   ├─> Validar autenticação
   ├─> Validar API keys (Tavily + OpenRouter/Anthropic)
   │   └─> Se inválida: HTTP 503
   │
   ├─> Tavily.search(topic)
   │   └─> Obter contexto de pesquisa
   │
   ├─> OpenRouterService.generate_script_from_research()
   │   ├─> Construir prompt
   │   ├─> Tentar modelo primário (ex: claude-sonnet-4)
   │   │   ├─> Sucesso: Retornar script
   │   │   └─> Falha: Tentar fallback 1 (ex: grok-4)
   │   │       ├─> Sucesso: Retornar script
   │   │       └─> Falha: Tentar fallback 2 (ex: gemini-flash)
   │   │           ├─> Sucesso: Retornar script
   │   │           └─> Falha: Retornar erro
   │   │
   │   └─> Logar modelo usado
   │
   ├─> Construir metadata (modelo, fontes, stats)
   ├─> Registrar em api_logs
   └─> Retornar ScriptResponse
```

### Fluxo 2: Transcrição com Fallback

```
1. transcribe_audio(audio_path, language)
   │
   ├─> Validar DEEPGRAM_API_KEY
   │   ├─> Válida (não None, não vazia, não "placeholder")
   │   │   │
   │   │   ├─> Tentar Deepgram API
   │   │   │   ├─> Sucesso
   │   │   │   │   └─> Retornar {text, segments, provider: "deepgram"}
   │   │   │   │
   │   │   │   └─> Falha (timeout, erro API, etc)
   │   │   │       ├─> Logar erro do Deepgram
   │   │   │       └─> Tentar Whisper (fallback)
   │   │   │           ├─> Sucesso
   │   │   │           │   └─> Retornar {text, segments, provider: "whisper"}
   │   │   │           │
   │   │   │           └─> Falha
   │   │   │               └─> Retornar erro
   │   │
   │   └─> Inválida (None, vazia, "placeholder")
   │       │
   │       └─> Usar Whisper diretamente
   │           ├─> Sucesso
   │           │   └─> Retornar {text, segments, provider: "whisper"}
   │           │
   │           └─> Falha
   │               └─> Retornar erro
```

---

## 🎨 DECISÕES DE DESIGN

### Decisão 1: Dual Mode vs Migração Completa

**Opções Consideradas:**
1. Migração completa para OpenRouter (remover ClaudeService)
2. Dual mode com flag USE_OPENROUTER
3. Criar abstração genérica AIService

**Decisão:** Dual mode com flag USE_OPENROUTER

**Justificativa:**
- Permite migração gradual e reversível
- Mantém Anthropic como fallback de emergência
- Menor risco de quebrar funcionalidades existentes
- Facilita testes A/B de qualidade

**Trade-offs:**
- Mais código para manter (dois serviços)
- Complexidade adicional na configuração

### Decisão 2: Formato de API (OpenAI vs Anthropic)

**Opções Consideradas:**
1. Usar SDK Anthropic com conversão de formato
2. Usar SDK OpenAI com base_url customizada
3. Criar cliente HTTP customizado

**Decisão:** Usar SDK OpenAI com base_url customizada

**Justificativa:**
- OpenRouter usa formato OpenAI nativamente
- SDK OpenAI é mais maduro e testado
- Menos conversões de formato = menos bugs
- Documentação mais abundante

**Trade-offs:**
- Precisa reescrever chamadas de API
- Formato de resposta ligeiramente diferente

### Decisão 3: Fallback Chain por Serviço

**Opções Consideradas:**
1. Fallback chain global (mesmo para todos)
2. Fallback chain por serviço (customizado)
3. Sem fallback (falha imediata)

**Decisão:** Fallback chain por serviço

**Justificativa:**
- Diferentes serviços têm necessidades diferentes (criatividade vs velocidade vs custo)
- Permite otimização de custos por caso de uso
- Configuração será feita pelo administrador via painel admin (ainda não desenvolvido)

**Trade-offs:**
- Configuração mais complexa
- Mais código para gerenciar chains

### Decisão 4: Validação de API Keys

**Opções Consideradas:**
1. Validar apenas no startup
2. Validar em cada requisição
3. Validar e cachear resultado

**Decisão:** Validar em cada requisição

**Justificativa:**
- Keys podem ser rotacionadas em runtime
- Evita falhas silenciosas
- Mensagens de erro mais claras para usuário
- Segurança adicional

**Trade-offs:**
- Overhead mínimo por requisição (~1ms)

### Decisão 5: Transcrição - Fallback Automático

**Opções Consideradas:**
1. Fallback apenas na inicialização
2. Fallback em runtime (try-catch)
3. Sem fallback (falha imediata)

**Decisão:** Fallback em runtime

**Justificativa:**
- Deepgram pode falhar por timeout, rate limit, etc
- Whisper local é confiável como backup
- Melhora disponibilidade do serviço
- Usuário não precisa reenviar requisição

**Trade-offs:**
- Tempo de resposta maior em caso de falha (~10s)
- Complexidade adicional no código

---

## 📊 MODELO DE DADOS

### Metadata em videos.metadata (JSONB)

```json
{
  "generation_params": {
    "topic": "string",
    "audience": "string",
    "tone": "string",
    "duration": 60,
    "language": "pt-BR"
  },
  "sources": [
    {
      "title": "string",
      "url": "string"
    }
  ],
  "script_stats": {
    "word_count": 150,
    "estimated_duration": 60,
    "generated_at": "2026-02-20T10:00:00Z",
    "model": "anthropic/claude-sonnet-4",
    "provider": "openrouter",
    "fallback_used": false
  }
}
```

### Logs em api_logs

```json
{
  "organization_id": "uuid",
  "module": "1",
  "endpoint": "/generate",
  "status_code": 200,
  "duration_ms": 5432,
  "request_body": {
    "topic": "string",
    "audience": "mlm"
  },
  "response_body": {
    "model_used": "anthropic/claude-sonnet-4",
    "provider": "openrouter",
    "fallback_chain": ["anthropic/claude-sonnet-4"]
  }
}
```

---

## ⚠️ RESTRIÇÃO CRÍTICA — FRONTEND

**Esta implementação é 100% backend. Nenhum arquivo do frontend deve ser alterado.**

- O painel atual do usuário (`/settings`, `/module-1`, `/module-2`, etc.) permanece intocado
- A única API key que o usuário final configura no painel atual é a do HeyGen
- A configuração do OpenRouter (chave de API, modelos por serviço) será feita exclusivamente pelo administrador via painel admin
- O painel admin ainda não existe e não será desenvolvido nesta spec
- Qualquer interface de configuração do OpenRouter fica para quando o painel admin for implementado

---

## 🔒 SEGURANÇA

### Validação de API Keys

```python
def validate_api_key(key: str | None, service_name: str) -> bool:
    """
    Valida se API key é válida
    
    Returns:
        True se válida, False caso contrário
    """
    if key is None:
        logger.error(f"{service_name} API key is None")
        return False
    
    if key.strip() == "":
        logger.error(f"{service_name} API key is empty")
        return False
    
    if key.lower() == "placeholder":
        logger.error(f"{service_name} API key is placeholder")
        return False
    
    return True
```

### Sanitização de Logs

```python
def sanitize_for_log(data: dict) -> dict:
    """
    Remove API keys e dados sensíveis antes de logar
    """
    sensitive_keys = ["api_key", "token", "password", "secret"]
    
    sanitized = data.copy()
    for key in sensitive_keys:
        if key in sanitized:
            sanitized[key] = "***REDACTED***"
    
    return sanitized
```

---

## 🧪 ESTRATÉGIA DE TESTES

### Testes Unitários

**Arquivo:** `backend/tests/services/test_openrouter.py`

```python
class TestOpenRouterService:
    def test_init_with_valid_key()
    def test_init_with_invalid_key()
    def test_init_with_placeholder_key()
    
    async def test_generate_script_success()
    async def test_generate_script_fallback()
    async def test_generate_script_all_models_fail()
    
    async def test_generate_descriptions_success()
    async def test_generate_descriptions_partial_failure()
```

**Arquivo:** `backend/tests/services/test_transcription.py`

```python
class TestTranscriptionService:
    def test_init_with_valid_deepgram_key()
    def test_init_with_invalid_deepgram_key()
    def test_init_with_placeholder_deepgram_key()
    
    async def test_transcribe_deepgram_success()
    async def test_transcribe_deepgram_failure_fallback_whisper()
    async def test_transcribe_whisper_direct()
    async def test_transcribe_both_fail()
```

### Testes de Integração

**Arquivo:** `backend/tests/api/test_module1_integration.py`

```python
class TestScriptAIIntegration:
    async def test_generate_with_openrouter()
    async def test_generate_with_anthropic()
    async def test_generate_with_invalid_key()
    async def test_generate_with_fallback()
```

### Casos de Borda Obrigatórios

Conforme AGENTS.md, TODOS os seguintes casos DEVEM ser testados:

1. **API key = "placeholder"**
   - OpenRouter
   - Anthropic
   - Deepgram

2. **API key = None**
   - OpenRouter
   - Anthropic
   - Deepgram

3. **API key = "" (vazia)**
   - OpenRouter
   - Anthropic
   - Deepgram

4. **API externa offline**
   - OpenRouter timeout
   - Deepgram timeout
   - Anthropic timeout

5. **Modelo não existe**
   - Modelo configurado não existe no OpenRouter
   - Fallback para próximo modelo

6. **Rate limit excedido**
   - OpenRouter rate limit
   - Deepgram rate limit

7. **Resposta malformada**
   - OpenRouter retorna JSON inválido
   - Deepgram retorna JSON inválido

---

## 📈 MONITORAMENTO E OBSERVABILIDADE

### Métricas a Coletar

```python
# Uso de modelos
openrouter_model_usage_total{model="claude-sonnet-4", service="scriptai"}
openrouter_model_usage_total{model="gemini-flash", service="assistant"}

# Fallbacks
openrouter_fallback_total{from_model="claude-sonnet-4", to_model="grok-4"}

# Latência
openrouter_request_duration_seconds{model="claude-sonnet-4"}

# Erros
openrouter_errors_total{model="claude-sonnet-4", error_type="timeout"}

# Transcrição
transcription_provider_usage_total{provider="deepgram"}
transcription_provider_usage_total{provider="whisper"}
transcription_fallback_total{from="deepgram", to="whisper"}
```

### Logs Estruturados

```python
logger.info(
    "OpenRouter request completed",
    extra={
        "model": "anthropic/claude-sonnet-4",
        "service": "scriptai",
        "duration_ms": 3421,
        "fallback_used": False,
        "organization_id": "uuid"
    }
)
```

---

## 🚀 ESTRATÉGIA DE DEPLOY

### Fase 1: Preparação
**Objetivo:** Código pronto sem impacto em produção

**Tarefas:**
- Criar `OpenRouterService`
- Adicionar variáveis de ambiente
- Implementar testes
- Corrigir bugs de transcrição
- Deploy com `USE_OPENROUTER=false`

**Validação:**
- Sistema funciona identicamente
- Testes passam
- Nenhum erro em logs

### Fase 2: Testes em Staging
**Objetivo:** Validar OpenRouter em ambiente controlado

**Tarefas:**
- Configurar `USE_OPENROUTER=true` em staging
- Testar todos os endpoints
- Comparar qualidade de outputs
- Medir latência e custos
- Validar fallback chains

**Validação:**
- Qualidade de scripts aceitável
- Latência < 200ms adicional
- Fallback funciona
- Custos dentro do esperado

### Fase 3: Deploy Gradual em Produção
**Objetivo:** Migrar gradualmente por serviço

**Tarefas:**
- Semana 1: AI Assistant (maior volume, menor criticidade)
- Semana 2: PostRápido (médio volume)
- Semana 3: ScriptAI (menor volume, maior criticidade)

**Validação por Serviço:**
- Monitorar logs por 48h
- Comparar métricas com baseline
- Coletar feedback de usuários
- Validar custos reais

### Fase 4: Otimização
**Objetivo:** Ajustar configurações baseado em dados reais

**Tarefas:**
- Analisar uso de modelos
- Ajustar fallback chains
- Otimizar custos
- Implementar cache se necessário

---

## 🔄 ROLLBACK PLAN

### Cenário 1: OpenRouter com problemas
**Ação:** Configurar `USE_OPENROUTER=false`  
**Tempo:** < 5 minutos  
**Impacto:** Zero (volta para Anthropic)

### Cenário 2: Bugs em OpenRouterService
**Ação:** Reverter deploy  
**Tempo:** < 10 minutos  
**Impacto:** Zero (código antigo funciona)

### Cenário 3: Custos muito altos
**Ação:** Ajustar modelos ou desabilitar OpenRouter  
**Tempo:** < 5 minutos  
**Impacto:** Mínimo (troca de modelo)

---

## 📚 REFERÊNCIAS TÉCNICAS

### OpenRouter
- [API Reference](https://openrouter.ai/docs/api-reference)
- [Models List](https://openrouter.ai/models)
- [Pricing](https://openrouter.ai/docs/pricing)

### Anthropic
- [Claude API Docs](https://docs.anthropic.com)
- [OpenAI Compatibility](https://docs.anthropic.com/en/api/openai-sdk)

### Deepgram
- [API Reference](https://developers.deepgram.com/reference)
- [Error Codes](https://developers.deepgram.com/docs/error-codes)

### Whisper
- [OpenAI Whisper GitHub](https://github.com/openai/whisper)
- [Model Cards](https://github.com/openai/whisper/blob/main/model-card.md)

---

**Data de Criação:** 20/02/2026  
**Autor:** Kiro AI  
**Status:** PRONTO PARA IMPLEMENTAÇÃO  
**Versão:** 1.0
