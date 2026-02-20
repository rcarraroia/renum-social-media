# ⚡ Referência Rápida - Easypanel Apps

## 🎯 Comandos de Start (Copy-Paste)

### Redis
```bash
redis-server --appendonly yes --appendfsync everysec --maxmemory 256mb --maxmemory-policy allkeys-lru --save ""
```

### API
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Celery Worker
```bash
python -m celery -A app.celery_app worker --loglevel=info --concurrency=2 --max-tasks-per-child=100
```

### Celery Beat
```bash
python -m celery -A app.celery_app beat --loglevel=info
```

---

## 🔧 Variáveis de Ambiente Críticas

### Todas as Apps (exceto Redis)
```bash
PYTHONPATH=/app
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
```

### API, Worker e Beat (Supabase)
```bash
SUPABASE_URL=https://zbsbfhmsgrlohxdxihaw.supabase.co
SUPABASE_ANON_KEY=sb_publishable_uqML_JBZAc6sOa21oU74QQ_oJ-x96Ic
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic2JmaG1zZ3Jsb2h4ZHhpaGF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0NDYyMywiZXhwIjoyMDg2NTIwNjIzfQ.7KEryxbsR5R9B7_Pn_LHUpRfSE8ux3nnF2Euv-QBQE0
```

### API, Worker e Beat (AI Services)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-placeholder
TAVILY_API_KEY=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
DEEPGRAM_API_KEY=placeholder
WHISPER_MODEL=base
HEYGEN_WEBHOOK_SECRET=placeholder
```

### API, Worker e Beat (Encryption)
```bash
ENCRYPTION_KEY=E_J7tMkgiYC9zq1fAFqZxnubRP_fshRdLJ6pxSKjEvM=
```

### Apenas API (CORS e Server)
```bash
FRONTEND_URL=https://renum-post.vercel.app
ALLOWED_ORIGINS=https://renum-post.vercel.app,https://renum-post-rcarraroias-projects.vercel.app
HOST=0.0.0.0
PORT=8000
```

### API, Worker e Beat (Storage)
```bash
TEMP_VIDEO_PATH=/tmp/videos
```

---

## 📦 Configuração de Build (API, Worker, Beat)

```
Repository: rcarraroia/renum-social-media
Branch: main
Build Context: /backend
Dockerfile: backend/Dockerfile
```

---

## 🌐 Configuração de Rede

### Redis
- Porta interna: 6379
- Domínio: Nenhum

### API
- Porta interna: 8000
- Domínio: renum-influency-app.wpjtfd.easypanel.host
- Target Port: 8000

### Celery Worker
- Porta interna: Nenhuma
- Domínio: Nenhum

### Celery Beat
- Porta interna: Nenhuma
- Domínio: Nenhum

---

## 💾 Volumes

### Redis
- Mount Path: `/data`
- Tipo: Persistente

### API, Worker, Beat
- Mount Path: `/tmp/videos`
- Tipo: Temporário

---

## 🏥 Health Checks

### Redis
```bash
redis-cli ping
```
Intervalo: 10s | Timeout: 5s | Retries: 5

### API
```bash
curl -f http://localhost:8000/health
```
Intervalo: 30s | Timeout: 10s | Retries: 3 | Start Period: 40s

### Celery Worker
```bash
celery -A app.celery_app inspect ping -d celery@$HOSTNAME
```
Intervalo: 30s | Timeout: 10s | Retries: 3 | Start Period: 40s

### Celery Beat
Nenhum (opcional)

---

## ✅ Checklist de Deploy

- [ ] Deletar serviço Compose `influency`
- [ ] Criar App `redis` com imagem `redis:7-alpine`
- [ ] Criar App `api` com build do GitHub
- [ ] Criar App `celery-worker` com build do GitHub
- [ ] Criar App `celery-beat` com build do GitHub
- [ ] Configurar domínio HTTPS na API
- [ ] Configurar todas as variáveis de ambiente
- [ ] Aguardar 4 bolinhas verdes
- [ ] Testar `https://renum-influency-app.wpjtfd.easypanel.host/health`
- [ ] Verificar SSL no navegador (cadeado verde)
- [ ] Testar CORS do frontend

---

## 🔍 Testes Rápidos

### Teste 1: Health Check
```bash
curl https://renum-influency-app.wpjtfd.easypanel.host/health
```

### Teste 2: SSL
```bash
curl -I https://renum-influency-app.wpjtfd.easypanel.host/health
```
Deve retornar `HTTP/2 200`

### Teste 3: CORS (do frontend)
```javascript
fetch('https://renum-influency-app.wpjtfd.easypanel.host/api/v1/leads')
  .then(r => console.log('CORS OK'))
  .catch(e => console.error('CORS Error:', e))
```

---

## 🚨 Troubleshooting Rápido

### Redis não conecta
```bash
# Verificar se REDIS_HOST=redis (não localhost)
# Verificar logs do Redis
# Confirmar bolinha verde no Redis
```

### SSL não funciona
```bash
# Aguardar 2-5 minutos
# Verificar domínio configurado na API
# Force refresh (Ctrl+Shift+R)
```

### CORS bloqueado
```bash
# Verificar ALLOWED_ORIGINS na API
# Confirmar domínio exato do Vercel
# Reiniciar serviço API
```

### Celery não processa
```bash
# Verificar logs do celery-worker
# Confirmar REDIS_HOST=redis
# Verificar comando de start
```

---

**Tempo estimado de deploy:** 15-20 minutos  
**Dificuldade:** Média  
**Pré-requisitos:** Conta Easypanel, Repositório GitHub
