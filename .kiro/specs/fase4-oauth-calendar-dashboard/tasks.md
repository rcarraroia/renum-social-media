# Plano de Implementação: Fase 4 - OAuth, Calendar & Dashboard

## Visão Geral

Este plano implementa a integração completa entre frontend e backend do RENUM Social AI, adicionando OAuth de redes sociais, sistema de calendário e dashboard com estatísticas reais. A implementação segue uma abordagem incremental, construindo cada componente de forma isolada e integrando ao final.

**Ordem de Execução**: As tasks devem ser executadas sequencialmente, pois cada uma depende das anteriores.

**Linguagens**: Python (FastAPI) para backend, TypeScript (React) para frontend.

## Tasks

- [x] 1. Descoberta e Documentação do Metricool MCP
  - Conectar ao Metricool MCP (https://ai.metricool.com/mcp)
  - Documentar todos os endpoints disponíveis em `backend/docs/metricool-api-endpoints.md`
  - Incluir: métodos HTTP, parâmetros, respostas, exemplos de uso
  - Confirmar suporte para: agendamento, OAuth, analytics, listagem de brands
  - Resolver questões sobre autenticação (API key vs OAuth)
  - Especificar estrutura de dados de cada endpoint
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implementar MetricoolService Completo
  - [x] 2.1 Criar estrutura base do serviço
    - Criar arquivo `backend/app/services/metricool.py`
    - Implementar classe `MetricoolService` com `__init__`, `base_url`, `httpx.AsyncClient`
    - Adicionar autenticação via `settings.metricool_access_token`
    - Implementar classes de exceção: `MetricoolAPIError`, `MetricoolAuthError`, `MetricoolRateLimitError`, `MetricoolNotFoundError`
    - _Requirements: 2.12, 2.13_
  
  - [x] 2.2 Implementar métodos de gerenciamento de posts
    - Implementar `get_brands()` - retorna lista de brands
    - Implementar `schedule_post()` - agenda post em rede social
    - Implementar `get_scheduled_posts()` - lista posts com filtros
    - Implementar `update_scheduled_post()` - reagenda post
    - Implementar `delete_scheduled_post()` - cancela post
    - Adicionar logging estruturado com `organization_id` em todos os métodos
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.11_
  
  - [ ]* 2.3 Escrever property test para CRUD de posts
    - **Property 1: MetricoolService CRUD de Posts**
    - **Validates: Requirements 2.2, 2.3, 2.5**
  
  - [ ]* 2.4 Escrever property test para reagendamento
    - **Property 2: MetricoolService Reagendamento**
    - **Validates: Requirements 2.4**
  
  - [x] 2.5 Implementar métodos de OAuth e contas conectadas
    - Implementar `get_connected_accounts()` - lista contas conectadas
    - Implementar `initiate_oauth()` - inicia fluxo OAuth, retorna URL
    - Implementar `disconnect_account()` - desconecta conta
    - _Requirements: 2.6, 2.7, 2.8_
  
  - [ ]* 2.6 Escrever property test para OAuth flow
    - **Property 3: MetricoolService OAuth Flow**
    - **Validates: Requirements 2.7**
  
  - [ ]* 2.7 Escrever property test para desconexão
    - **Property 4: MetricoolService Desconexão de Conta**
    - **Validates: Requirements 2.8**
  
  - [x] 2.8 Implementar métodos de analytics
    - Implementar `get_analytics()` - retorna métricas de engajamento
    - Implementar `get_best_times()` - sugere melhores horários
    - _Requirements: 2.9, 2.10_
  
  - [ ]* 2.9 Escrever property test para logging de erros
    - **Property 5: MetricoolService Logging de Erros**
    - **Validates: Requirements 2.11**

- [x] 3. Criar Modelos Pydantic
  - Criar arquivo `backend/app/models/social_accounts.py`
  - Definir enum `SocialPlatform` com 6 valores (instagram, tiktok, linkedin, facebook, x, youtube)
  - Definir modelos: `ConnectRequest`, `PlatformStatus`, `SocialAccountsResponse`
  - Definir modelos: `CalendarQuery`, `CalendarPost`, `CalendarResponse`
  - Definir modelos: `RescheduleRequest`, `DashboardStats`
  - Adicionar validações Pydantic (Field, validators)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [ ]* 3.1 Escrever unit test para enum SocialPlatform
  - Testar que enum contém exatamente 6 plataformas
  - _Requirements: 8.1_

- [ ]* 3.2 Escrever property test para validação Pydantic
  - **Property 15: Validação de Dados Pydantic**
  - **Validates: Requirements 8.10**

- [x] 4. Implementar Endpoints de Social Accounts
  - [x] 4.1 Criar router de Social Accounts
    - Criar arquivo `backend/app/api/routes/social_accounts.py`
    - Implementar `GET /api/integrations/social-accounts` - lista status de todas plataformas
    - Usar `Depends(get_current_organization)` para autenticação
    - Chamar `MetricoolService.get_connected_accounts()`
    - Retornar `SocialAccountsResponse` com status de todas 6 plataformas
    - _Requirements: 3.1, 11.1_
  
  - [ ]* 4.2 Escrever property test para listagem completa
    - **Property 6: Social Accounts Listagem Completa**
    - **Validates: Requirements 3.1**
  
  - [x] 4.3 Implementar endpoint de conexão
    - Implementar `POST /api/integrations/social-accounts/connect`
    - Receber `ConnectRequest` com plataforma
    - Chamar `MetricoolService.initiate_oauth()`
    - Retornar `{ "authorization_url": "..." }`
    - Adicionar error handling para plataforma inválida
    - _Requirements: 3.2_
  
  - [ ]* 4.4 Escrever property test para OAuth flow
    - **Property 3: MetricoolService OAuth Flow** (já coberto em 2.6)
    - **Validates: Requirements 3.2**
  
  - [x] 4.5 Implementar endpoint de desconexão
    - Implementar `DELETE /api/integrations/social-accounts/{platform}`
    - Validar `platform` como `SocialPlatform`
    - Chamar `MetricoolService.disconnect_account()`
    - Retornar mensagem de sucesso
    - _Requirements: 3.4_
  
  - [ ]* 4.6 Escrever property test para desconexão
    - **Property 4: MetricoolService Desconexão de Conta** (já coberto em 2.7)
    - **Validates: Requirements 3.4**
  
  - [ ]* 4.7 Escrever unit tests para error handling
    - Testar erro quando plataforma inválida
    - Testar erro quando Metricool API falha
    - _Requirements: 3.6_

- [x] 5. Implementar Endpoints de Calendar
  - [x] 5.1 Criar router de Calendar
    - Criar arquivo `backend/app/api/routes/calendar.py`
    - Implementar `GET /api/calendar/posts` - lista posts com filtros
    - Usar `CalendarQuery` para query params (start_date, end_date, platform, status)
    - Consultar banco de dados com filtros aplicados
    - Ordenar por `scheduled_at` crescente
    - Retornar `CalendarResponse`
    - _Requirements: 4.1, 4.5_
  
  - [ ]* 5.2 Escrever property test para filtros
    - **Property 7: Filtros de Calendário**
    - **Validates: Requirements 4.1**
  
  - [ ]* 5.3 Escrever property test para ordenação
    - **Property 11: Ordenação de Posts por Data**
    - **Validates: Requirements 4.5**
  
  - [x] 5.4 Implementar endpoint de detalhes de post
    - Implementar `GET /api/calendar/posts/{post_id}`
    - Buscar post no banco de dados
    - Validar que post pertence à organização do usuário
    - Retornar `CalendarPost` completo
    - Retornar 404 se post não existe
    - _Requirements: 4.2_
  
  - [ ]* 5.5 Escrever property test para detalhes completos
    - **Property 8: Detalhes Completos de Post**
    - **Validates: Requirements 4.2**
  
  - [x] 5.6 Implementar endpoint de reagendamento
    - Implementar `PUT /api/calendar/posts/{post_id}/reschedule`
    - Receber `RescheduleRequest` com nova data
    - Validar que data é futura
    - Atualizar no banco de dados
    - Chamar `MetricoolService.update_scheduled_post()`
    - Retornar `CalendarPost` atualizado
    - _Requirements: 4.3_
  
  - [ ]* 5.7 Escrever property test para reagendamento
    - **Property 9: Reagendamento de Post**
    - **Validates: Requirements 4.3**
  
  - [x] 5.8 Implementar endpoint de cancelamento
    - Implementar `PUT /api/calendar/posts/{post_id}/cancel`
    - Atualizar `cancelled_at` no banco de dados
    - Atualizar `status` para "cancelled"
    - Chamar `MetricoolService.delete_scheduled_post()`
    - Retornar mensagem de sucesso
    - _Requirements: 4.4, 4.7_
  
  - [ ]* 5.9 Escrever property test para cancelamento
    - **Property 10: Cancelamento de Post**
    - **Validates: Requirements 4.4**
  
  - [ ]* 5.10 Escrever property test para thumbnail
    - **Property 12: Thumbnail para Posts com Vídeo**
    - **Validates: Requirements 4.6**

- [x] 6. Implementar Endpoint de Dashboard
  - [x] 6.1 Criar router de Dashboard
    - Criar arquivo `backend/app/api/routes/dashboard.py`
    - Implementar `GET /api/dashboard/stats`
    - Consultar banco de dados para `videos_total` (count de videos)
    - Consultar banco de dados para `posts_scheduled_month` (posts com scheduled_at no mês atual)
    - Consultar banco de dados para `posts_published_month` (posts publicados no mês atual)
    - Chamar `MetricoolService.get_analytics()` para `engagement_total`
    - Chamar `MetricoolService.get_connected_accounts()` para `connected_platforms`
    - Retornar `DashboardStats`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 6.2 Escrever property test para estrutura completa
    - **Property 13: Dashboard Stats Estrutura Completa**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [x] 7. Aplicar Migration de Banco de Dados
  - Criar arquivo `backend/migrations/004_fase4_calendar_dashboard.sql`
  - Adicionar coluna `metricool_post_id VARCHAR(255)` na tabela `posts`
  - Adicionar coluna `thumbnail_url TEXT` na tabela `posts`
  - Adicionar coluna `cancelled_at TIMESTAMPTZ` na tabela `posts`
  - Criar índice `idx_posts_org_scheduled` em `(organization_id, scheduled_at)`
  - Criar índice `idx_posts_metricool` em `metricool_post_id` (WHERE NOT NULL)
  - Adicionar comentários nas colunas
  - Testar que migration é idempotente (executar 2x sem erro)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 7.1 Escrever property test para idempotência
  - **Property 16: Migration Idempotente**
  - **Validates: Requirements 9.6**

- [x] 8. Configurar Error Handlers Globais
  - Criar arquivo `backend/app/api/error_handlers.py`
  - Implementar `validation_exception_handler` para erros 422
  - Implementar `metricool_error_handler` para erros 502
  - Implementar `metricool_rate_limit_handler` para erros 429
  - Implementar `generic_exception_handler` para erros 500
  - Registrar handlers no `main.py` com `app.add_exception_handler()`
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ]* 8.1 Escrever property tests para error handling
  - **Property 22: Tradução de Erros do Metricool**
  - **Property 23: Detalhes de Validação em Erros 422**
  - **Property 24: Recurso Não Encontrado Retorna 404**
  - **Property 25: Rate Limit Retorna 429**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [x] 9. Configurar Logging Estruturado
  - Atualizar `backend/app/core/logging.py` (ou criar se não existe)
  - Configurar logger com formato JSON estruturado
  - Adicionar middleware para gerar `request_id` único
  - Adicionar middleware para logar todas requisições com `organization_id`, `module`, `endpoint`, `status_code`
  - Registrar middlewares no `main.py`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 9.1 Escrever property tests para logging
  - **Property 17: Logging Estruturado em Endpoints**
  - **Property 18: Logging de Stack Trace em Erros**
  - **Property 19: Request ID Único em Logs**
  - **Validates: Requirements 10.1, 10.2, 10.5**

- [x] 10. Registrar Routers no Main
  - Abrir `backend/app/main.py`
  - Importar routers: `social_accounts`, `calendar`, `dashboard`
  - Registrar com `app.include_router(social_accounts.router, tags=["Integrations"])`
  - Registrar com `app.include_router(calendar.router, tags=["Calendar"])`
  - Registrar com `app.include_router(dashboard.router, tags=["Dashboard"])`
  - Verificar que todos routers usam prefixo `/api`
  - _Requirements: 14.4_

- [x] 11. Checkpoint Backend - Testar no Swagger
  - Iniciar servidor: `cd backend && uvicorn app.main:app --reload`
  - Acessar `http://localhost:8000/docs`
  - Verificar que todos novos endpoints aparecem no Swagger
  - Testar manualmente cada endpoint (usar token de teste)
  - Confirmar que erros retornam status codes corretos
  - Confirmar que logs estruturados aparecem no console
  - _Requirements: 14.1, 14.5_

- [x] 12. Criar API Client Frontend
  - [x] 12.1 Criar estrutura base do API Client
    - Criar arquivo `frontend/src/lib/api.ts`
    - Criar interface `APIClient` com métodos organizados por módulo
    - Implementar classe `APIClientImpl`
    - Configurar `baseURL` usando `import.meta.env.VITE_API_URL`
    - Implementar método privado `request<T>()` com fetch
    - Adicionar interceptor para incluir `Authorization: Bearer {token}` do Supabase
    - _Requirements: 6.1, 6.2, 6.3, 6.6_
  
  - [ ]* 12.2 Escrever property test para JWT em requisições
    - **Property 14: API Client JWT em Todas Requisições**
    - **Validates: Requirements 6.2**
  
  - [x] 12.3 Implementar error handling no API Client
    - Adicionar tratamento para 401: redirecionar para `/login` e exibir toast
    - Adicionar tratamento para 403: exibir toast com mensagem de erro
    - Adicionar tratamento para 404: exibir toast "Recurso não encontrado"
    - Adicionar tratamento para 422: exibir toast com detalhes de validação
    - Adicionar tratamento para 429: exibir toast "Muitas requisições"
    - Adicionar tratamento para 500+: exibir toast "Erro no servidor"
    - Adicionar tratamento para network errors: exibir toast "Erro de conexão"
    - _Requirements: 6.4, 6.5, 12.5_
  
  - [ ]* 12.4 Escrever unit tests para error handling
    - Testar redirecionamento em 401
    - Testar toast em 403/500
    - _Requirements: 6.4, 6.5_
  
  - [x] 12.5 Implementar métodos do API Client
    - Implementar `api.dashboard.getStats()`
    - Implementar `api.scriptai.*` (7 métodos: generateScript, regenerateScript, saveDraft, listDrafts, getDraft, updateDraft, deleteDraft)
    - Implementar `api.postrapido.*` (8 métodos: upload, transcribe, detectSilences, process, getProcessStatus, generateDescriptions, regenerateDescription, schedule)
    - Implementar `api.avatarai.*` (3 métodos: generateVideo, getVideoStatus, sendToPostRapido)
    - Implementar `api.heygen.*` (5 métodos: configure, test, getCredits, getAvatars, getVoices)
    - Implementar `api.metricool.*` (2 métodos: test, getStatus)
    - Implementar `api.calendar.*` (4 métodos: listPosts, getPost, reschedulePost, cancelPost)
    - Implementar `api.social.*` (3 métodos: listAccounts, connect, disconnect)
    - Implementar `api.health.*` (2 métodos: check, ready)
    - Exportar instância `api` como default
    - Total: 35 métodos mapeando 1:1 com endpoints do Swagger
    - _Requirements: 6.1, 6.7_

- [x] 13. Configurar Variáveis de Ambiente Frontend
  - Criar/atualizar `frontend/.env.local`
  - Adicionar `VITE_API_URL=http://localhost:8000`
  - Atualizar `frontend/.env.example` com documentação
  - Verificar que valor padrão é usado quando variável não está definida
  - _Requirements: 13.2, 13.5_

- [x] 14. Migrar Página Dashboard
  - Abrir `frontend/src/pages/Dashboard.tsx`
  - Remover importações diretas do Supabase client
  - Importar `api` de `@/lib/api`
  - Substituir chamadas Supabase por `api.dashboard.getStats()`
  - Atualizar estado do componente com dados da API
  - Adicionar loading state e error handling
  - Testar que dashboard carrega estatísticas reais
  - _Requirements: 7.1_

- [x] 15. Migrar Página ScriptAI
  - Abrir `frontend/src/pages/ScriptAI.tsx`
  - Remover chamadas diretas ao Supabase
  - Substituir por endpoints do Módulo 1:
    - Gerar script → `api.scriptai.generateScript()`
    - Regenerar → `api.scriptai.regenerateScript()`
    - Salvar rascunho → `api.scriptai.saveDraft()`
    - Listar rascunhos → `api.scriptai.listDrafts()`
    - Obter rascunho → `api.scriptai.getDraft(draftId)`
    - Atualizar rascunho → `api.scriptai.updateDraft(draftId, data)`
    - Deletar rascunho → `api.scriptai.deleteDraft(draftId)`
  - Atualizar handlers de eventos (onSubmit, etc)
  - Adicionar loading states e error handling
  - Testar que geração de scripts funciona via backend
  - _Requirements: 7.2_

- [x] 16. Migrar Página PostRápido
  - Abrir `frontend/src/pages/PostRapido.tsx`
  - Remover upload direto para Supabase Storage
  - Substituir por endpoints do Módulo 2:
    - Upload → `api.postrapido.upload(file, title)`
    - Transcrever → `api.postrapido.transcribe({ videoId, language })`
    - Detectar silêncios → `api.postrapido.detectSilences({ videoId, minSilenceDuration, silenceThreshold })`
    - Processar → `api.postrapido.process({ videoId, subtitles, trim, silenceRemoval })`
    - Status → `api.postrapido.getProcessStatus(jobId)` (polling)
    - Gerar descrições → `api.postrapido.generateDescriptions({ videoId, platforms, tone, includeHashtags })`
    - Regenerar descrição → `api.postrapido.regenerateDescription({ videoId, platform, instructions })`
    - Agendar → `api.postrapido.schedule({ videoId, schedules })`
  - Adicionar progress bar para upload
  - Implementar polling para status de processamento
  - Adicionar loading states e error handling
  - Testar que upload e agendamento funcionam via backend
  - _Requirements: 7.3_

- [x] 17. Migrar Página AvatarAI
  - Abrir `frontend/src/pages/AvatarAI.tsx`
  - Remover chamadas diretas ao Supabase
  - Substituir por endpoints do Módulo 3:
    - Gerar vídeo → `api.avatarai.generateVideo({ script, avatarId, voiceId, title })`
    - Status → `api.avatarai.getVideoStatus(jobId)` (polling)
    - Enviar para PostRápido → `api.avatarai.sendToPostRapido({ video_id })`
  - Implementar polling para status de geração
  - Atualizar handlers de eventos
  - Adicionar loading states e error handling
  - Testar que geração de avatares funciona via backend
  - _Requirements: 7.4_

- [x] 18. Migrar Página Settings (Integrations)
  - Abrir `frontend/src/pages/Settings.tsx`
  - Migrar seção HeyGen:
    - Configurar → `api.heygen.configure({ api_key, avatar_id, voice_id })`
    - Testar → `api.heygen.test()`
    - Créditos → `api.heygen.getCredits()`
    - Avatares → `api.heygen.getAvatars()`
    - Vozes → `api.heygen.getVoices()`
  - Migrar seção Metricool:
    - Testar → `api.metricool.test()`
    - Status → `api.metricool.getStatus()`
  - Adicionar seção "Redes Sociais Conectadas":
    - Listar → `api.social.listAccounts()` no mount
    - Exibir lista de plataformas com status (conectado/desconectado)
    - Conectar → `api.social.connect(platform)` → abrir `authorization_url` em nova janela
    - Implementar polling para atualizar status após OAuth
    - Desconectar → `api.social.disconnect(platform)`
  - Adicionar loading states e error handling
  - IMPORTANTE: Nunca exibir "Metricool" na UI
  - _Requirements: 7.5, 3.5_

- [x] 19. Criar Página Calendar
  - Criar arquivo `frontend/src/pages/Calendar.tsx`
  - Implementar componente de calendário (usar biblioteca como `react-big-calendar` ou custom)
  - Chamar `api.calendar.listPosts()` com filtros de data (mês atual)
  - Exibir posts agendados no calendário
  - Implementar filtros por plataforma e status
  - Implementar modal de detalhes ao clicar em post
  - Implementar ação de reagendar (drag-and-drop ou modal)
  - Implementar ação de cancelar post
  - Adicionar loading states e error handling
  - _Requirements: 7.6_

- [x] 20. Atualizar Navegação
  - Abrir `frontend/src/components/Navigation.tsx` (ou equivalente)
  - Adicionar link para página Calendar
  - Verificar que todas páginas estão acessíveis
  - Testar navegação entre páginas

- [ ] 21. Implementar Property Tests para Autenticação
  - [ ]* 21.1 Escrever property test para JWT inválido
    - **Property 20: JWT Inválido Retorna 401**
    - **Validates: Requirements 11.2, 11.3**
  
  - [ ]* 21.2 Escrever property test para autorização cross-org
    - **Property 21: Autorização Cross-Organization**
    - **Validates: Requirements 11.4**

- [x] 22. Checkpoint Final - Validação End-to-End
  - Iniciar backend: `cd backend && uvicorn app.main:app --reload`
  - Iniciar frontend: `cd frontend && npm run dev`
  - Fazer login no sistema
  - Testar Dashboard: verificar que estatísticas reais aparecem
  - Testar ScriptAI: gerar script e verificar que dados vêm do backend
  - Testar PostRápido: fazer upload de vídeo e agendar post
  - Testar AvatarAI: gerar avatar e verificar que funciona
  - Testar Settings: conectar e desconectar rede social (OAuth flow completo)
  - Testar Calendar: visualizar posts agendados, reagendar e cancelar
  - Verificar que não há erros no console do browser
  - Verificar que não há chamadas diretas ao Supabase (exceto auth)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [x] 23. Documentação Final
  - Atualizar `backend/README.md` com novos endpoints
  - Atualizar `frontend/README.md` com instruções de configuração
  - Documentar variáveis de ambiente necessárias
  - Documentar fluxo OAuth completo
  - Adicionar exemplos de uso da API
  - Documentar estrutura de logs
  - Criar guia de troubleshooting para erros comuns

## Notas Importantes

- **Tasks marcadas com `*` são opcionais** e podem ser puladas para MVP mais rápido
- **Task 1 é bloqueante**: Não criar endpoints Metricool sem descoberta MCP primeiro
- **Metricool Transparente**: Usuário nunca deve ver "Metricool" na UI
- **Autenticação**: Todos endpoints protegidos usam `Depends(get_current_organization)`
- **Logging**: Todos endpoints registram `organization_id`, `module`, `endpoint`, `status_code`
- **Property Tests**: Mínimo 100 iterações, usar `hypothesis` (Python) e `fast-check` (TypeScript)
- **Checkpoints**: Tasks 11 e 22 são pontos de validação - perguntar ao usuário se há dúvidas

## Pré-requisitos

- **Backend**: Python 3.9+, FastAPI, Supabase, httpx, hypothesis (para testes)
- **Frontend**: Node.js 18+, React, TypeScript, Vite, fast-check (para testes)
- **Metricool**: Conta Advanced ($45/mês) com `METRICOOL_ACCESS_TOKEN` configurado
- **Banco de Dados**: PostgreSQL via Supabase com migrations aplicadas

## Critérios de Sucesso

✅ Backend roda sem erros, todos endpoints no Swagger  
✅ Frontend roda sem erros de console  
✅ Login → Dashboard mostra stats reais do backend  
✅ ScriptAI, PostRápido, AvatarAI consomem backend  
✅ Settings conecta/desconecta redes sociais via OAuth  
✅ Calendar mostra posts agendados reais  
✅ Nenhuma chamada direta ao Supabase para operações de negócio (apenas auth)  
✅ Todos property tests passam (25 properties implementadas)  
✅ Migration aplicada com sucesso
