# Guia de Deploy - RENUM Social Media Backend

Este guia fornece instruções passo-a-passo para fazer deploy do backend RENUM Social Media no Easypanel.

---

## PRÉ-REQUISITOS

Antes de iniciar o deploy, certifique-se de ter:

- ✅ Conta no [Easypanel](https://easypanel.io)
- ✅ Projeto Supabase configurado
- ✅ API keys dos serviços externos (Anthropic, Tavily, etc)
- ✅ Código do backend no repositório Git
- ✅ Arquivo `docker-compose.yml` configurado
- ✅ Variáveis de ambiente documentadas

---

## PASSO 1: PREPARAR AMBIENTE SUPABASE

### 1.1 Aplicar Migrations

```bash
# Conectar ao Supabase
cd supabase

# Aplicar todas as migrations
supabase db push

# Verificar que foram aplicadas
supabase db diff
```

### 1.2 Configurar RLS (Row Level Security)

Verifique que as políticas RLS estão ativas:

```sql
-- Executar no SQL Editor do Supabase
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Todas as tabelas devem ter `rowsecurity = true`.

### 1.3 Habilitar Extensões

```sql
-- Executar no SQL Editor do Supabase
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.4 Configurar Storage Buckets

1. Acesse Supabase Dashboard > Storage
2. Crie os buckets necessários:
   - `videos` (privado)
   - `thumbnails` (público)
   - `avatars` (público)

3. Configure políticas de acesso para cada bucket

---

## PASSO 2: CONFIGURAR EASYPANEL

### 2.1 Criar Conta e Projeto

1. Acesse [Easypanel](https://easypanel.io)
2. Crie uma conta ou faça login
3. Crie um novo projeto: "RENUM Backend"

### 2.2 Conectar Repositório Git

1. No Easypanel, vá em "Apps" > "Create App"
2. Selecione "From Git Repository"
3. Conecte sua conta GitHub/GitLab
4. Selecione o repositório do backend
5. Branch: `main` (ou `production`)

### 2.3 Configurar Build

1. Build Method: "Docker Compose"
2. Docker Compose Path: `backend/docker-compose.yml`
3. Context Path: `backend/`

---

## PASSO 3: CONFIGURAR REDIS

### 3.1 Adicionar Serviço Redis

1. No Easypanel, clique em "Add Service"
2. Selecione "Redis"
3. Configure:
   - **Nome**: `redis`
   - **Versão**: `7-alpine`
   - **Persistência**: Habilitada
   - **Memória**: 256MB
   - **Senha**: Gere uma senha forte

```bash
# Gerar senha forte
python -c "import secrets; print(secrets.token_urlsafe(24))"
```

4. Anote a senha gerada

### 3.2 Configurar Persistência

1. Habilite volume persistente
2. Tamanho: 1GB (ajuste conforme necessário)
3. Backup automático: Habilitado (recomendado)

---

## PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 4.1 Variáveis Obrigatórias

No Easypanel, vá em "Environment" e adicione:

```bash
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=senha_gerada_no_passo_3

# Server
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
```

### 4.2 Variáveis Opcionais (Recomendadas)

```bash
# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx

# Transcription
DEEPGRAM_API_KEY=xxxxxxxxxxxxx

# Webhooks
HEYGEN_WEBHOOK_SECRET=your_webhook_secret_here

# CORS
FRONTEND_URL=https://renum.app
ALLOWED_ORIGINS=https://renum.app,https://app.renum.com,https://www.renum.com

# Storage
TEMP_VIDEO_PATH=/tmp/videos
```

### 4.3 Usar Secrets (Recomendado)

Para variáveis sensíveis, use a aba "Secrets":

1. Clique em "Secrets"
2. Adicione como secrets:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ENCRYPTION_KEY`
   - `ANTHROPIC_API_KEY`
   - `REDIS_PASSWORD`

---

## PASSO 5: CONFIGURAR DOMÍNIO E SSL

### 5.1 Adicionar Domínio Customizado

1. No Easypanel, vá em "Domains"
2. Clique em "Add Domain"
3. Digite seu domínio: `api.renum.com`
4. Clique em "Add"

### 5.2 Configurar DNS

No seu provedor de DNS (Cloudflare, Route53, etc):

1. Adicione registro CNAME:
   ```
   Type: CNAME
   Name: api
   Value: [valor fornecido pelo Easypanel]
   TTL: Auto
   ```

2. Aguarde propagação DNS (pode levar até 48h, geralmente < 5min)

### 5.3 Habilitar SSL

1. No Easypanel, vá em "Domains"
2. Clique em "Enable SSL" ao lado do domínio
3. Aguarde emissão do certificado Let's Encrypt (automático)
4. Verifique que o status mudou para "SSL Enabled"

---

## PASSO 6: FAZER DEPLOY

### 6.1 Iniciar Deploy

1. No Easypanel, clique em "Deploy"
2. Selecione a branch: `main`
3. Clique em "Deploy Now"

### 6.2 Acompanhar Build

1. Vá em "Logs" > "Build Logs"
2. Acompanhe o processo de build
3. Aguarde conclusão (5-10 minutos)

**Etapas do build**:
- ✅ Clone do repositório
- ✅ Build da imagem Docker (multi-stage)
- ✅ Push para registry
- ✅ Deploy dos containers
- ✅ Health checks

### 6.3 Verificar Deploy

```bash
# Verificar health check
curl https://api.renum.com/health

# Resultado esperado
{
  "status": "ok",
  "version": "0.4.0",
  "services": {
    "supabase": "connected",
    "redis": "connected",
    "ffmpeg": "available",
    "tavily": "configured",
    "claude": "configured"
  }
}
```

---

## PASSO 7: CONFIGURAR WEBHOOKS

### 7.1 HeyGen Webhook

1. Acesse [HeyGen Dashboard](https://app.heygen.com)
2. Vá em Settings > Webhooks
3. Configure:
   - **URL**: `https://api.renum.com/api/webhooks/heygen`
   - **Secret**: Valor de `HEYGEN_WEBHOOK_SECRET`
   - **Events**: `video.completed`, `video.failed`
4. Clique em "Test Webhook"
5. Verifique que retornou 200 OK

---

## PASSO 8: VALIDAÇÃO PÓS-DEPLOY

### 8.1 Verificar Serviços

```bash
# Health check
curl https://api.renum.com/health

# Readiness check
curl https://api.renum.com/health/ready

# Verificar versão
curl https://api.renum.com/health | jq '.version'
```

### 8.2 Verificar Logs

No Easypanel:

1. Vá em "Logs" > "Application Logs"
2. Verifique que não há erros
3. Verifique logs estruturados em JSON

```json
{
  "timestamp": "2026-02-19T14:30:45.123Z",
  "level": "INFO",
  "message": "Application startup complete"
}
```

### 8.3 Testar Endpoints

```bash
# Testar autenticação (deve retornar 401)
curl https://api.renum.com/api/dashboard/videos

# Testar CORS
curl -H "Origin: https://renum.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.renum.com/api/dashboard/videos
```

### 8.4 Verificar Celery Workers

No Easypanel, vá em "Containers" e verifique:

- ✅ `renum-api` - Status: Running (healthy)
- ✅ `renum-redis` - Status: Running (healthy)
- ✅ `renum-celery-worker` - Status: Running (healthy)
- ✅ `renum-celery-beat` - Status: Running

---

## PASSO 9: CONFIGURAR MONITORAMENTO

### 9.1 Habilitar Alertas

No Easypanel:

1. Vá em "Monitoring" > "Alerts"
2. Configure alertas para:
   - CPU > 80%
   - Memória > 80%
   - Disco > 90%
   - Container down

### 9.2 Configurar Uptime Monitoring

Recomendações de serviços externos:

- [UptimeRobot](https://uptimerobot.com) (gratuito)
- [Pingdom](https://www.pingdom.com)
- [Better Uptime](https://betteruptime.com)

Configure monitoramento para:
- `https://api.renum.com/health` (a cada 5 minutos)

---

## ROLLBACK

### Rollback Rápido (Via Easypanel)

1. No Easypanel, vá em "Deployments"
2. Selecione o deploy anterior
3. Clique em "Rollback to this version"
4. Confirme

### Rollback Manual (Via Git)

```bash
# Reverter para commit anterior
git revert HEAD
git push origin main

# Ou reverter para commit específico
git reset --hard <commit-hash>
git push origin main --force

# Easypanel fará deploy automático
```

### Rollback de Migrations

```bash
# Conectar ao Supabase
cd supabase

# Reverter última migration
supabase db reset

# Ou reverter para migration específica
supabase db reset --version <migration-version>
```

---

## TROUBLESHOOTING

### Problema: Build Falha

**Sintoma**: Build logs mostram erro durante build da imagem

**Soluções**:

1. Verificar Dockerfile:
   ```bash
   # Testar build local
   cd backend
   docker build -t renum-backend .
   ```

2. Verificar dependências:
   ```bash
   # Verificar requirements.txt
   pip install -r requirements.txt
   ```

3. Verificar logs de build no Easypanel

### Problema: Container Não Inicia

**Sintoma**: Container fica em estado "Restarting"

**Soluções**:

1. Verificar logs:
   ```bash
   # No Easypanel, vá em Logs > Application Logs
   ```

2. Verificar variáveis de ambiente:
   ```bash
   # Verificar se todas as obrigatórias estão configuradas
   ```

3. Verificar health check:
   ```bash
   # Testar localmente
   docker-compose up
   curl http://localhost:8000/health
   ```

### Problema: Redis Connection Failed

**Sintoma**: Logs mostram "Error connecting to Redis"

**Soluções**:

1. Verificar se Redis está rodando:
   ```bash
   # No Easypanel, verificar status do container redis
   ```

2. Verificar variáveis:
   ```bash
   REDIS_HOST=redis  # Deve ser "redis", não "localhost"
   REDIS_PASSWORD=senha_correta
   ```

3. Testar conexão:
   ```bash
   # No Easypanel, abrir terminal do container api
   redis-cli -h redis -a $REDIS_PASSWORD ping
   ```

### Problema: Supabase Connection Failed

**Sintoma**: Health check retorna "supabase": "error"

**Soluções**:

1. Verificar chaves:
   ```bash
   # Verificar no Supabase Dashboard > Settings > API
   ```

2. Verificar URL:
   ```bash
   # Deve ser: https://xxxxxxxxxxxxx.supabase.co
   # Sem barra no final
   ```

3. Testar conexão:
   ```bash
   curl -I $SUPABASE_URL/rest/v1/
   ```

### Problema: CORS Error

**Sintoma**: Frontend não consegue fazer requisições

**Soluções**:

1. Verificar ALLOWED_ORIGINS:
   ```bash
   # Deve incluir domínio do frontend
   ALLOWED_ORIGINS=https://renum.app,https://app.renum.com
   ```

2. Verificar que não há espaços extras

3. Testar CORS:
   ```bash
   curl -H "Origin: https://renum.app" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://api.renum.com/api/dashboard/videos
   ```

### Problema: Celery Worker Não Processa Tasks

**Sintoma**: Tasks ficam pendentes na fila

**Soluções**:

1. Verificar logs do worker:
   ```bash
   # No Easypanel, Logs > celery-worker
   ```

2. Verificar conexão com Redis:
   ```bash
   # Worker deve conseguir conectar ao Redis
   ```

3. Reiniciar worker:
   ```bash
   # No Easypanel, Containers > celery-worker > Restart
   ```

---

## CHECKLIST DE VALIDAÇÃO

Antes de considerar o deploy completo, verifique:

### Infraestrutura
- [ ] Supabase configurado e acessível
- [ ] Redis rodando e acessível
- [ ] Domínio configurado e SSL ativo
- [ ] Variáveis de ambiente configuradas

### Aplicação
- [ ] Build bem-sucedido
- [ ] Todos os containers rodando (api, redis, celery-worker, celery-beat)
- [ ] Health check retornando 200 OK
- [ ] Logs estruturados em JSON
- [ ] Sem erros nos logs

### Funcionalidades
- [ ] Autenticação funcionando
- [ ] CORS configurado corretamente
- [ ] Webhooks configurados
- [ ] Celery processando tasks
- [ ] Upload de arquivos funcionando

### Monitoramento
- [ ] Alertas configurados
- [ ] Uptime monitoring ativo
- [ ] Logs sendo coletados

---

## MANUTENÇÃO

### Atualizar Aplicação

```bash
# 1. Fazer alterações no código
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 2. Easypanel fará deploy automático
# 3. Verificar logs de deploy
# 4. Validar health check
```

### Atualizar Dependências

```bash
# 1. Atualizar requirements.txt
pip install --upgrade <package>
pip freeze > requirements.txt

# 2. Testar localmente
docker-compose build
docker-compose up

# 3. Commit e push
git add requirements.txt
git commit -m "chore: update dependencies"
git push origin main
```

### Backup do Redis

```bash
# No Easypanel, vá em Services > Redis > Backups
# Configure backup automático diário
```

### Rotação de Secrets

```bash
# 1. Gerar novo secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Atualizar no Easypanel (Secrets)
# 3. Reiniciar containers
# 4. Validar funcionamento
```

---

## REFERÊNCIAS

- [Easypanel Documentation](https://easypanel.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Redis Documentation](https://redis.io/docs)
- [Celery Documentation](https://docs.celeryq.dev)

---

## SUPORTE

Em caso de problemas:

1. Verificar logs no Easypanel
2. Consultar seção de Troubleshooting
3. Verificar documentação das dependências
4. Abrir issue no repositório do projeto

---

**Última atualização**: 2026-02-19  
**Versão**: 0.4.0
