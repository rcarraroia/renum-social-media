# 📊 Relatório de Auditoria de APIs - RENUM Backend

**Data:** 20/02/2026  
**Objetivo:** Mapear divergências entre endpoints do backend e chamadas do frontend

---

## 📍 ENDPOINTS DO BACKEND

### Health
- `GET /health` - health_check()
- `GET /health/` - health_check()
- `GET /health/ready` - readiness_check()

### Integrations - HeyGen
- `PUT /integrations/heygen` - configure_heygen()
- `POST /integrations/heygen/test` - test_heygen()
- `GET /integrations/heygen/credits` - get_heygen_credits()
- `GET /integrations/heygen/avatars` - get_heygen_avatars()
- `GET /integrations/heygen/voices` - get_heygen_voices()

### Webhooks
- `POST /webhooks/heygen` - heygen_webhook()

### Tasks (Async)
- `POST /api/tasks/process-video` - start_video_processing()
- `POST /api/tasks/generate-avatar` - start_avatar_generation()
- `GET /api/tasks/status/{task_id}` - get_task_status()
- `DELETE /api/tasks/cancel/{task_id}` - cancel_task()
- `GET /api/tasks/queue/stats` - get_queue_stats()

### Leads
- `POST /api/leads` - create_lead()
- `GET /api/leads/count` - get_leads_count()

### Analytics
- `GET /api/analytics/dashboard` - get_dashboard()
- `GET /api/analytics/posts` - get_posts_performance()
- `GET /api/analytics/best-times` - get_best_times()
- `GET /api/analytics/platforms` - get_platform_breakdown()

### AI Assistant
- `POST /api/assistant/chat` - chat()

### Module 1 - ScriptAI
- `POST /api/modules/1/generate-script` - generate_script()
- `POST /api/modules/1/regenerate-script` - regenerate_script()
- `POST /api/modules/1/scripts/save-draft` - save_draft()
- `GET /api/modules/1/scripts/drafts` - list_drafts()
- `GET /api/modules/1/scripts/drafts/{draft_id}` - get_draft()
- `PUT /api/modules/1/scripts/drafts/{draft_id}` - update_draft()
- `DELETE /api/modules/1/scripts/drafts/{draft_id}` - delete_draft()

### Module 2 - PostRápido
- `POST /api/modules/2/upload` - upload_video()
- `POST /api/modules/2/transcribe` - transcribe_video()
- `POST /api/modules/2/detect-silences` - detect_silences()
- `POST /api/modules/2/process` - process_video()
- `GET /api/modules/2/process/{job_id}/status` - get_process_status()
- `POST /api/modules/2/generate-descriptions` - generate_descriptions()
- `POST /api/modules/2/regenerate-description` - regenerate_description()
- `POST /api/modules/2/schedule` - schedule_posts() [DESABILITADO - 501]

### Module 3 - AvatarAI
- `POST /api/modules/3/generate-video` - generate_video()
- `GET /api/modules/3/generate-video/{job_id}/status` - get_video_status()
- `POST /api/modules/3/send-to-postrapido` - send_to_postrapido()

---

## 🌐 CHAMADAS DO FRONTEND

### Health (api.ts)
- `GET /health` ✅
- `GET /health/ready` ✅

### Integrations - HeyGen (api.ts)
- `POST /api/integrations/heygen/configure` ❌ **DIVERGÊNCIA**
- `POST /api/integrations/heygen/test` ✅
- `GET /api/integrations/heygen/credits` ✅
- `GET /api/integrations/heygen/avatars` ✅
- `GET /api/integrations/heygen/voices` ✅

### Integrations - HeyGen (Onboarding.tsx, HeyGenSetupWizard.tsx)
- `GET /api/integrations/heygen` ❌ **NÃO EXISTE**
- `GET /api/integrations/heygen/status` ❌ **NÃO EXISTE**
- `POST /api/integrations/heygen/test` ✅
- `PUT /api/integrations/heygen` ✅

### Integrations - Metricool (api.ts)
- `POST /api/integrations/metricool/test` ❌ **NÃO EXISTE**
- `GET /api/integrations/metricool/status` ❌ **NÃO EXISTE**

### Integrations - Social Accounts (api.ts, Onboarding.tsx)
- `GET /api/integrations/social-accounts` ❌ **NÃO EXISTE**
- `POST /api/integrations/social-accounts/connect` ❌ **NÃO EXISTE**
- `DELETE /api/integrations/social-accounts/{platform}` ❌ **NÃO EXISTE**

### Analytics (api.ts)
- `GET /api/analytics/dashboard` ✅
- `GET /api/analytics/posts` ✅
- `GET /api/analytics/best-times` ✅
- `GET /api/analytics/platforms` ✅

### AI Assistant (api.ts, AIAssistantProvider.tsx)
- `POST /api/assistant/chat` ✅

### ScriptAI (api.ts)
- `POST /api/scriptai/generate` ❌ **DIVERGÊNCIA**
- `POST /api/scriptai/regenerate` ❌ **DIVERGÊNCIA**
- `POST /api/scriptai/drafts` ❌ **DIVERGÊNCIA**
- `GET /api/scriptai/drafts` ❌ **DIVERGÊNCIA**
- `GET /api/scriptai/drafts/{draft_id}` ❌ **DIVERGÊNCIA**
- `PUT /api/scriptai/drafts/{draft_id}` ❌ **DIVERGÊNCIA**
- `DELETE /api/scriptai/drafts/{draft_id}` ❌ **DIVERGÊNCIA**

### PostRápido (api.ts)
- `POST /api/postrapido/upload` ❌ **DIVERGÊNCIA**
- `POST /api/postrapido/transcribe` ❌ **DIVERGÊNCIA**
- `POST /api/postrapido/detect-silences` ❌ **DIVERGÊNCIA**
- `POST /api/postrapido/process` ❌ **DIVERGÊNCIA**
- `GET /api/postrapido/process/{job_id}/status` ❌ **DIVERGÊNCIA**
- `POST /api/postrapido/descriptions/generate` ❌ **DIVERGÊNCIA**
- `POST /api/postrapido/descriptions/regenerate` ❌ **DIVERGÊNCIA**
- `POST /api/postrapido/schedule` ❌ **DIVERGÊNCIA**

### AvatarAI (api.ts)
- `POST /api/avatarai/generate` ❌ **DIVERGÊNCIA**
- `GET /api/avatarai/videos/{job_id}/status` ❌ **DIVERGÊNCIA**
- `POST /api/avatarai/send-to-postrapido` ❌ **DIVERGÊNCIA**

### Calendar (api.ts)
- `GET /api/calendar/posts` ❌ **NÃO EXISTE**
- `GET /api/calendar/posts/{id}` ❌ **NÃO EXISTE**
- `PUT /api/calendar/posts/{id}/reschedule` ❌ **NÃO EXISTE**
- `PUT /api/calendar/posts/{id}/cancel` ❌ **NÃO EXISTE**

### Dashboard (api.ts)
- `GET /api/dashboard/stats` ❌ **NÃO EXISTE**

---

## ✅ ROTAS QUE BATEM (Frontend ↔ Backend Alinhados)

### Health
- `GET /health` ✅
- `GET /health/ready` ✅

### Integrations - HeyGen
- `PUT /integrations/heygen` ✅
- `POST /integrations/heygen/test` ✅
- `GET /integrations/heygen/credits` ✅
- `GET /integrations/heygen/avatars` ✅
- `GET /integrations/heygen/voices` ✅

### Analytics
- `GET /api/analytics/dashboard` ✅
- `GET /api/analytics/posts` ✅
- `GET /api/analytics/best-times` ✅
- `GET /api/analytics/platforms` ✅

### AI Assistant
- `POST /api/assistant/chat` ✅

### Leads
- `POST /api/leads` ✅ (usado diretamente via Supabase no frontend)
- `GET /api/leads/count` ✅ (usado diretamente via Supabase no frontend)

---

## ❌ ROTAS QUEBRADAS (Frontend chama algo que não existe)

### Integrations - HeyGen
1. `GET /api/integrations/heygen` - Frontend espera obter credenciais salvas
2. `GET /api/integrations/heygen/status` - Frontend espera status de conexão
3. `POST /api/integrations/heygen/configure` - Frontend usa `/configure` mas backend aceita `PUT /integrations/heygen`

### Integrations - Metricool
1. `POST /api/integrations/metricool/test` - Não implementado
2. `GET /api/integrations/metricool/status` - Não implementado

### Integrations - Social Accounts
1. `GET /api/integrations/social-accounts` - Não implementado
2. `POST /api/integrations/social-accounts/connect` - Não implementado
3. `DELETE /api/integrations/social-accounts/{platform}` - Não implementado

### ScriptAI (Divergência de Prefixo)
Frontend usa `/api/scriptai/*` mas backend usa `/api/modules/1/*`:
1. `POST /api/scriptai/generate` → Backend: `/api/modules/1/generate-script`
2. `POST /api/scriptai/regenerate` → Backend: `/api/modules/1/regenerate-script`
3. `POST /api/scriptai/drafts` → Backend: `/api/modules/1/scripts/save-draft`
4. `GET /api/scriptai/drafts` → Backend: `/api/modules/1/scripts/drafts`
5. `GET /api/scriptai/drafts/{id}` → Backend: `/api/modules/1/scripts/drafts/{id}`
6. `PUT /api/scriptai/drafts/{id}` → Backend: `/api/modules/1/scripts/drafts/{id}`
7. `DELETE /api/scriptai/drafts/{id}` → Backend: `/api/modules/1/scripts/drafts/{id}`

### PostRápido (Divergência de Prefixo)
Frontend usa `/api/postrapido/*` mas backend usa `/api/modules/2/*`:
1. `POST /api/postrapido/upload` → Backend: `/api/modules/2/upload`
2. `POST /api/postrapido/transcribe` → Backend: `/api/modules/2/transcribe`
3. `POST /api/postrapido/detect-silences` → Backend: `/api/modules/2/detect-silences`
4. `POST /api/postrapido/process` → Backend: `/api/modules/2/process`
5. `GET /api/postrapido/process/{job_id}/status` → Backend: `/api/modules/2/process/{job_id}/status`
6. `POST /api/postrapido/descriptions/generate` → Backend: `/api/modules/2/generate-descriptions`
7. `POST /api/postrapido/descriptions/regenerate` → Backend: `/api/modules/2/regenerate-description`
8. `POST /api/postrapido/schedule` → Backend: `/api/modules/2/schedule`

### AvatarAI (Divergência de Prefixo)
Frontend usa `/api/avatarai/*` mas backend usa `/api/modules/3/*`:
1. `POST /api/avatarai/generate` → Backend: `/api/modules/3/generate-video`
2. `GET /api/avatarai/videos/{job_id}/status` → Backend: `/api/modules/3/generate-video/{job_id}/status`
3. `POST /api/avatarai/send-to-postrapido` → Backend: `/api/modules/3/send-to-postrapido`

### Calendar
1. `GET /api/calendar/posts` - Não implementado
2. `GET /api/calendar/posts/{id}` - Não implementado
3. `PUT /api/calendar/posts/{id}/reschedule` - Não implementado
4. `PUT /api/calendar/posts/{id}/cancel` - Não implementado

### Dashboard
1. `GET /api/dashboard/stats` - Não implementado

---

## ⚠️ ROTAS ÓRFÃS (Backend tem mas frontend não usa)

### Tasks (Async)
1. `POST /api/tasks/process-video` - Não usado pelo frontend
2. `POST /api/tasks/generate-avatar` - Não usado pelo frontend
3. `GET /api/tasks/status/{task_id}` - Não usado pelo frontend
4. `DELETE /api/tasks/cancel/{task_id}` - Não usado pelo frontend
5. `GET /api/tasks/queue/stats` - Não usado pelo frontend

### Webhooks
1. `POST /webhooks/heygen` - Webhook externo (HeyGen), não chamado pelo frontend

---

## 🔧 RECOMENDAÇÕES DE CORREÇÃO

### Prioridade ALTA (Quebra funcionalidade)

1. **Alinhar prefixos dos módulos:**
   - Opção A: Mudar backend para usar `/api/scriptai`, `/api/postrapido`, `/api/avatarai`
   - Opção B: Mudar frontend para usar `/api/modules/1`, `/api/modules/2`, `/api/modules/3`
   - **Recomendação:** Opção A (mais semântico e user-friendly)

2. **Implementar endpoints faltantes de Integrations:**
   - `GET /api/integrations/heygen` - Retornar credenciais salvas (sem API key)
   - `GET /api/integrations/heygen/status` - Retornar status de conexão
   - `POST /api/integrations/metricool/test` - Testar conexão Metricool
   - `GET /api/integrations/metricool/status` - Status Metricool

3. **Implementar endpoints de Social Accounts:**
   - `GET /api/integrations/social-accounts`
   - `POST /api/integrations/social-accounts/connect`
   - `DELETE /api/integrations/social-accounts/{platform}`

### Prioridade MÉDIA (Funcionalidade planejada)

4. **Implementar endpoints de Calendar:**
   - `GET /api/calendar/posts`
   - `GET /api/calendar/posts/{id}`
   - `PUT /api/calendar/posts/{id}/reschedule`
   - `PUT /api/calendar/posts/{id}/cancel`

5. **Implementar Dashboard Stats:**
   - `GET /api/dashboard/stats`

### Prioridade BAIXA (Otimização)

6. **Documentar rotas órfãs:**
   - Endpoints de `/api/tasks/*` são para uso futuro ou interno?
   - Se não serão usados, considerar remover

7. **Padronizar nomenclatura:**
   - Backend usa `generate-script` mas frontend espera `generate`
   - Backend usa `generate-descriptions` mas frontend espera `descriptions/generate`

---

## 📈 ESTATÍSTICAS

- **Total de endpoints no backend:** 38
- **Total de chamadas no frontend:** 52
- **Rotas que batem:** 13 (25%)
- **Rotas quebradas:** 32 (61.5%)
- **Rotas órfãs:** 6 (11.5%)

---

## 🎯 PRÓXIMOS PASSOS

1. Decidir estratégia de alinhamento de prefixos (Opção A ou B)
2. Implementar endpoints faltantes de alta prioridade
3. Atualizar documentação de API
4. Criar testes de integração para validar alinhamento
5. Implementar versionamento de API para evitar breaking changes futuros

---

**Fim do Relatório**
