# Variáveis de Ambiente - RENUM Social Media Backend

Este documento lista todas as variáveis de ambiente necessárias para configurar o backend do RENUM Social Media.

---

## VARIÁVEIS OBRIGATÓRIAS

Estas variáveis DEVEM ser configuradas para o sistema funcionar.

### Supabase (Database + Auth + Storage)

```bash
# URL do projeto Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Chave anônima (pública) - usada para operações com RLS
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chave service role (privada) - NUNCA expor no frontend
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Como obter**:
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em Settings > API
4. Copie as chaves

### Encryption (Criptografia de API Keys)

```bash
# Chave de 32 bytes para criptografar API keys no banco
ENCRYPTION_KEY=your_32_byte_encryption_key_here
```

**Como gerar**:
```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32
```

⚠️ **IMPORTANTE**: Guarde esta chave em local seguro. Se perdê-la, não será possível descriptografar as API keys armazenadas.

---

## VARIÁVEIS OPCIONAIS

Estas variáveis são opcionais, mas recomendadas para funcionalidade completa.

### AI Services

#### Anthropic (Claude AI)

```bash
# API key do Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

**Como obter**:
1. Acesse [Anthropic Console](https://console.anthropic.com)
2. Crie uma API key
3. Copie a chave

**Usado em**:
- Módulo Script AI (geração de roteiros)
- Módulo Post Rápido (geração de posts)
- Assistente AI

#### Tavily (Web Search)

```bash
# API key do Tavily para pesquisa web
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
```

**Como obter**:
1. Acesse [Tavily](https://tavily.com)
2. Crie uma conta
3. Gere uma API key

**Usado em**:
- Pesquisa de tendências
- Pesquisa de conteúdo para posts

### Transcription (Transcrição de Áudio)

#### Opção 1: Deepgram (Recomendado para Produção)

```bash
# API key do Deepgram
DEEPGRAM_API_KEY=xxxxxxxxxxxxx
```

**Como obter**:
1. Acesse [Deepgram](https://deepgram.com)
2. Crie uma conta
3. Gere uma API key

**Vantagens**:
- Mais rápido que Whisper local
- Não consome recursos do servidor
- Suporta múltiplos idiomas

#### Opção 2: Whisper Local (Desenvolvimento)

```bash
# Modelo do Whisper (tiny, base, small, medium, large)
WHISPER_MODEL=base
```

**Modelos disponíveis**:
- `tiny`: Mais rápido, menos preciso (~1GB RAM)
- `base`: Balanceado (~1GB RAM) - **Padrão**
- `small`: Mais preciso (~2GB RAM)
- `medium`: Muito preciso (~5GB RAM)
- `large`: Máxima precisão (~10GB RAM)

**Usado em**:
- Transcrição de vídeos
- Geração de legendas

### Webhooks

#### HeyGen (Avatar AI)

```bash
# Secret para validar webhooks do HeyGen
HEYGEN_WEBHOOK_SECRET=your_webhook_secret_here
```

**Como obter**:
1. Acesse [HeyGen Dashboard](https://app.heygen.com)
2. Configure webhook URL
3. Copie o secret fornecido

**Usado em**:
- Receber notificações de vídeos gerados
- Validar autenticidade dos webhooks

### Redis (Cache e Rate Limiting)

```bash
# Host do Redis
REDIS_HOST=localhost

# Porta do Redis
REDIS_PORT=6379

# Database do Redis (0-15)
REDIS_DB=0

# Senha do Redis (opcional)
REDIS_PASSWORD=your_redis_password
```

**Configuração**:
- **Desenvolvimento**: Redis local sem senha
- **Produção**: Redis com senha forte

**Usado em**:
- Rate limiting (proteção contra abuso)
- Cache de dados
- Fila de tarefas assíncronas (Celery)

### CORS (Cross-Origin Resource Sharing)

```bash
# URL do frontend principal
FRONTEND_URL=https://renum.vercel.app

# Lista de origens permitidas (separadas por vírgula)
ALLOWED_ORIGINS=http://localhost:5173,https://renum.vercel.app,https://app.renum.com
```

**Configuração por ambiente**:
- **Desenvolvimento**: `http://localhost:5173,http://localhost:3000`
- **Staging**: `https://staging.renum.app,http://localhost:5173`
- **Produção**: `https://renum.app,https://app.renum.com,https://www.renum.com`

### Server (Configuração do Servidor)

```bash
# Host do servidor (0.0.0.0 para aceitar conexões externas)
HOST=0.0.0.0

# Porta do servidor
PORT=8000

# Ambiente (development, staging, production)
ENVIRONMENT=production

# Debug mode (true/false)
DEBUG=false

# Nível de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO
```

**Recomendações**:
- **Desenvolvimento**: `DEBUG=true`, `LOG_LEVEL=DEBUG`
- **Staging**: `DEBUG=false`, `LOG_LEVEL=INFO`
- **Produção**: `DEBUG=false`, `LOG_LEVEL=WARNING`

### Storage (Armazenamento Temporário)

```bash
# Diretório para arquivos temporários de vídeo
TEMP_VIDEO_PATH=/tmp/videos
```

**Configuração**:
- **Docker**: `/tmp/videos` (volume montado)
- **Local**: `./temp/videos`

---

## ARQUIVO .env.example

Copie este template para criar seu arquivo `.env`:

```bash
# ============================================
# OBRIGATÓRIAS
# ============================================

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# ============================================
# OPCIONAIS - AI SERVICES
# ============================================

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Tavily Web Search
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx

# ============================================
# OPCIONAIS - TRANSCRIPTION
# ============================================

# Deepgram (recomendado para produção)
DEEPGRAM_API_KEY=xxxxxxxxxxxxx

# Whisper Local (alternativa para desenvolvimento)
WHISPER_MODEL=base

# ============================================
# OPCIONAIS - WEBHOOKS
# ============================================

# HeyGen
HEYGEN_WEBHOOK_SECRET=your_webhook_secret_here

# ============================================
# OPCIONAIS - REDIS
# ============================================

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# ============================================
# OPCIONAIS - CORS
# ============================================

FRONTEND_URL=https://renum.vercel.app
ALLOWED_ORIGINS=http://localhost:5173,https://renum.vercel.app

# ============================================
# OPCIONAIS - SERVER
# ============================================

HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# ============================================
# OPCIONAIS - STORAGE
# ============================================

TEMP_VIDEO_PATH=/tmp/videos
```

---

## CONFIGURAÇÃO NO EASYPANEL

### 1. Criar Aplicação

1. Acesse o Easypanel
2. Crie nova aplicação
3. Selecione "Docker Compose"

### 2. Configurar Variáveis de Ambiente

No painel do Easypanel, adicione as variáveis de ambiente:

#### Aba "Environment"

```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ENCRYPTION_KEY=your_32_byte_key
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
REDIS_HOST=redis
REDIS_PORT=6379
ENVIRONMENT=production
LOG_LEVEL=INFO
```

#### Aba "Secrets" (Recomendado para Chaves Sensíveis)

Adicione como secrets:
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY`
- `ANTHROPIC_API_KEY`
- `REDIS_PASSWORD`

### 3. Configurar Redis

No Easypanel, adicione um serviço Redis:

1. Clique em "Add Service"
2. Selecione "Redis"
3. Configure:
   - Nome: `redis`
   - Versão: `7-alpine`
   - Persistência: Habilitada
   - Senha: Gere uma senha forte

### 4. Conectar Serviços

No docker-compose.yml, o Redis já está configurado para usar `redis` como hostname.

---

## VALIDAÇÃO

### Verificar Variáveis Obrigatórias

```bash
# Executar no backend
python -c "from app.config import settings; settings.validate_critical_vars()"
```

Se alguma variável obrigatória estiver faltando, um erro será exibido.

### Verificar Conexões

```bash
# Health check
curl http://localhost:8000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "services": {
    "supabase": "connected",
    "redis": "connected",
    "tavily": "configured",
    "claude": "configured"
  }
}
```

---

## SEGURANÇA

### ⚠️ NUNCA FAÇA

- ❌ Commitar arquivo `.env` no Git
- ❌ Expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ❌ Compartilhar `ENCRYPTION_KEY` publicamente
- ❌ Usar mesmas chaves em dev e produção
- ❌ Logar valores de variáveis sensíveis

### ✅ SEMPRE FAÇA

- ✅ Adicionar `.env` no `.gitignore`
- ✅ Usar `.env.example` como template
- ✅ Rotacionar chaves periodicamente
- ✅ Usar secrets manager em produção
- ✅ Validar variáveis na inicialização

---

## TROUBLESHOOTING

### Erro: "Missing critical environment variables"

**Causa**: Variável obrigatória não configurada

**Solução**:
1. Verifique o erro para identificar qual variável está faltando
2. Adicione a variável no arquivo `.env`
3. Reinicie a aplicação

### Erro: "Supabase connection failed"

**Causa**: `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` inválidos

**Solução**:
1. Verifique se as chaves estão corretas no Supabase Dashboard
2. Verifique se não há espaços extras nas variáveis
3. Teste a conexão: `curl $SUPABASE_URL/rest/v1/`

### Erro: "Redis connection refused"

**Causa**: Redis não está rodando ou `REDIS_HOST` incorreto

**Solução**:
1. Verifique se Redis está rodando: `docker-compose ps redis`
2. Verifique se `REDIS_HOST=redis` (no Docker)
3. Teste conexão: `redis-cli -h $REDIS_HOST ping`

---

## REFERÊNCIAS

- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com)
- [Tavily API Documentation](https://docs.tavily.com)
- [Deepgram API Documentation](https://developers.deepgram.com)
- [Redis Documentation](https://redis.io/docs)
- [FastAPI Settings](https://fastapi.tiangolo.com/advanced/settings/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
