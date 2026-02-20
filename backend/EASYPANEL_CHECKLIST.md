# ✅ Checklist de Deploy - Easypanel Apps

## 📋 FASE 1: Preparação (5 min)

- [ ] Acesso ao Easypanel confirmado
- [ ] Repositório GitHub `rcarraroia/renum-social-media` acessível
- [ ] Arquivo `EASYPANEL_SETUP.md` aberto para referência
- [ ] Arquivo `EASYPANEL_QUICK_REFERENCE.md` aberto para copy-paste

---

## 🗑️ FASE 2: Limpeza (2 min)

- [ ] Localizar serviço `influency` (tipo Compose) no Easypanel
- [ ] Deletar o serviço completamente
- [ ] Aguardar confirmação de remoção
- [ ] Verificar que não há resíduos

---

## 🔴 FASE 3: App Redis (3 min)

### Criar App
- [ ] Clicar em "Create App"
- [ ] Nome: `redis`
- [ ] Tipo: App

### Configurar Imagem
- [ ] Imagem: `redis:7-alpine`
- [ ] Não usar build do GitHub

### Configurar Comando
- [ ] Copiar comando de `EASYPANEL_QUICK_REFERENCE.md`
- [ ] Colar em "Start Command"

### Configurar Rede
- [ ] Porta interna: `6379`
- [ ] Sem domínio público

### Configurar Volume
- [ ] Adicionar volume persistente
- [ ] Mount path: `/data`

### Configurar Health Check
- [ ] Comando: `redis-cli ping`
- [ ] Intervalo: 10s
- [ ] Timeout: 5s
- [ ] Retries: 5

### Verificar
- [ ] Salvar configurações
- [ ] Aguardar deploy
- [ ] Verificar bolinha verde 🟢
- [ ] Verificar logs: "Ready to accept connections"

---

## 🟢 FASE 4: App API (5 min)

### Criar App
- [ ] Clicar em "Create App"
- [ ] Nome: `api`
- [ ] Tipo: App

### Configurar Build
- [ ] Source: GitHub
- [ ] Repositório: `rcarraroia/renum-social-media`
- [ ] Branch: `main`
- [ ] Build Context: `/backend`
- [ ] Dockerfile: `backend/Dockerfile`

### Configurar Comando
- [ ] Copiar comando de `EASYPANEL_QUICK_REFERENCE.md`
- [ ] Colar em "Start Command"

### Configurar Rede
- [ ] Porta interna: `8000`
- [ ] Adicionar domínio: `renum-influency-app.wpjtfd.easypanel.host`
- [ ] Target port: `8000`
- [ ] SSL: Automático

### Configurar Variáveis de Ambiente
- [ ] Copiar TODAS as variáveis de `EASYPANEL_QUICK_REFERENCE.md`
- [ ] Seção: "API, Worker e Beat (Supabase)"
- [ ] Seção: "API, Worker e Beat (AI Services)"
- [ ] Seção: "API, Worker e Beat (Encryption)"
- [ ] Seção: "Apenas API (CORS e Server)"
- [ ] Seção: "API, Worker e Beat (Storage)"
- [ ] Seção: "Todas as Apps (exceto Redis)"
- [ ] **CRÍTICO:** Confirmar `REDIS_HOST=redis`

### Configurar Volume
- [ ] Adicionar volume temporário
- [ ] Mount path: `/tmp/videos`

### Configurar Health Check
- [ ] Comando: `curl -f http://localhost:8000/health`
- [ ] Intervalo: 30s
- [ ] Timeout: 10s
- [ ] Retries: 3
- [ ] Start period: 40s

### Configurar Dependências
- [ ] Adicionar dependência: `redis`
- [ ] Aguardar Redis estar saudável

### Verificar
- [ ] Salvar configurações
- [ ] Aguardar build (pode levar 3-5 min)
- [ ] Verificar bolinha verde 🟢
- [ ] Verificar logs: "Uvicorn running on http://0.0.0.0:8000"

---

## 🔵 FASE 5: App Celery Worker (4 min)

### Criar App
- [ ] Clicar em "Create App"
- [ ] Nome: `celery-worker`
- [ ] Tipo: App

### Configurar Build
- [ ] Source: GitHub
- [ ] Repositório: `rcarraroia/renum-social-media`
- [ ] Branch: `main`
- [ ] Build Context: `/backend`
- [ ] Dockerfile: `backend/Dockerfile`

### Configurar Comando
- [ ] Copiar comando de `EASYPANEL_QUICK_REFERENCE.md`
- [ ] Colar em "Start Command"

### Configurar Rede
- [ ] Sem porta interna
- [ ] Sem domínio

### Configurar Variáveis de Ambiente
- [ ] Copiar variáveis de `EASYPANEL_QUICK_REFERENCE.md`
- [ ] Seção: "API, Worker e Beat (Supabase)"
- [ ] Seção: "API, Worker e Beat (AI Services)"
- [ ] Seção: "API, Worker e Beat (Encryption)"
- [ ] Seção: "API, Worker e Beat (Storage)"
- [ ] Seção: "Todas as Apps (exceto Redis)"
- [ ] **CRÍTICO:** Confirmar `REDIS_HOST=redis`

### Configurar Volume
- [ ] Adicionar volume temporário
- [ ] Mount path: `/tmp/videos`

### Configurar Health Check
- [ ] Comando: `celery -A app.celery_app inspect ping -d celery@$HOSTNAME`
- [ ] Intervalo: 30s
- [ ] Timeout: 10s
- [ ] Retries: 3
- [ ] Start period: 40s

### Configurar Dependências
- [ ] Adicionar dependência: `redis`
- [ ] Aguardar Redis estar saudável

### Verificar
- [ ] Salvar configurações
- [ ] Aguardar build (pode levar 3-5 min)
- [ ] Verificar bolinha verde 🟢
- [ ] Verificar logs: "celery@hostname ready"

---

## 🟡 FASE 6: App Celery Beat (4 min)

### Criar App
- [ ] Clicar em "Create App"
- [ ] Nome: `celery-beat`
- [ ] Tipo: App

### Configurar Build
- [ ] Source: GitHub
- [ ] Repositório: `rcarraroia/renum-social-media`
- [ ] Branch: `main`
- [ ] Build Context: `/backend`
- [ ] Dockerfile: `backend/Dockerfile`

### Configurar Comando
- [ ] Copiar comando de `EASYPANEL_QUICK_REFERENCE.md`
- [ ] Colar em "Start Command"

### Configurar Rede
- [ ] Sem porta interna
- [ ] Sem domínio

### Configurar Variáveis de Ambiente
- [ ] Copiar variáveis de `EASYPANEL_QUICK_REFERENCE.md`
- [ ] Seção: "API, Worker e Beat (Supabase)"
- [ ] Seção: "API, Worker e Beat (Encryption)"
- [ ] Seção: "Todas as Apps (exceto Redis)"
- [ ] **CRÍTICO:** Confirmar `REDIS_HOST=redis`

### Configurar Dependências
- [ ] Adicionar dependência: `redis`
- [ ] Aguardar Redis estar saudável

### Verificar
- [ ] Salvar configurações
- [ ] Aguardar build (pode levar 3-5 min)
- [ ] Verificar bolinha verde 🟢
- [ ] Verificar logs: "Scheduler: Sending due task"

---

## 🧪 FASE 7: Testes de Funcionamento (5 min)

### Teste 1: Status dos Serviços
- [ ] Painel Easypanel mostra 4 bolinhas verdes
- [ ] `redis` - Running 🟢
- [ ] `api` - Running 🟢
- [ ] `celery-worker` - Running 🟢
- [ ] `celery-beat` - Running 🟢

### Teste 2: Health Check da API
- [ ] Abrir navegador
- [ ] Acessar: `https://renum-influency-app.wpjtfd.easypanel.host/health`
- [ ] Resposta JSON com `"status": "healthy"`
- [ ] Status HTTP 200

### Teste 3: SSL/HTTPS
- [ ] Verificar cadeado verde no navegador 🔒
- [ ] Clicar no cadeado
- [ ] Confirmar certificado válido
- [ ] Sem avisos de segurança

### Teste 4: CORS
- [ ] Abrir frontend no Vercel: `https://renum-post.vercel.app`
- [ ] Abrir DevTools (F12)
- [ ] Fazer requisição para API
- [ ] Sem erros de CORS no console

### Teste 5: Logs dos Serviços

#### Redis
- [ ] Abrir logs do `redis`
- [ ] Verificar: "Ready to accept connections"
- [ ] Sem erros

#### API
- [ ] Abrir logs do `api`
- [ ] Verificar: "Uvicorn running on http://0.0.0.0:8000"
- [ ] Verificar: "Application startup complete"
- [ ] Sem erros

#### Celery Worker
- [ ] Abrir logs do `celery-worker`
- [ ] Verificar: "Connected to redis://redis:6379/0"
- [ ] Verificar: "celery@hostname ready"
- [ ] Sem erros

#### Celery Beat
- [ ] Abrir logs do `celery-beat`
- [ ] Verificar: "Scheduler: Sending due task"
- [ ] Sem erros

---

## 🎯 FASE 8: Validação Final (3 min)

### Checklist de Sucesso
- [ ] ✅ 4 Apps criados e rodando
- [ ] ✅ HTTPS funcionando com SSL válido
- [ ] ✅ Health check retorna 200
- [ ] ✅ CORS funcionando no frontend
- [ ] ✅ Redis conectado
- [ ] ✅ Celery Worker processando
- [ ] ✅ Celery Beat agendando
- [ ] ✅ Sem erros nos logs

### Teste de Integração Completo
- [ ] Criar um lead no frontend
- [ ] Verificar que a requisição foi bem-sucedida
- [ ] Verificar logs da API
- [ ] Verificar que não há erros de CORS
- [ ] Verificar que o lead foi salvo no Supabase

---

## 🚨 Troubleshooting

### Se Redis não conecta:
- [ ] Verificar `REDIS_HOST=redis` em todas as Apps
- [ ] Verificar bolinha verde do Redis
- [ ] Verificar logs do Redis
- [ ] Reiniciar Apps dependentes

### Se SSL não funciona:
- [ ] Aguardar 2-5 minutos
- [ ] Verificar domínio configurado na API
- [ ] Force refresh (Ctrl+Shift+R)
- [ ] Verificar logs do Easypanel

### Se CORS está bloqueado:
- [ ] Verificar `ALLOWED_ORIGINS` na API
- [ ] Confirmar domínio exato do Vercel
- [ ] Reiniciar serviço API
- [ ] Verificar logs da API

### Se Celery não processa:
- [ ] Verificar logs do celery-worker
- [ ] Confirmar `REDIS_HOST=redis`
- [ ] Verificar comando de start
- [ ] Reiniciar celery-worker

---

## 📊 Resumo de Tempo

| Fase | Tempo Estimado |
|------|----------------|
| Preparação | 5 min |
| Limpeza | 2 min |
| Redis | 3 min |
| API | 5 min |
| Celery Worker | 4 min |
| Celery Beat | 4 min |
| Testes | 5 min |
| Validação | 3 min |
| **TOTAL** | **31 min** |

---

## ✨ Conclusão

Ao completar todos os itens deste checklist, você terá:

✅ Backend RENUM rodando em 4 Apps independentes  
✅ HTTPS/SSL funcionando automaticamente  
✅ Comunicação interna entre serviços via nome  
✅ CORS configurado corretamente  
✅ Celery processando tarefas assíncronas  
✅ Sistema pronto para produção  

---

**Data de Criação:** 20/02/2026  
**Última Atualização:** 20/02/2026  
**Status:** Pronto para Uso
