# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.3.0] - 2026-02-15

### Adicionado - Módulo 1 (ScriptAI)

#### Endpoints
- `POST /api/modules/1/generate-script` - Geração de script inteligente com pesquisa web
- `POST /api/modules/1/regenerate-script` - Regeneração de script com feedback
- `POST /api/modules/1/scripts/save-draft` - Salvar script como rascunho
- `GET /api/modules/1/scripts/drafts` - Listar rascunhos da organização
- `GET /api/modules/1/scripts/drafts/{draft_id}` - Obter detalhes de um rascunho
- `PUT /api/modules/1/scripts/drafts/{draft_id}` - Atualizar rascunho
- `DELETE /api/modules/1/scripts/drafts/{draft_id}` - Deletar rascunho

#### Serviços
- **TavilyService**: Integração completa com API Tavily
  - `search()` - Pesquisa web contextualizada
  - `extract()` - Extração de conteúdo de URLs
  - `_handle_error()` - Mapeamento de erros para mensagens user-friendly

- **ClaudeService**: Expansão com geração de scripts
  - `generate_script_from_research()` - Geração de script baseada em pesquisa

#### Schemas Pydantic
- `GenerateScriptRequest` - Request de geração com validação de audience, tone, duration
- `RegenerateScriptRequest` - Request de regeneração com feedback
- `ScriptResponse` - Response de geração com script, sources, metadata
- `SaveDraftRequest` - Request para salvar rascunho
- `UpdateDraftRequest` - Request para atualizar rascunho
- `DraftResponse` - Response de rascunho
- `DraftListResponse` - Response de listagem de rascunhos

#### Funcionalidades
- Pesquisa web contextualizada via Tavily API
- Geração de scripts via Claude AI com múltiplos parâmetros
- Suporte a 3 públicos: mlm, politics, general
- Suporte a 3 tons: informal, professional, inspirational
- Suporte a 3 durações: 30s, 60s, 90s
- Sistema completo de CRUD para rascunhos
- 3 jornadas pós-aprovação: teleprompter, avatar AI, salvar
- Logging simples em api_logs (organization_id, module, endpoint, status_code)
- Tratamento de erros user-friendly (nunca expõe detalhes técnicos)
- Disponível para todos os planos (Free, Starter, Pro)

#### Database
- Valor `script` adicionado ao enum `recording_source` na tabela `videos`
- Campo `script` (TEXT) adicionado à tabela `videos`
- Campo `metadata` (JSONB) adicionado à tabela `videos`

#### Documentação
- `backend/docs/MODULE1_SCRIPTAI.md` - Documentação completa do módulo
- `backend/docs/tavily-api-endpoints.md` - Documentação dos endpoints Tavily
- `backend/CHANGELOG.md` - Este arquivo

#### Segurança
- API Key Tavily gerenciada via configuração (não hardcoded)
- Validação de organização em todos os endpoints
- Validação de inputs com Pydantic
- Logging de todas as operações
- Nunca expor detalhes técnicos da API Tavily/Claude ao usuário

### Modificado

#### Arquivos Atualizados
- `backend/app/main.py` - Registro de rotas do Módulo 1
- `backend/app/services/tavily.py` - Novo arquivo
- `backend/app/services/claude.py` - Método generate_script_from_research adicionado
- `backend/app/models/scriptai.py` - Novo arquivo
- `backend/app/api/routes/module1.py` - Novo arquivo
- `backend/requirements.txt` - Dependências httpx e hypothesis adicionadas
- `backend/migrations/002_phase_3_scriptai_schema.sql` - Nova migration
- `backend/CHANGELOG.md` - Este arquivo

## [1.2.0] - 2026-02-14

### Adicionado - Módulo 3 (AvatarAI)

#### Endpoints de Configuração
- `PUT /api/integrations/heygen` - Configuração de credenciais HeyGen (API Key, Avatar ID, Voice ID)
- `POST /api/integrations/heygen/test` - Teste de conexão com HeyGen
- `GET /api/integrations/heygen/credits` - Consulta de créditos HeyGen disponíveis
- `GET /api/integrations/heygen/avatars` - Listagem de avatares disponíveis
- `GET /api/integrations/heygen/voices` - Listagem de vozes disponíveis (com filtro de idioma)

#### Endpoints de Geração
- `POST /api/modules/3/generate-video` - Geração de vídeo com avatar digital
- `GET /api/modules/3/generate-video/{jobId}/status` - Consulta de status de geração
- `POST /api/modules/3/send-to-postrapido` - Envio de vídeo para PostRápido

#### Serviços
- **HeyGenService**: Integração completa com API HeyGen
  - `test_credentials()` - Validação de API Key
  - `get_avatars()` - Listagem de avatares
  - `get_voices()` - Listagem de vozes com filtro de idioma
  - `get_credits()` - Consulta de créditos
  - `create_video()` - Criação de job de geração
  - `get_video_status()` - Consulta de status
  - `download_video()` - Download de vídeo gerado
  - `_get_headers()` - Construção de headers HTTP
  - `_handle_error()` - Mapeamento de erros para mensagens user-friendly

#### Schemas Pydantic
- `HeyGenCredentials` - Credenciais HeyGen com validação
- `HeyGenAvatar` - Modelo de avatar
- `HeyGenVoice` - Modelo de voz
- `VideoGenerationRequest` - Request de geração com validação de script (1-5000 chars)
- `VideoGenerationResponse` - Response de geração
- `VideoStatusResponse` - Response de status

#### Funcionalidades
- Modelo self-service: cada organização gerencia suas próprias credenciais e créditos HeyGen
- Validação de credenciais antes de salvar
- Criptografia de API Keys usando EncryptionService
- Uso de avatar e voz padrão quando não especificados
- Verificação de créditos antes de gerar vídeo
- Geração assíncrona de vídeos com sistema de jobs
- Download automático e upload para Supabase Storage (bucket `videos-raw`)
- Integração com PostRápido (Módulo 2)
- Logging completo de todas chamadas à API HeyGen
- Tratamento de erros user-friendly (nunca expõe detalhes técnicos)
- Validação de plano Pro para todos os endpoints

#### Database
- Campos adicionados em `organizations`:
  - `heygen_api_key` - API Key criptografada
  - `heygen_avatar_id` - Avatar ID padrão
  - `heygen_voice_id` - Voice ID padrão
  - `heygen_credits_used` - Créditos consumidos
  - `heygen_credits_total` - Total de créditos
- Campos adicionados em `videos`:
  - `heygen_video_id` - ID do vídeo no HeyGen
  - `heygen_job_status` - Status do job (processing, ready, failed)
  - `heygen_error_message` - Mensagem de erro se falhar
- Valor `heygen` adicionado ao enum `recording_source`

#### Documentação
- `backend/docs/MODULE3_AVATARIAI.md` - Documentação completa do módulo
- Exemplos de uso com curl
- Tabela de mensagens de erro comuns
- Boas práticas e limitações

#### Segurança
- Criptografia obrigatória de API Keys antes de salvar
- Descriptografia apenas no momento de uso
- Validação de plano Pro em todos os endpoints
- Logging de tentativas de acesso negadas
- Nunca expor detalhes técnicos da API HeyGen ao usuário
- Validação de organização em todas as operações

### Modificado

#### Arquivos Atualizados
- `backend/app/main.py` - Registro de rotas do Módulo 3
- `backend/app/api/routes/integrations.py` - Endpoints HeyGen adicionados
- `backend/CHANGELOG.md` - Este arquivo

## [1.1.0] - 2026-02-14

### Adicionado - Fase 1: Módulo 2 (PostRápido)

#### Endpoints
- `POST /api/modules/2/upload` - Upload de vídeo com validação de formato e tamanho
- `POST /api/modules/2/transcribe` - Transcrição automática via Deepgram/Whisper
- `POST /api/modules/2/detect-silences` - Detecção de silêncios no áudio
- `POST /api/modules/2/process` - Processamento assíncrono de vídeo
- `GET /api/modules/2/process/{jobId}/status` - Polling de status de processamento
- `POST /api/modules/2/generate-descriptions` - Geração de descrições por plataforma
- `POST /api/modules/2/regenerate-description` - Regeneração de descrição customizada
- `POST /api/modules/2/schedule` - Agendamento de posts via Metricool

#### Serviços
- **VideoProcessingService**: Métodos adicionados
  - `extract_metadata()` - Extração de metadados
  - `detect_silences()` - Detecção de silêncios
  - `process_video()` - Processamento completo
  - `_remove_silences()` - Remoção de silêncios

- **TranscriptionService**: Métodos adicionados
  - `transcribe_video()` - Transcrição completa com waveform
  - `_generate_waveform()` - Geração de waveform

- **ClaudeService**: Métodos adicionados
  - `generate_descriptions()` - Geração multi-plataforma
  - `regenerate_description()` - Regeneração customizada
  - `_build_description_prompt()` - Construção de prompts
  - `_extract_hashtags()` - Extração de hashtags

- **MetricoolService**: Reescrito completo
  - `_run_mcp_tool()` - Execução de ferramentas MCP
  - `get_brands()` - Listagem de marcas
  - `get_connected_accounts()` - Verificação de contas
  - `schedule_post()` - Agendamento com configurações por plataforma
  - `get_scheduled_posts()` - Listagem de posts agendados
  - `test_connection()` - Teste de conexão

#### Schemas Pydantic
- `VideoUploadResponse`
- `TranscriptionRequest`, `TranscriptionResponse`, `TranscriptionSegment`
- `SilenceDetectionRequest`, `SilenceDetectionResponse`, `SilenceItem`
- `VideoProcessRequest`, `VideoProcessResponse`, `VideoProcessStatus`
- `SubtitleConfig`, `SubtitleStyle`, `TrimConfig`, `SilenceRemovalConfig`
- `DescriptionGenerateRequest`, `DescriptionGenerateResponse`, `PlatformDescription`
- `DescriptionRegenerateRequest`
- `ScheduleRequest`, `ScheduleResponse`, `ScheduleItem`, `ScheduledPost`

#### Documentação
- `backend/docs/FASE_1_COMPLETED.md` - Documentação completa da Fase 1
- `backend/docs/MODULE2_QUICKSTART.md` - Guia rápido de uso
- `backend/CHANGELOG.md` - Este arquivo

#### Funcionalidades
- Upload de vídeo para Supabase Storage
- Validação de tamanho por plano (Free: 100MB, Starter: 500MB, Pro: 2GB)
- Transcrição automática com timestamps word-level
- Geração de waveform para visualização
- Detecção inteligente de silêncios
- Processamento assíncrono com sistema de jobs
- Aplicação de legendas com estilos customizáveis
- Corte de vídeo (trim)
- Remoção de silêncios
- Geração de descrições otimizadas por plataforma via Claude
- Respeito aos limites de caracteres por plataforma
- Geração automática de hashtags
- Agendamento multi-plataforma via Metricool
- Logging completo de todas as operações

### Modificado

#### Arquivos Atualizados
- `backend/app/main.py` - Registro de rotas do Módulo 2
- `backend/app/models/schemas.py` - Schemas expandidos
- `backend/app/services/claude.py` - Métodos de geração de descrições
- `backend/app/services/video_processing.py` - Métodos de processamento
- `backend/app/services/transcription.py` - Método transcribe_video
- `backend/app/services/metricool.py` - Reescrito completo

### Segurança
- Validação de autenticação em todos os endpoints
- Validação de organização
- Validação de formatos de arquivo
- Validação de tamanhos por plano
- Sanitização de inputs
- Logging de todas as operações

## [1.0.0] - 2026-02-10

### Adicionado - Fase 0: Setup Inicial

#### Infraestrutura
- Configuração do projeto FastAPI
- Integração com Supabase
- Sistema de autenticação JWT
- Middleware de CORS
- Sistema de logging
- Serviço de encriptação

#### Serviços Base
- `VideoProcessingService` - Processamento básico de vídeo
- `TranscriptionService` - Transcrição via Deepgram/Whisper
- `ClaudeService` - Integração com Anthropic Claude
- `MetricoolService` - Placeholder para Metricool
- `SupabaseService` - Helpers para Supabase

#### Endpoints Base
- `GET /health` - Health check
- `POST /integrations/metricool/connect` - Conexão Metricool
- `GET /integrations/metricool/status` - Status Metricool

#### Database
- Schema inicial do Supabase
- Tabelas: users, organizations, videos, posts, api_logs
- RLS policies configuradas
- Storage buckets criados

#### Documentação
- `backend/docs/FASE_0_SETUP.md` - Setup inicial
- `backend/docs/FASE_0_COMPLETED.md` - Fase 0 completa
- `backend/README.md` - README do backend

---

## Tipos de Mudanças

- `Adicionado` para novas funcionalidades
- `Modificado` para mudanças em funcionalidades existentes
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades corrigidas

## Versionamento

- **MAJOR** (X.0.0): Mudanças incompatíveis com versões anteriores
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis
