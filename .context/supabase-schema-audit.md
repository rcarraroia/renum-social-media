# 🔍 AUDITORIA SCHEMA SUPABASE

**Data:** 2026-02-13  
**Projeto:** renum-social-media  
**Supabase Project ID:** zbsbfhmsgrlohxdxihaw

## ✅ TABELAS EXISTENTES

- [x] **api_logs** ✅ Completa
- [x] **organizations** ⚠️ Colunas faltando
- [x] **posts** ⚠️ Colunas faltando  
- [x] **users** ✅ Completa
- [x] **videos** ⚠️ Colunas faltando

## ❌ COLUNAS FALTANDO

### Tabela: organizations
**Existentes:** id, name, plan, metricool_user_token, metricool_user_id, metricool_blog_id, heygen_api_key, opusclip_api_key, created_at, updated_at

**Faltando:**
- [ ] `heygen_credits_used INTEGER` - Para controle de créditos HeyGen
- [ ] `heygen_credits_total INTEGER` - Para limite de créditos HeyGen

### Tabela: posts  
**Existentes:** id, organization_id, video_id, platform, description, scheduled_at, metricool_post_id, status, error_message, created_at, updated_at

**Faltando:**
- [ ] `hashtags TEXT[]` - Array de hashtags
- [ ] `published_at TIMESTAMP` - Data de publicação real
- [ ] `views INTEGER DEFAULT 0` - Métricas de visualizações
- [ ] `likes INTEGER DEFAULT 0` - Métricas de curtidas
- [ ] `comments INTEGER DEFAULT 0` - Métricas de comentários
- [ ] `shares INTEGER DEFAULT 0` - Métricas de compartilhamentos
- [ ] `engagement_rate DECIMAL(5,2)` - Taxa de engajamento

**Inconsistências:**
- [ ] `platform` CHECK constraint faltando: 'linkedin', 'x' (apenas tem instagram, tiktok, facebook, youtube)

### Tabela: videos
**Existentes:** id, organization_id, user_id, title, script, video_raw_url, video_processed_url, thumbnail_url, status, module_type, duration_seconds, size_mb, captions, created_at, updated_at

**Faltando:**
- [ ] `metadata JSONB` - Metadados adicionais do vídeo
- [ ] `audience TEXT` - Público-alvo do vídeo

### Tabela: api_logs
**Status:** ✅ **COMPLETA** - Todas as colunas esperadas estão presentes

### Tabela: users  
**Status:** ✅ **COMPLETA** - Todas as colunas esperadas estão presentes

## ✅ ÍNDICES EXISTENTES

**Bem implementados:**
- [x] `idx_api_logs_organization` - api_logs(organization_id)
- [x] `idx_api_logs_service` - api_logs(service)
- [x] `idx_posts_organization` - posts(organization_id)
- [x] `idx_posts_scheduled` - posts(scheduled_at)
- [x] `idx_posts_status` - posts(status)
- [x] `idx_users_email` - users(email)
- [x] `idx_users_organization` - users(organization_id)
- [x] `idx_videos_organization` - videos(organization_id)
- [x] `idx_videos_status` - videos(status)

**Faltando:**
- [ ] `idx_videos_module_type` - videos(module_type) - Para filtrar por tipo de módulo
- [ ] `idx_posts_platform` - posts(platform) - Para filtrar por plataforma
- [ ] `idx_posts_published_at` - posts(published_at) - Para ordenar por data de publicação

## ✅ POLICIES RLS EXISTENTES

**Bem implementadas:**
- [x] **api_logs:** System insert + Users view own org
- [x] **organizations:** System insert + Users view/update own org
- [x] **posts:** Full CRUD for users in their org
- [x] **users:** System insert + Users update own profile + Users view own
- [x] **videos:** Full CRUD for users in their org

**Observação:** ✅ Todas as policies necessárias estão implementadas corretamente

## ✅ CHECK CONSTRAINTS EXISTENTES

**Bem implementadas:**
- [x] `organizations.plan` ∈ ['free', 'starter', 'pro']
- [x] `posts.platform` ∈ ['instagram', 'tiktok', 'facebook', 'youtube'] ⚠️ **Faltando 'linkedin', 'x'**
- [x] `posts.status` ∈ ['scheduled', 'publishing', 'published', 'failed']
- [x] `users.role` ∈ ['owner', 'admin', 'member']
- [x] `videos.module_type` ∈ ['research', 'upload', 'avatar']
- [x] `videos.status` ∈ ['draft', 'processing', 'ready', 'posted', 'failed']

## 📊 SUMMARY

| Categoria | Total | Faltando | Status |
|-----------|-------|----------|---------|
| **Tabelas** | 5 | 0 | ✅ Completo |
| **Colunas** | 45 | 9 | ⚠️ 80% Completo |
| **Índices** | 12 | 3 | ⚠️ 80% Completo |
| **Policies RLS** | 16 | 0 | ✅ Completo |
| **Check Constraints** | 6 | 1 | ⚠️ 83% Completo |

**Prioridade:** 🟡 **MÉDIA** - Sistema funciona, mas faltam recursos de analytics e controle de créditos

## 🚨 IMPACTOS IDENTIFICADOS

### 🔴 **CRÍTICO**
- Nenhum impacto crítico identificado

### 🟡 **MÉDIO**  
- **HeyGen Credits:** Sem controle de créditos (heygen_credits_used/total)
- **Analytics:** Sem métricas de posts (views, likes, comments, shares)
- **Plataformas:** LinkedIn e X não suportados no CHECK constraint

### 🟢 **BAIXO**
- **Metadata:** Campos opcionais para metadados adicionais
- **Índices:** Performance pode ser otimizada

## 🎯 RECOMENDAÇÕES

### **Prioridade 1 (Implementar primeiro):**
1. Adicionar colunas de controle HeyGen credits
2. Corrigir CHECK constraint de platforms (adicionar linkedin, x)
3. Adicionar índices de performance

### **Prioridade 2 (Implementar depois):**
1. Adicionar colunas de analytics (views, likes, etc.)
2. Adicionar campos metadata e audience

### **Prioridade 3 (Opcional):**
1. Otimizações adicionais de índices