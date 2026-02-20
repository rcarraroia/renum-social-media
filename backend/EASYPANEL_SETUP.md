# 🚀 Guia de Deploy RENUM Backend no Easypanel

## ⚠️ IMPORTANTE: Serviços App Individuais (NÃO Compose)

Este guia configura 4 Apps independentes no Easypanel para habilitar HTTPS/SSL automático.

---

## 📋 PASSO 1: Deletar Serviço Compose Atual

1. Acesse o Easypanel
2. Localize o serviço `influency` (tipo Compose)
3. Delete o serviço completamente
4. Aguarde a remoção completa

---

## 🔧 PASSO 2: Criar os 4 Apps Independentes

### App 1: Redis (Cache e Rate Limiting)

**Configuração Básica:**
- **Nome do serviço:** `redis`
- **Tipo:** App
- **Imagem:** `redis:7-alpine`

**Configuração de Rede:**
- **Porta interna:** `6379`
- **Domínio:** Nenhum (apenas comunicação interna)

**Comando de Start:**
```bash
redis-server --appendonly yes --appendfsync everysec --maxmemory 256mb --maxmemory-policy allkeys-lru --save ""
```

**Volumes:**
- **Mount Path:** `/data`
- **Tipo:** Persistente

**Health Check:**
- **Comando:** `redis-cli ping`
- **Intervalo:** 10s
- **Timeout:** 5s
- **Retries:** 5

---

### App 2: API (FastAPI Backend)

**Configuração Básica:**
- **Nome do serviço:** `api`
- **Tipo:** App
- **Build Source:** GitHub
- **Repositório:** `rcarraroia/renum-social-media`
- **Branch:** `main`
- **Build Context:** `/backend`
- **Dockerfile:** `backend/Dockerfile`

**Configuração de Rede:**
- **Porta interna:** `8000`
- **Domínio HTTPS:** `renum-influency-app.wpjtfd.easypanel.host`
- **Target Port:** `8000`
- **SSL:** Automático (gerenciado pelo Easypanel)

**Comando de Start:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Variáveis de Ambiente:**
```bash
# Python Path
PYTHONPATH=/app

# Supabase
SUPABASE_URL=https://zbsbfhmsgrlohxdxihaw.supabase.co
SUPABASE_ANON_KEY=sb_publishable_uqML_JBZAc6sOa21oU74QQ_oJ-x96Ic
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2JmaG1zZ3Jsb2h4ZHhpaGF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0NDYyMywiZXhwIjoyMDg2NTIwNjIzfQ.7KEryxbsR5R9B7_Pn_LHUpRfSE8ux3nnF2Euv-QBQE0

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-placeholder
TAVILY_API_KEY=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
DEEPGRAM_API_KEY=placeholder
WHISPER_MODEL=base

# Encryption
ENCRYPTION_KEY=E_J7tMkgiYC9zq1fAFqZxnubRP_fshRdLJ6pxSKjEvM=

# Webhook Secrets
HEYGEN_WEBHOOK_SECRET=placeholder

# Redis (ATENÇÃO: usar nome do serviço)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# CORS
FRONTEND_URL=https://renum-post.vercel.app
ALLOWED_ORIGINS=https://renum-post.vercel.app,https://renum-post-rcarraroias-projects.vercel.app

# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Storage
TEMP_VIDEO_PATH=/tmp/videos
```

**Volumes:**
- **Mount Path:** `/tmp/videos`
- **Tipo:** Temporário

**Health Check:**
- **Comando:** `curl -f http://localhost:8000/health`
- **Intervalo:** 30s
- **Timeout:** 10s
- **Retries:** 3
- **Start Period:** 40s

**Dependências:**
- Aguardar serviço `redis` estar saudável

---

### App 3: Celery Worker (Processamento Assíncrono)

**Configuração Básica:**
- **Nome do serviço:** `celery-worker`
- **Tipo:** App
- **Build Source:** GitHub
- **Repositório:** `rcarraroia/renum-social-media`
- **Branch:** `main`
- **Build Context:** `/backend`
- **Dockerfile:** `backend/Dockerfile`

**Configuração de Rede:**
- **Porta interna:** Nenhuma
- **Domínio:** Nenhum (serviço interno)

**Comando de Start:**
```bash
python -m celery -A app.celery_app worker --loglevel=info --concurrency=2 --max-tasks-per-child=100
```

**Variáveis de Ambiente:**
```bash
# Python Path
PYTHONPATH=/app

# Supabase
SUPABASE_URL=https://zbsbfhmsgrlohxdxihaw.supabase.co
SUPABASE_ANON_KEY=sb_publishable_uqML_JBZAc6sOa21oU74QQ_oJ-x96Ic
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2JmaG1zZ3Jsb2h4ZHhpaGF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0NDYyMywiZXhwIjoyMDg2NTIwNjIzfQ.7KEryxbsR5R9B7_Pn_LHUpRfSE8ux3nnF2Euv-QBQE0

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-placeholder
TAVILY_API_KEY=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
DEEPGRAM_API_KEY=placeholder
WHISPER_MODEL=base

# Encryption
ENCRYPTION_KEY=E_J7tMkgiYC9zq1fAFqZxnubRP_fshRdLJ6pxSKjEvM=

# Webhook Secrets
HEYGEN_WEBHOOK_SECRET=placeholder

# Redis (ATENÇÃO: usar nome do serviço)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Server
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Storage
TEMP_VIDEO_PATH=/tmp/videos
```

**Volumes:**
- **Mount Path:** `/tmp/videos`
- **Tipo:** Temporário

**Health Check:**
- **Comando:** `celery -A app.celery_app inspect ping -d celery@$HOSTNAME`
- **Intervalo:** 30s
- **Timeout:** 10s
- **Retries:** 3
- **Start Period:** 40s

**Dependências:**
- Aguardar serviço `redis` estar saudável

---

### App 4: Celery Beat (Tarefas Agendadas)

**Configuração Básica:**
- **Nome do serviço:** `celery-beat`
- **Tipo:** App
- **Build Source:** GitHub
- **Repositório:** `rcarraroia/renum-social-media`
- **Branch:** `main`
- **Build Context:** `/backend`
- **Dockerfile:** `backend/Dockerfile`

**Configuração de Rede:**
- **Porta interna:** Nenhuma
- **Domínio:** Nenhum (serviço interno)

**Comando de Start:**
```bash
python -m celery -A app.celery_app beat --loglevel=info
```

**Variáveis de Ambiente:**
```bash
# Python Path
PYTHONPATH=/app

# Supabase
SUPABASE_URL=https://zbsbfhmsgrlohxdxihaw.supabase.co
SUPABASE_ANON_KEY=sb_publishable_uqML_JBZAc6sOa21oU74QQ_oJ-x96Ic
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2JmaG1zZ3Jsb2h4ZHhpaGF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0NDYyMywiZXhwIjoyMDg2NTIwNjIzfQ.7KEryxbsR5R9B7_Pn_LHUpRfSE8ux3nnF2Euv-QBQE0

# Encryption
ENCRYPTION_KEY=E_J7tMkgiYC9zq1fAFqZxnubRP_fshRdLJ6pxSKjEvM=

# Redis (ATENÇÃO: usar nome do serviço)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Server
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
```

**Dependências:**
- Aguardar serviço `redis` estar saudável

---

## ✅ PASSO 3: Verificação de Funcionamento

### 3.1 Verificar Status dos Serviços

No painel do Easypanel, você deve ver:

- 🟢 `redis` - Running
- 🟢 `api` - Running
- 🟢 `celery-worker` - Running
- 🟢 `celery-beat` - Running

### 3.2 Testar Endpoint de Health

Acesse via navegador ou curl:

```bash
curl https://renum-influency-app.wpjtfd.easypanel.host/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-20T...",
  "services": {
    "redis": "connected",
    "database": "connected"
  }
}
```

### 3.3 Verificar SSL/HTTPS

1. Acesse `https://renum-influency-app.wpjtfd.easypanel.host/health`
2. Verifique o cadeado verde no navegador
3. Clique no cadeado e confirme que o certificado é válido

### 3.4 Testar CORS do Frontend

No frontend (Vercel), teste uma requisição:

```javascript
fetch('https://renum-influency-app.wpjtfd.easypanel.host/api/v1/leads', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

Não deve haver erros de CORS.

### 3.5 Verificar Logs

Para cada serviço, verifique os logs no Easypanel:

**Redis:**
```
Ready to accept connections
```

**API:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Celery Worker:**
```
[INFO/MainProcess] Connected to redis://redis:6379/0
[INFO/MainProcess] celery@hostname ready.
```

**Celery Beat:**
```
[INFO/Beat] Scheduler: Sending due task
```

---

## 🔍 PASSO 4: Troubleshooting

### Problema: Redis não conecta

**Sintoma:** API mostra erro "Connection refused to redis:6379"

**Solução:**
1. Verifique se o serviço `redis` está com bolinha verde
2. Confirme que `REDIS_HOST=redis` (nome do serviço)
3. Verifique os logs do Redis

### Problema: SSL não funciona

**Sintoma:** Navegador mostra "Not Secure"

**Solução:**
1. Confirme que o App `api` tem domínio configurado
2. Aguarde 2-5 minutos para o SSL ser provisionado
3. Force refresh (Ctrl+Shift+R)

### Problema: CORS bloqueado

**Sintoma:** Frontend mostra erro "CORS policy"

**Solução:**
1. Verifique `ALLOWED_ORIGINS` na API
2. Confirme que inclui o domínio exato do Vercel
3. Reinicie o serviço `api`

### Problema: Celery Worker não processa tarefas

**Sintoma:** Tarefas ficam pendentes

**Solução:**
1. Verifique logs do `celery-worker`
2. Confirme conexão com Redis
3. Verifique se o comando de start está correto

---

## 📊 Arquitetura Final

```
┌─────────────────────────────────────────────────────────┐
│                    EASYPANEL                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐                                          │
│  │  Redis   │ ← Comunicação interna via nome           │
│  │  :6379   │                                          │
│  └────┬─────┘                                          │
│       │                                                 │
│  ┌────┴─────────────────────────────────┐             │
│  │                                       │             │
│  ▼                  ▼                    ▼             │
│ ┌────┐         ┌─────────┐         ┌────────┐        │
│ │API │◄────────┤ Celery  │◄────────┤ Celery │        │
│ │:8000│         │ Worker  │         │  Beat  │        │
│ └─┬──┘         └─────────┘         └────────┘        │
│   │                                                    │
│   │ HTTPS (SSL automático)                            │
│   ▼                                                    │
│ renum-influency-app.wpjtfd.easypanel.host             │
│                                                        │
└────────────────────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
            ┌─────────────────┐
            │  Frontend Vercel │
            │  renum-post      │
            └─────────────────┘
```

---

## 🎯 Resultado Esperado

✅ 4 bolinhas verdes no Easypanel  
✅ HTTPS funcionando com SSL válido  
✅ Endpoint `/health` acessível via HTTPS  
✅ CORS funcionando no frontend  
✅ Redis conectado e funcionando  
✅ Celery Worker processando tarefas  
✅ Celery Beat agendando tarefas  

---

## 📝 Notas Importantes

1. **Comunicação entre serviços:** No Easypanel, Apps se comunicam via nome do serviço como hostname (ex: `redis`, `api`)

2. **SSL automático:** O Easypanel provisiona SSL automaticamente quando você configura um domínio no App

3. **Volumes persistentes:** Apenas o Redis precisa de volume persistente. Os demais usam volumes temporários.

4. **Health checks:** Essenciais para o Easypanel saber quando o serviço está pronto

5. **Dependências:** Configure para que API, Worker e Beat aguardem o Redis estar saudável

6. **Logs:** Sempre verifique os logs de cada serviço para diagnosticar problemas

---

**Data de Criação:** 20/02/2026  
**Última Atualização:** 20/02/2026  
**Status:** Pronto para Deploy
