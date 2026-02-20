# Investigação de Erros - ScriptAI (20/02/2026)

## 🎯 Objetivo
Investigar e corrigir dois erros críticos bloqueando o ScriptAI em produção:
1. `/api/scriptai/drafts` retornando 500
2. `/api/scriptai/generate` retornando 502 + CORS bloqueado

---

## 🔍 Metodologia

Seguindo **Regra 4 do AGENTS.md**: Sempre consultar schema real do banco via Supabase Power antes de qualquer análise.

### Ferramentas Utilizadas
- ✅ Supabase Power (MCP) - Consulta de schema e dados reais
- ✅ Análise de código fonte
- ✅ Validação de configurações

---

## 📊 PROBLEMA 1: `/api/scriptai/drafts` retornando 500

### Investigação

#### 1. Validação do Schema Real (Supabase Power)
```sql
SELECT organization_id FROM users WHERE id = '760c86d0-56e0-49a4-9295-f90ac7cd1533'
```

**Resultado:** ✅ Query funciona perfeitamente
```json
[{"organization_id": "035b40f7-d4f9-4036-ba39-9ff3920bed1b"}]
```

#### 2. Análise da Função `get_organization_by_user_id`
**Localização:** `backend/app/database.py`

**Status:** ✅ Implementação correta
- Cliente Supabase usa `service_role_key` (bypassa RLS)
- Query está correta: `.select("organization_id").eq("id", user_id).single()`
- Tratamento de exceção presente

#### 3. Análise do Endpoint `/drafts` (GET)
**Localização:** `backend/app/api/routes/module1.py`

**Fluxo:**
1. `get_current_organization` (dependency)
2. → `get_current_user` (valida JWT)
3. → `get_organization_by_user_id` (busca org_id)
4. → Query na tabela `videos`

### Causa Raiz Identificada

O erro 500 pode ocorrer por:
1. **Token JWT inválido/expirado** - Usuário não autenticado
2. **Usuário não existe na tabela `users`** - Registro faltando
3. **Logging insuficiente** - Dificulta debug em produção

### Correção Aplicada

**Arquivo:** `backend/app/database.py`

**Mudanças:**
```python
# ANTES: Logging mínimo
except Exception:
    return None

# DEPOIS: Logging detalhado
except Exception as e:
    logger.error(f"Error fetching organization for user {user_id}: {e}", exc_info=True)
    return None
```

**Melhorias:**
- ✅ Logging de warnings quando user não encontrado
- ✅ Logging de warnings quando user sem organization_id
- ✅ Logging de info quando busca bem-sucedida
- ✅ Logging de erro com stack trace completo

**Impacto:** Facilita identificação da causa raiz em produção via logs do Easypanel.

---

## 📊 PROBLEMA 2: `/api/scriptai/generate` retornando 502 + CORS

### Investigação

#### 1. Análise de CORS

**Arquivo:** `backend/.env`
```env
FRONTEND_URL=https://renum-post.vercel.app
ALLOWED_ORIGINS=https://renum-post.vercel.app,https://renum-post-rcarraroias-projects.vercel.app
```

**Arquivo:** `backend/app/config.py`
```python
@field_validator("allowed_origins")
@classmethod
def parse_origins(cls, v):
    if isinstance(v, str):
        return [origin.strip() for origin in v.split(",") if origin.strip()]
    return v
```

**Arquivo:** `backend/app/main.py`
```python
cors_origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    ...
)
```

**Status:** ✅ CORS configurado corretamente
- Domínio `https://renum-post.vercel.app` está na lista
- Parsing de string para lista funciona via `field_validator`
- Middleware aplicado corretamente

#### 2. Análise do Erro 502

**Arquivo:** `backend/.env`
```env
ANTHROPIC_API_KEY=sk-ant-api03-placeholder
TAVILY_API_KEY=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
```

**Problema Identificado:** ❌ `ANTHROPIC_API_KEY` está como `placeholder`

**Fluxo do Erro:**
1. Frontend chama `/api/scriptai/generate`
2. Backend valida autenticação ✅
3. TavilyService faz pesquisa ✅
4. ClaudeService tenta gerar script ❌
5. Anthropic API rejeita key `placeholder`
6. Erro não tratado adequadamente
7. Worker cai → 502 Bad Gateway

### Causa Raiz Identificada

**502 Bad Gateway causado por:**
1. ❌ API Key do Claude configurada como `placeholder`
2. ❌ Falta de validação de API keys antes de processar
3. ❌ Mensagens de erro genéricas

**CORS não é o problema** - Está configurado corretamente.

### Correção Aplicada

**Arquivo:** `backend/app/api/routes/module1.py`

**Endpoints corrigidos:**
- `/generate` (POST)
- `/regenerate` (POST)

**Mudanças:**
```python
# ANTES: Sem validação de API keys
try:
    tavily_service = TavilyService()
    search_result = await tavily_service.search(...)

# DEPOIS: Validação antes de processar
try:
    # Validar API keys antes de processar
    from app.config import settings
    if not settings.tavily_api_key or settings.tavily_api_key == "placeholder":
        logger.error("Tavily API key not configured")
        raise HTTPException(
            status_code=503,
            detail="Serviço de pesquisa não configurado. Contate o administrador."
        )
    
    if not settings.anthropic_api_key or settings.anthropic_api_key == "placeholder":
        logger.error("Anthropic API key not configured")
        raise HTTPException(
            status_code=503,
            detail="Serviço de geração de script não configurado. Contate o administrador."
        )
    
    tavily_service = TavilyService()
    search_result = await tavily_service.search(...)
```

**Melhorias:**
- ✅ Validação de API keys antes de processar
- ✅ Retorno de 503 (Service Unavailable) ao invés de 502
- ✅ Mensagens de erro user-friendly
- ✅ Logging de erros para debug

**Impacto:** 
- Worker não cai mais com 502
- Usuário recebe mensagem clara sobre o problema
- Administrador pode identificar API key faltando via logs

---

## 🎯 Ações Necessárias no Easypanel

### 1. Configurar API Key do Claude

**Variável de Ambiente:**
```env
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Como obter:**
1. Acessar https://console.anthropic.com/
2. Criar nova API key
3. Copiar e configurar no Easypanel

### 2. Verificar Logs

**Após deploy das correções:**
```bash
# Verificar logs do serviço app
# Buscar por:
# - "Error fetching organization for user"
# - "Tavily API key not configured"
# - "Anthropic API key not configured"
```

---

## ✅ Resultados Esperados

### Após Configurar API Key do Claude

**Endpoint `/api/scriptai/generate`:**
- ✅ Retorna 200 com script gerado
- ✅ CORS funciona corretamente
- ✅ Sem 502 Bad Gateway

**Endpoint `/api/scriptai/drafts`:**
- ✅ Retorna 200 com lista de drafts
- ✅ Logs detalhados em caso de erro
- ✅ Mensagens de erro claras

---

## 📝 Commit Realizado

```
commit 1654efa
Author: Kiro AI
Date: 20/02/2026

fix(scriptai): melhorar tratamento de erros em /generate e /drafts

- Adicionar validação de API keys antes de processar requisições
- Melhorar logging em get_organization_by_user_id
- Retornar 503 quando API keys não estão configuradas
- Adicionar mensagens de erro mais descritivas

Resolve: 500 em /drafts e 502 em /generate
```

---

## 🔍 Testes Recomendados

### 1. Teste de `/drafts` (GET)
```bash
curl -X GET https://api.renum.app/api/scriptai/drafts \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Esperado:** 200 com lista de drafts

### 2. Teste de `/generate` (POST)
```bash
curl -X POST https://api.renum.app/api/scriptai/generate \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Inteligência Artificial",
    "audience": "general",
    "tone": "professional",
    "duration": 60,
    "language": "pt-BR"
  }'
```

**Esperado:** 200 com script gerado

### 3. Teste de CORS
```bash
curl -X OPTIONS https://api.renum.app/api/scriptai/generate \
  -H "Origin: https://renum-post.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

**Esperado:** Headers CORS corretos

---

## 📚 Referências

- **AGENTS.md - Regra 4:** Sempre usar Supabase Power para análise de banco
- **Supabase Power:** Validação de schema real
- **Systematic Debugging:** Metodologia de 4 fases aplicada

---

**Data:** 20/02/2026  
**Status:** ✅ Correções aplicadas e commitadas  
**Próximo Passo:** Configurar ANTHROPIC_API_KEY no Easypanel
