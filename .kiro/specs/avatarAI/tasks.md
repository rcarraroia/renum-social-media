# Implementation Plan: AvatarAI Module

## Overview

Este plano implementa o módulo AvatarAI (Módulo 3) seguindo a arquitetura definida no design. A implementação será incremental, começando pelo serviço HeyGen, depois endpoints de configuração, endpoints de geração, e finalmente integração com PostRápido.

Cada tarefa constrói sobre as anteriores, garantindo que o código seja testável e integrável a cada passo.

## Tasks

- [x] 1. Verificar schema do banco de dados e criar migration se necessário
  - Usar Supabase MCP para verificar campos existentes em `organizations` e `videos`
  - Verificar se campos HeyGen já existem: `heygen_api_key`, `heygen_avatar_id`, `heygen_voice_id`, `heygen_credits_used`, `heygen_credits_total`
  - **IMPORTANTE: Se os campos já existem, usar o tipo existente. NÃO alterar tipo de campos que já estão no banco**
  - Verificar se `videos.recording_source` aceita valor 'heygen'
  - Verificar se campos `heygen_video_id`, `heygen_job_status`, `heygen_error_message` existem em `videos`
  - Criar migration `003_add_heygen_fields.sql` APENAS para campos faltantes
  - _Requirements: 1.4, 4.5, 5.4_

- [ ] 2. Criar modelos Pydantic para HeyGen
  - [x] 2.1 Criar arquivo `backend/app/models/heygen.py`
    - Implementar `HeyGenCredentials` com validação de API Key (min 10 chars)
    - Implementar `HeyGenAvatar` com campos obrigatórios
    - Implementar `HeyGenVoice` com campos obrigatórios
    - Implementar `VideoGenerationRequest` com validação de script (1-5000 chars)
    - Implementar `VideoGenerationResponse` com campos de resposta
    - Implementar `VideoStatusResponse` com status enum
    - _Requirements: 4.1_
  
  - [ ]* 2.2 Escrever testes unitários para modelos Pydantic
    - Testar validação de script vazio
    - Testar validação de script > 5000 caracteres
    - Testar validação de API Key muito curta
    - _Requirements: 4.1_

- [x] 3. Implementar HeyGenService
  - [x] 3.0 **DESCOBRIR ENDPOINTS REAIS VIA HEYGEN MCP**
    - **ANTES de implementar qualquer método, usar o HeyGen MCP para descobrir e confirmar:**
      - Base URL da API HeyGen
      - Endpoints reais disponíveis
      - Headers de autenticação corretos
      - Formato exato dos payloads de requisição
      - Campos de resposta retornados pela API
    - **Documentar os endpoints reais descobertos antes de prosseguir**
  
  - [x] 3.1 Criar arquivo `backend/app/services/heygen.py`
    - Implementar classe `HeyGenService` com BASE_URL (usar URL descoberta via MCP)
    - Implementar método `_get_headers(api_key)` para construir headers HTTP
    - Implementar método `_handle_error(response)` para mapear erros HTTP para mensagens user-friendly
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 3.2 Implementar método `test_credentials(api_key)`
    - Fazer requisição GET para `/v1/account` com API Key
    - Retornar dict com `valid`, `account_name`, `credits_remaining`
    - Tratar erros 401, 429, 500, timeout
    - _Requirements: 1.2, 1.5_
  
  - [x] 3.3 Implementar método `get_avatars(api_key)`
    - Fazer requisição GET para `/v2/avatars`
    - Parsear resposta JSON e extrair lista de avatares
    - Retornar lista com `avatar_id`, `avatar_name`, `preview_image_url`, `gender`
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.4 Implementar método `get_voices(api_key, language=None)`
    - Fazer requisição GET para `/v2/voices` com query param opcional
    - Parsear resposta JSON e extrair lista de vozes
    - Retornar lista com `voice_id`, `voice_name`, `language`, `gender`, `preview_audio_url`
    - _Requirements: 2.3, 2.4_
  
  - [x] 3.5 Implementar método `get_credits(api_key)`
    - Fazer requisição GET para `/v1/user/remaining_quota`
    - Parsear resposta e retornar `remaining_credits`, `total_credits`, `credits_used`
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.6 Implementar método `create_video(api_key, script, avatar_id, voice_id, title=None)`
    - Construir payload JSON com estrutura HeyGen (video_inputs, dimension)
    - Fazer requisição POST para `/v2/video/generate`
    - Retornar dict com `video_id` e `status`
    - Tratar erro 402 (créditos insuficientes)
    - _Requirements: 4.3, 4.4, 4.8_
  
  - [x] 3.7 Implementar método `get_video_status(api_key, video_id)`
    - Fazer requisição GET para `/v2/video/{video_id}`
    - Retornar dict com `video_id`, `status`, `video_url` (se completed), `error` (se failed)
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 3.8 Implementar método `download_video(api_key, video_id)`
    - Obter URL de download via `get_video_status`
    - Fazer download do arquivo de vídeo
    - Retornar bytes do vídeo
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 3.9 Escrever testes unitários para HeyGenService
    - Mockar httpx.AsyncClient para simular respostas da API
    - Testar cada método com resposta de sucesso
    - Testar tratamento de erros (401, 402, 429, 500, timeout)
    - _Requirements: 1.2, 2.1, 2.3, 3.1, 4.3, 5.1, 6.1_

- [x] 4. Checkpoint - Validar HeyGenService
  - Executar testes unitários do HeyGenService
  - Verificar que todos os métodos estão implementados
  - Verificar que tratamento de erros está correto
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [-] 5. Implementar endpoints de configuração (integrations.py)
  - [x] 5.1 Criar arquivo `backend/app/api/routes/integrations.py`
    - Importar dependências: FastAPI, HeyGenService, EncryptionService, security
    - Criar router com prefixo `/api/integrations`
    - _Requirements: 1.1_
  
  - [x] 5.2 Implementar endpoint `PUT /api/integrations/heygen`
    - Validar plano Pro usando `require_pro_plan` dependency
    - Receber `HeyGenCredentials` no body
    - Validar credenciais usando `heygen_service.test_credentials()`
    - Criptografar API Key usando `EncryptionService`
    - Salvar credenciais na tabela `organizations`
    - Retornar sucesso com créditos disponíveis
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_
  
  - [x] 5.3 Implementar endpoint `POST /api/integrations/heygen/test`
    - Validar plano Pro
    - Buscar credenciais da organização no banco
    - Descriptografar API Key
    - Testar conexão usando `heygen_service.test_credentials()`
    - Retornar resultado do teste
    - _Requirements: 1.2, 2.1_
  
  - [x] 5.4 Implementar endpoint `GET /api/integrations/heygen/credits`
    - Validar plano Pro
    - Buscar e descriptografar API Key
    - Consultar créditos usando `heygen_service.get_credits()`
    - Atualizar campos `heygen_credits_total` e `heygen_credits_used` no banco
    - Retornar créditos com flag `low_credits_warning` se zero
    - Registrar chamada em `api_logs`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.1, 9.2_
  
  - [x] 5.5 Implementar endpoint `GET /api/integrations/heygen/avatars`
    - Validar plano Pro
    - Buscar e descriptografar API Key
    - Listar avatares usando `heygen_service.get_avatars()`
    - Retornar lista formatada
    - Registrar chamada em `api_logs`
    - _Requirements: 2.1, 2.2, 9.1_
  
  - [x] 5.6 Implementar endpoint `GET /api/integrations/heygen/voices`
    - Validar plano Pro
    - Buscar e descriptografar API Key
    - Receber query param `language` opcional
    - Listar vozes usando `heygen_service.get_voices()`
    - Retornar lista formatada
    - Registrar chamada em `api_logs`
    - _Requirements: 2.3, 2.4, 9.1_
  
  - [ ]* 5.7 Escrever testes unitários para endpoints de configuração
    - Testar PUT /heygen com credenciais válidas
    - Testar PUT /heygen com credenciais inválidas
    - Testar GET /credits com atualização de banco
    - Testar GET /avatars e GET /voices
    - Testar validação de plano Pro (403 para free/starter)
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.3, 3.1, 8.2_
  
  - [ ]* 5.8 Escrever property test para criptografia de API Key
    - **Property 1: API Key Encryption on Storage**
    - **Validates: Requirements 1.3, 1.4**
    - Gerar API Keys aleatórias, salvar, verificar que valor no banco é diferente do original
  
  - [ ]* 5.9 Escrever property test para descriptografia em requisições
    - **Property 3: API Key Decryption for Requests**
    - **Validates: Requirements 2.1**
    - Salvar API Key criptografada, fazer requisição, verificar que header contém valor descriptografado

- [x] 6. Checkpoint - Validar endpoints de configuração
  - Executar testes unitários dos endpoints
  - Testar manualmente fluxo de configuração via Postman/curl
  - Verificar que credenciais são salvas criptografadas no banco
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [ ] 7. Implementar endpoints de geração de vídeo (module3.py)
  - [x] 7.1 Criar arquivo `backend/app/api/routes/module3.py`
    - Importar dependências: FastAPI, HeyGenService, VideoProcessingService, security
    - Criar router com prefixo `/api/modules/3`
    - _Requirements: 4.1_
  
  - [x] 7.2 Implementar endpoint `POST /api/modules/3/generate-video`
    - Validar plano Pro usando `require_pro_plan`
    - Receber `VideoGenerationRequest` no body
    - Validar script (não vazio, máximo 5000 chars)
    - Buscar credenciais HeyGen da organização
    - Verificar se credenciais estão configuradas (erro 400 se não)
    - Usar avatar_id e voice_id do request, ou defaults da organização
    - Verificar se defaults existem (erro 400 se não)
    - **Verificar créditos HeyGen via `heygen_service.get_credits()`. Se insuficientes → erro 402**
    - Criar vídeo usando `heygen_service.create_video()`
    - Salvar registro na tabela `videos` com `recording_source='heygen'`, `heygen_video_id`, `heygen_job_status='processing'`
    - Registrar chamada em `api_logs` com créditos consumidos
    - Retornar `VideoGenerationResponse` com job_id e status
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 8.1, 9.1, 9.3, 11.1, 11.2, 11.3, 11.4_
  
  - [x] 7.3 Implementar endpoint `GET /api/modules/3/generate-video/{jobId}/status`
    - Validar plano Pro
    - Buscar registro de vídeo no banco pelo job_id
    - Retornar erro 404 se não encontrado
    - Buscar credenciais e descriptografar API Key
    - Consultar status usando `heygen_service.get_video_status(heygen_video_id)`
    - Se status for "completed", fazer download e upload para Supabase Storage (bucket `videos-raw`)
    - Atualizar registro no banco com `video_url` e `heygen_job_status='ready'`
    - Retornar `VideoStatusResponse` com status atual
    - Registrar chamada em `api_logs`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 9.1_
  
  - [x] 7.4 Implementar função auxiliar `upload_video_to_storage(video_bytes, org_id, video_id)`
    - Fazer upload para bucket `videos-raw` no Supabase Storage (vídeos ainda não editados)
    - Retornar URL pública do vídeo
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 7.5 Escrever testes unitários para endpoints de geração
    - Testar POST /generate-video com script válido
    - Testar validações de script (vazio, > 5000 chars)
    - Testar erro quando credenciais não configuradas
    - Testar uso de avatar/voice defaults
    - Testar GET /status com vídeo processing, completed, failed
    - Testar erro 404 quando vídeo não encontrado
    - _Requirements: 4.1, 4.2, 4.7, 5.1, 5.6, 11.1, 11.2, 11.4_
  
  - [ ]* 7.6 Escrever property test para validação de script
    - **Property 8: Script Validation**
    - **Validates: Requirements 4.1**
    - Gerar scripts aleatórios (vazios, válidos, > 5000 chars), verificar rejeição correta
  
  - [ ]* 7.7 Escrever property test para defaults de avatar/voice
    - **Property 24: Default Avatar and Voice Handling**
    - **Validates: Requirements 11.1, 11.2, 11.4**
    - Gerar requisições com/sem IDs, verificar que defaults são usados corretamente
  
  - [ ]* 7.8 Escrever property test para criação de registro de vídeo
    - **Property 11: Video Record Creation**
    - **Validates: Requirements 4.4, 4.5**
    - Para qualquer geração bem-sucedida, verificar que registro tem recording_source='heygen'

- [x] 8. Checkpoint - Validar geração de vídeo
  - Executar testes unitários dos endpoints de geração
  - Testar manualmente fluxo completo: configurar → gerar → consultar status
  - Verificar que vídeos são salvos corretamente no Supabase Storage
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [ ] 9. Implementar integração com PostRápido
  - [x] 9.1 Implementar endpoint `POST /api/modules/3/send-to-postrapido`
    - Validar plano Pro
    - Receber `video_id` no body
    - Buscar registro de vídeo no banco
    - Verificar se vídeo tem status "ready" (erro 400 se não)
    - Verificar se usuário tem acesso ao Módulo 2 (erro 403 se não)
    - Criar registro na interface do PostRápido com video_url e metadata
    - Retornar sucesso com redirect_url
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 9.2 Escrever testes unitários para integração PostRápido
    - Testar envio de vídeo pronto
    - Testar erro quando vídeo não está pronto
    - Testar erro quando usuário não tem acesso ao Módulo 2
    - _Requirements: 7.1, 7.4, 7.5_
  
  - [ ]* 9.3 Escrever property test para validação de status
    - **Property 18: PostRápido Transfer Validation**
    - **Validates: Requirements 7.1**
    - Para qualquer vídeo enviado, verificar que status é checado primeiro

- [ ] 10. Implementar logging completo de API
  - [ ] 10.1 Criar função auxiliar `log_heygen_api_call()` em `heygen.py`
    - Receber: organization_id, endpoint, duration, status_code, credits_consumed, error_message
    - Inserir registro em tabela `api_logs` com module="3" e timestamp
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 10.2 Adicionar chamadas de logging em todos os métodos do HeyGenService
    - Logar após cada chamada à API HeyGen (sucesso ou erro)
    - Incluir credits_consumed quando aplicável
    - Incluir error_message quando houver erro
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 10.3 Adicionar logging de tentativas de acesso negadas
    - Logar quando verificação de plano falhar (403)
    - _Requirements: 8.4_
  
  - [ ]* 10.4 Escrever property test para logging completo
    - **Property 22: Comprehensive API Logging**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
    - Para qualquer chamada à API, verificar que log contém todos campos obrigatórios

- [ ] 11. Implementar tratamento de erros user-friendly
  - [ ] 11.1 Criar dicionário `ERROR_MESSAGES` em `heygen.py`
    - Mapear códigos HTTP (401, 402, 429, 500) para mensagens user-friendly
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 11.2 Atualizar método `_handle_error()` para usar mapeamento
    - Retornar mensagem user-friendly baseada no status code
    - Nunca expor detalhes técnicos da API HeyGen
    - _Requirements: 10.6_
  
  - [ ]* 11.3 Escrever testes unitários para mapeamento de erros
    - Testar cada código HTTP (401, 402, 429, 500, timeout)
    - Verificar que mensagens são user-friendly
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 11.4 Escrever property test para sanitização de erros
    - **Property 23: Error Message Sanitization**
    - **Validates: Requirements 10.6**
    - Para qualquer erro, verificar que resposta não contém detalhes técnicos

- [ ] 12. Registrar routers no FastAPI main.py
  - [x] 12.1 Adicionar imports em `backend/app/main.py`
    - Importar `integrations` router
    - Importar `module3` router
  
  - [x] 12.2 Registrar routers na aplicação FastAPI
    - `app.include_router(integrations.router)`
    - `app.include_router(module3.router)`

- [ ] 13. Criar documentação de uso
  - [x] 13.1 Criar arquivo `backend/docs/MODULE3_AVATARIAI.md`
    - Documentar fluxo de configuração de credenciais HeyGen
    - Documentar endpoints disponíveis com exemplos de request/response
    - Documentar mensagens de erro comuns e como resolver
    - Incluir link para documentação do HeyGen
    - _Requirements: 1.1, 4.1_
  
  - [x] 13.2 Atualizar `backend/CHANGELOG.md`
    - Adicionar entrada para Módulo 3 - AvatarAI
    - Listar funcionalidades implementadas
    - Listar endpoints adicionados

- [x] 14. Checkpoint final - Testes de integração end-to-end
  - Executar todos os testes unitários e property tests
  - Testar fluxo completo manualmente:
    1. Configurar credenciais HeyGen
    2. Listar avatares e vozes
    3. Consultar créditos
    4. Gerar vídeo com script
    5. Consultar status até completar
    6. Enviar para PostRápido
  - Verificar logs em `api_logs`
  - Verificar vídeos em Supabase Storage
  - Verificar que erros retornam mensagens user-friendly
  - Perguntar ao usuário se há ajustes finais necessários

## Notes

- Tarefas marcadas com `*` são opcionais (testes) e podem ser puladas para MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude
- Unit tests validam casos específicos e edge cases
- Todas as chamadas HTTP devem ser assíncronas (httpx.AsyncClient)
- API Keys SEMPRE devem ser criptografadas antes de salvar no banco
- Mensagens de erro NUNCA devem expor detalhes técnicos da API HeyGen
- Logs devem ser criados para TODAS as chamadas à API HeyGen
