# 🏗️ Arquitetura RENUM Backend - Easypanel

## 📊 Visão Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                          EASYPANEL PLATFORM                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    INTERNAL NETWORK                           │ │
│  │                                                               │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │                    Redis (App 1)                     │   │ │
│  │  │  Image: redis:7-alpine                               │   │ │
│  │  │  Port: 6379 (internal only)                          │   │ │
│  │  │  Volume: /data (persistent)                          │   │ │
│  │  │  Role: Cache + Rate Limiting + Celery Broker        │   │ │
│  │  └────────────────┬─────────────────────────────────────┘   │ │
│  │                   │                                           │ │
│  │                   │ Internal Communication                    │ │
│  │                   │ (via service name: redis:6379)            │ │
│  │                   │                                           │ │
│  │  ┌────────────────┴──────────┬──────────────┬───────────┐   │ │
│  │  │                           │              │           │   │ │
│  │  ▼                           ▼              ▼           │   │ │
│  │ ┌─────────────┐    ┌──────────────┐   ┌──────────┐    │   │ │
│  │ │  API (App 2)│    │ Celery Worker│   │  Celery  │    │   │ │
│  │ │             │    │   (App 3)    │   │   Beat   │    │   │ │
│  │ │ FastAPI     │    │              │   │ (App 4)  │    │   │ │
│  │ │ Port: 8000  │    │ No external  │   │          │    │   │ │
│  │ │ HTTPS: ✓    │    │ port         │   │ No ext.  │    │   │ │
│  │ │ SSL: Auto   │    │              │   │ port     │    │   │ │
│  │ └──────┬──────┘    └──────────────┘   └──────────┘    │   │ │
│  │        │                                                │   │ │
│  └────────┼────────────────────────────────────────────────┘   │ │
│           │                                                     │ │
│           │ HTTPS with SSL                                      │ │
│           │ (auto-provisioned by Easypanel)                     │ │
│           ▼                                                     │ │
│  renum-influency-app.wpjtfd.easypanel.host                     │ │
│                                                                 │ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTPS
                              │ CORS Enabled
                              │
                              ▼
                    ┌──────────────────┐
                    │  Frontend Vercel │
                    │                  │
                    │  renum-post      │
                    │  .vercel.app     │
                    └──────────────────┘
```

---

## 🔄 Fluxo de Comunicação

### 1. Requisição HTTP do Frontend

```
Frontend (Vercel)
    │
    │ HTTPS Request
    │ GET /api/v1/leads
    │
    ▼
API (Easypanel)
    │
    │ Check Redis Cache
    │
    ▼
Redis (Easypanel)
    │
    │ Cache Hit/Miss
    │
    ▼
API
    │
    │ Query Supabase
    │
    ▼
Supabase (External)
    │
    │ Return Data
    │
    ▼
API
    │
    │ Cache in Redis
    │ Return Response
    │
    ▼
Frontend (Vercel)
```

### 2. Processamento Assíncrono (Celery)

```
API (Easypanel)
    │
    │ Enqueue Task
    │ (e.g., generate video)
    │
    ▼
Redis (Easypanel)
    │
    │ Task Queue
    │
    ▼
Celery Worker (Easypanel)
    │
    │ Process Task
    │ - Call AI APIs
    │ - Generate content
    │ - Update Supabase
    │
    ▼
Supabase (External)
    │
    │ Task Complete
    │
    ▼
Redis (Easypanel)
    │
    │ Update Status
    │
    ▼
API (Easypanel)
    │
    │ Notify Frontend
    │
    ▼
Frontend (Vercel)
```

### 3. Tarefas Agendadas (Celery Beat)

```
Celery Beat (Easypanel)
    │
    │ Schedule Check
    │ (every X minutes)
    │
    ▼
Redis (Easypanel)
    │
    │ Enqueue Scheduled Task
    │
    ▼
Celery Worker (Easypanel)
    │
    │ Execute Task
    │ - Cleanup old data
    │ - Send notifications
    │ - Update metrics
    │
    ▼
Supabase (External)
```

---

## 🔐 Segurança e Isolamento

### Rede Interna (Easypanel)

```
┌─────────────────────────────────────────┐
│         Internal Network                │
│                                         │
│  redis:6379 ←→ api:8000                │
│       ↕                                 │
│  celery-worker                          │
│       ↕                                 │
│  celery-beat                            │
│                                         │
│  Comunicação via nome do serviço        │
│  Sem exposição externa                  │
└─────────────────────────────────────────┘
```

### Exposição Externa

```
┌─────────────────────────────────────────┐
│         Public Internet                 │
│                                         │
│  HTTPS (Port 443)                       │
│       │                                 │
│       ▼                                 │
│  Easypanel Load Balancer                │
│       │                                 │
│       │ SSL Termination                 │
│       │                                 │
│       ▼                                 │
│  api:8000 (internal)                    │
│                                         │
│  Apenas API exposta                     │
│  Redis, Worker, Beat: internos          │
└─────────────────────────────────────────┘
```

---

## 📦 Detalhamento dos Apps

### App 1: Redis

**Função:** Cache, Rate Limiting, Celery Broker

**Características:**
- Imagem oficial Alpine (leve)
- Volume persistente para dados
- Configurado para AOF (Append-Only File)
- Política de memória: LRU (Least Recently Used)
- Limite de memória: 256MB
- Sem senha (rede interna segura)

**Conexões:**
- ← API (cache, rate limiting)
- ← Celery Worker (task queue)
- ← Celery Beat (scheduled tasks)

**Dados Armazenados:**
- Cache de requisições
- Rate limiting counters
- Celery task queue
- Celery results

---

### App 2: API (FastAPI)

**Função:** Backend REST API

**Características:**
- Build do GitHub (Dockerfile)
- Exposto via HTTPS com SSL automático
- CORS configurado para Vercel
- Health check endpoint
- Conecta com Supabase
- Conecta com Redis
- Enfileira tarefas no Celery

**Endpoints Principais:**
- `GET /health` - Health check
- `POST /api/v1/leads` - Criar lead
- `GET /api/v1/leads` - Listar leads
- `POST /api/v1/videos/generate` - Gerar vídeo
- `GET /api/v1/videos/{id}` - Status do vídeo

**Integrações:**
- Supabase (database)
- Redis (cache)
- Anthropic (AI)
- Tavily (web search)
- Deepgram (transcription)
- HeyGen (video generation)

---

### App 3: Celery Worker

**Função:** Processamento Assíncrono

**Características:**
- Build do GitHub (mesmo Dockerfile da API)
- Sem exposição externa
- Concorrência: 2 workers
- Max tasks per child: 100 (evita memory leaks)
- Conecta com Redis para task queue
- Conecta com Supabase para persistência

**Tarefas Processadas:**
- Geração de vídeos
- Processamento de áudio
- Análise de conteúdo
- Envio de notificações
- Limpeza de dados

**Recursos:**
- CPU: Compartilhado
- Memória: Dinâmica
- Volume temporário para vídeos

---

### App 4: Celery Beat

**Função:** Agendador de Tarefas

**Características:**
- Build do GitHub (mesmo Dockerfile da API)
- Sem exposição externa
- Agenda tarefas periódicas
- Conecta com Redis para enfileirar
- Leve (apenas scheduling)

**Tarefas Agendadas:**
- Limpeza de cache (diária)
- Atualização de métricas (horária)
- Verificação de vídeos pendentes (5 min)
- Backup de dados (semanal)

**Recursos:**
- CPU: Mínimo
- Memória: Mínima
- Sem volume necessário

---

## 🔄 Ciclo de Vida dos Apps

### Inicialização

```
1. Redis inicia
   └─ Health check: redis-cli ping
   └─ Status: Ready

2. API aguarda Redis
   └─ Conecta com Redis
   └─ Conecta com Supabase
   └─ Health check: /health
   └─ Status: Ready

3. Celery Worker aguarda Redis
   └─ Conecta com Redis
   └─ Conecta com Supabase
   └─ Health check: celery inspect ping
   └─ Status: Ready

4. Celery Beat aguarda Redis
   └─ Conecta com Redis
   └─ Carrega schedule
   └─ Status: Ready
```

### Restart/Redeploy

```
1. Easypanel detecta mudança no GitHub
   └─ Trigger build para API, Worker, Beat

2. Build completo
   └─ Pull código
   └─ Build Docker image
   └─ Push para registry

3. Deploy rolling
   └─ Mantém instância antiga rodando
   └─ Inicia nova instância
   └─ Health check passa
   └─ Redireciona tráfego
   └─ Remove instância antiga

4. Zero downtime
   └─ Redis permanece rodando
   └─ Conexões mantidas
```

---

## 📊 Monitoramento e Logs

### Logs Disponíveis

```
Redis
├─ Connection logs
├─ Command logs
└─ Persistence logs

API
├─ Request logs
├─ Error logs
├─ Performance logs
└─ Integration logs

Celery Worker
├─ Task execution logs
├─ Error logs
└─ Performance logs

Celery Beat
├─ Schedule logs
└─ Task enqueue logs
```

### Métricas Importantes

```
Redis
├─ Memory usage
├─ Hit rate
├─ Connected clients
└─ Commands/sec

API
├─ Request rate
├─ Response time
├─ Error rate
└─ Active connections

Celery Worker
├─ Tasks processed
├─ Task duration
├─ Error rate
└─ Queue length

Celery Beat
├─ Scheduled tasks
├─ Missed schedules
└─ Execution time
```

---

## 🚀 Escalabilidade

### Escala Horizontal

```
Redis (1 instância)
└─ Suficiente para carga atual
└─ Pode adicionar Redis Cluster se necessário

API (1+ instâncias)
└─ Fácil escalar horizontalmente
└─ Load balancer automático do Easypanel
└─ Stateless (usa Redis para sessões)

Celery Worker (1+ instâncias)
└─ Fácil escalar horizontalmente
└─ Adicionar mais workers conforme demanda
└─ Distribuição automática de tarefas

Celery Beat (1 instância)
└─ Apenas 1 instância necessária
└─ Não escala horizontalmente (scheduler único)
```

### Escala Vertical

```
Redis
└─ Aumentar memória se cache crescer
└─ Aumentar CPU se throughput aumentar

API
└─ Aumentar CPU para mais requisições
└─ Aumentar memória para mais conexões

Celery Worker
└─ Aumentar CPU para tarefas pesadas
└─ Aumentar memória para processamento de vídeo

Celery Beat
└─ Recursos mínimos suficientes
```

---

## 🔒 Segurança

### Camadas de Segurança

```
1. Rede
   ├─ Isolamento interno (Redis, Worker, Beat)
   ├─ Exposição mínima (apenas API)
   └─ SSL/TLS automático

2. Aplicação
   ├─ CORS restrito
   ├─ Rate limiting (Redis)
   ├─ Validação de entrada
   └─ Sanitização de dados

3. Dados
   ├─ Encryption at rest (Supabase)
   ├─ Encryption in transit (HTTPS)
   ├─ Secrets em variáveis de ambiente
   └─ Encryption key para dados sensíveis

4. Autenticação
   ├─ Supabase Auth
   ├─ JWT tokens
   └─ Service role key (backend only)
```

---

## 📈 Performance

### Otimizações Implementadas

```
Redis
├─ Cache de requisições frequentes
├─ Rate limiting eficiente
└─ Persistência otimizada (AOF)

API
├─ Async/await (FastAPI)
├─ Connection pooling (Supabase)
├─ Cache de queries
└─ Compressão de respostas

Celery Worker
├─ Concorrência configurada
├─ Max tasks per child (evita leaks)
├─ Retry automático
└─ Timeout configurado

Celery Beat
├─ Schedule otimizado
└─ Minimal overhead
```

---

## 🎯 Vantagens da Arquitetura

### ✅ Apps Independentes vs Compose

**Vantagens:**
1. **SSL/HTTPS Automático** - Easypanel provisiona SSL para Apps
2. **Escalabilidade Individual** - Escalar cada serviço independentemente
3. **Isolamento de Falhas** - Falha em um App não afeta outros
4. **Deploy Independente** - Atualizar um serviço sem afetar outros
5. **Monitoramento Granular** - Logs e métricas por serviço
6. **Configuração Flexível** - Recursos diferentes por App

**Desvantagens do Compose:**
1. ❌ Sem SSL automático
2. ❌ Escala tudo junto
3. ❌ Deploy atômico (tudo ou nada)
4. ❌ Logs misturados
5. ❌ Configuração única para todos

---

## 📝 Conclusão

Esta arquitetura fornece:

✅ **Alta Disponibilidade** - Health checks e restart automático  
✅ **Segurança** - SSL, isolamento, CORS  
✅ **Performance** - Cache, async, concorrência  
✅ **Escalabilidade** - Horizontal e vertical  
✅ **Manutenibilidade** - Logs, métricas, deploy independente  
✅ **Confiabilidade** - Retry, timeout, error handling  

---

**Data de Criação:** 20/02/2026  
**Última Atualização:** 20/02/2026  
**Status:** Documentação Completa
