# Plano de Implementação: Módulo 1 - ScriptAI

## Visão Geral

Este plano implementa o Módulo 1 (ScriptAI) seguindo uma abordagem incremental: serviços base → modelos → endpoints → testes → documentação. Cada tarefa é discreta e validável, construindo sobre as anteriores.

## Tarefas

- [x] 1. Preparar infraestrutura e dependências
  - Adicionar dependências ao `requirements.txt`: `httpx`, `hypothesis` (para testes)
  - Verificar se `anthropic` já está instalado (usado pelo ClaudeService)
  - Instalar dependências: `pip install -r requirements.txt`
  - _Requisitos: 8.1, 8.2_

- [x] 2. Criar migration para campo recording_source
  - [x] 2.1 Verificar schema atual da tabela videos
    - Conectar ao Supabase e verificar se campo `recording_source` existe
    - Verificar se campo `metadata` é JSONB
    - _Requisitos: 9.1, 9.4_
  
  - [x] 2.2 Criar migration SQL se necessário
    - Adicionar coluna `recording_source TEXT CHECK (recording_source IN ('upload', 'heygen', 'script'))` se não existir
    - Garantir que `metadata` é JSONB
    - Executar migration no Supabase
    - _Requisitos: 9.2, 9.3, 9.5_

- [x] 3. Descobrir endpoints reais via Tavily MCP
  - **URL do MCP:** https://mcp.tavily.com/mcp/?tavilyApiKey=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
  - Confirmar: Base URL, endpoint de search (POST/GET?), formato exato do payload, formato do response, endpoint de extract (existe?), rate limits
  - Documentar em `backend/docs/tavily-api-endpoints.md`
  - _Requisitos: 1.1, 1.3_

- [x] 3.1 Criar arquivo `app/services/tavily.py`
  - Implementar classe `TavilyService` com constantes (BASE_URL, API_KEY, TIMEOUT, ERROR_MESSAGES)
  - Implementar método `__init__` que inicializa `httpx.AsyncClient`
  - Adicionar docstrings em português brasileiro
  - _Requisitos: 1.1, 1.2, 8.1_
  
  - [x] 3.2 Implementar método `search()`
    - Aceitar parâmetros: query, search_depth, max_results, include_domains, exclude_domains
    - Fazer requisição POST para API Tavily
    - Retornar dict com `results` (lista de {title, url, content, score})
    - Implementar tratamento de erros com `_handle_error()`
    - _Requisitos: 1.3, 1.4, 1.5, 1.6, 1.7, 1.9_
  
  - [x] 3.3 Implementar método `extract()` (opcional)
    - Aceitar lista de URLs
    - Fazer requisição para endpoint de extração se disponível
    - Retornar dict com `extractions`
    - _Requisitos: 1.8_
  
  - [x] 3.4 Implementar método `_handle_error()`
    - Mapear exceções httpx para mensagens user-friendly em português
    - Logar erros detalhados no servidor
    - Retornar dict com estrutura `{"error": {"code": str, "message": str}}`
    - _Requisitos: 10.1, 10.8_
  
  - [ ]* 3.5 Escrever teste de propriedade para TavilyService
    - **Propriedade 20: Resultados Tavily Contêm Campos Obrigatórios**
    - **Valida: Requisitos 1.4**
    - Usar `hypothesis` para gerar queries aleatórias
    - Mockar resposta da API Tavily
    - Verificar que todos os resultados contêm title, url, content, score
  
  - [ ]* 3.6 Escrever testes unitários para edge cases
    - Teste: Tavily sem resultados retorna lista vazia
    - Teste: Erro 401 retorna mensagem user-friendly
    - Teste: Erro 429 retorna mensagem user-friendly
    - Teste: Timeout retorna erro apropriado

- [x] 4. Expandir ClaudeService para geração de scripts
  - [x] 4.1 Adicionar método `generate_script_from_research()` em `app/services/claude.py`
    - Aceitar parâmetros: topic, research_context, audience, tone, duration_seconds, language, feedback (opcional)
    - Construir prompt específico para geração de scripts
    - Chamar API Claude usando método assíncrono existente
    - Retornar dict com: success, script, word_count, estimated_duration, model
    - Adicionar docstrings em português brasileiro
    - _Requisitos: 2.9, 3.5_
  
  - [ ]* 4.2 Escrever teste unitário para geração de script
    - Mockar resposta da API Claude
    - Verificar estrutura de retorno
    - Testar com diferentes combinações de parâmetros

- [x] 5. Checkpoint - Validar serviços base
  - Garantir que TavilyService e ClaudeService estão funcionando
  - Executar testes: `pytest tests/unit/test_tavily.py tests/unit/test_claude.py`
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 6. Criar modelos Pydantic
  - [x] 6.1 Criar arquivo `app/models/scriptai.py`
    - Implementar `GenerateScriptRequest` com validadores para audience, tone, duration
    - Implementar `RegenerateScriptRequest` (herda de GenerateScriptRequest + feedback)
    - Implementar `ScriptResponse`
    - Implementar `SaveDraftRequest`, `UpdateDraftRequest`
    - Implementar `DraftResponse`, `DraftListResponse`
    - Adicionar docstrings em português brasileiro
    - _Requisitos: 2.2, 2.3, 2.4, 2.5, 3.2, 8.2_
  
  - [ ]* 6.2 Escrever testes de propriedade para validação de modelos
    - **Propriedade 1: Validação de Campos Obrigatórios**
    - **Valida: Requisitos 2.2**
    - **Propriedade 2: Validação de Valores Enum**
    - **Valida: Requisitos 2.3, 2.4, 2.5**
    - Usar `hypothesis` para gerar inputs inválidos
    - Verificar que ValidationError é lançado

- [x] 7. Implementar endpoints de geração de script
  - [x] 7.1 Criar arquivo `app/api/routes/module1.py`
    - Importar dependências (FastAPI, serviços, modelos)
    - Criar router: `router = APIRouter()`
    - Configurar logger: `logger = get_logger("module1")`
    - _Requisitos: 8.3_
  
  - [x] 7.2 Implementar endpoint `POST /generate-script`
    - Aceitar `GenerateScriptRequest`
    - Validar inputs (Pydantic faz automaticamente)
    - Chamar `TavilyService.search()` com o topic
    - Chamar `ClaudeService.generate_script_from_research()` com contexto
    - Construir `ScriptResponse` com script, sources, metadata
    - Registrar em `api_logs` usando `supabase.table("api_logs").insert(...)` (padrão dos módulos 2 e 3)
    - Tratar erros e retornar HTTPException apropriado
    - _Requisitos: 2.1, 2.7, 2.8, 2.10, 2.11, 2.12_
  
  - [x] 7.3 Implementar endpoint `POST /regenerate-script`
    - Aceitar `RegenerateScriptRequest`
    - Validar que feedback está presente
    - Executar mesmo fluxo de `/generate-script` incluindo feedback no prompt
    - Retornar `ScriptResponse`
    - Registrar em `api_logs` usando `supabase.table("api_logs").insert(...)` (padrão dos módulos 2 e 3)
    - _Requisitos: 3.1, 3.2, 3.4, 3.6, 3.7_
  
  - [ ]* 7.4 Escrever testes de propriedade para endpoints de geração
    - **Propriedade 3: Estrutura de Resposta de Geração**
    - **Valida: Requisitos 2.10, 3.6**
    - **Propriedade 4: Logging Universal de Endpoints**
    - **Valida: Requisitos 2.12, 3.7, 6.1**
    - Mockar TavilyService e ClaudeService
    - Verificar estrutura de resposta
    - Verificar que log foi criado em api_logs com estrutura simples (organization_id, module, endpoint, status_code)
  
  - [ ]* 7.5 Escrever testes unitários para casos de erro
    - Teste: Campos obrigatórios ausentes retornam 400
    - Teste: Valores enum inválidos retornam 400
    - Teste: Erro Tavily retorna 502
    - Teste: Erro Claude retorna 502
    - Teste: Timeout retorna 504

- [x] 8. Implementar endpoints de gestão de rascunhos
  - [x] 8.1 Implementar endpoint `POST /scripts/save-draft`
    - Aceitar `SaveDraftRequest`
    - Gerar UUID para draft_id
    - Inserir registro em tabela `videos` com:
      - recording_source='script'
      - status='draft'
      - organization_id, user_id (via dependencies)
      - title, script, metadata
    - Retornar `DraftResponse`
    - Registrar em `api_logs`
    - _Requisitos: 4.1, 4.2, 4.4_
  
  - [x] 8.2 Implementar endpoint `GET /scripts/drafts`
    - Consultar tabela `videos` filtrando por:
      - recording_source='script'
      - status='draft'
      - organization_id (RLS aplica automaticamente)
    - Retornar `DraftListResponse` com lista de rascunhos
    - Registrar em `api_logs`
    - _Requisitos: 4.5, 4.6_
  
  - [x] 8.3 Implementar endpoint `GET /scripts/drafts/{draft_id}`
    - Consultar registro específico validando organization_id
    - Retornar `DraftResponse` ou 404 se não encontrado
    - Registrar em `api_logs`
    - _Requisitos: 4.7_
  
  - [x] 8.4 Implementar endpoint `PUT /scripts/drafts/{draft_id}`
    - Aceitar `UpdateDraftRequest`
    - Atualizar campos fornecidos (title, script, metadata)
    - Atualizar campo `updated_at` automaticamente
    - Retornar `DraftResponse` atualizado
    - Registrar em `api_logs`
    - _Requisitos: 4.8, 4.9_
  
  - [x] 8.5 Implementar endpoint `DELETE /scripts/drafts/{draft_id}`
    - Deletar registro da tabela `videos`
    - RLS garante que apenas rascunhos da organização podem ser deletados
    - Retornar 204 No Content
    - Registrar em `api_logs`
    - _Requisitos: 4.10, 4.11_
  
  - [ ]* 8.6 Escrever testes de propriedade para gestão de rascunhos
    - **Propriedade 6: Salvamento de Rascunho com Campos Corretos**
    - **Valida: Requisitos 4.2, 4.4**
    - **Propriedade 7: Listagem Filtra Corretamente**
    - **Valida: Requisitos 4.6**
    - **Propriedade 8: Atualização Persiste Mudanças**
    - **Valida: Requisitos 4.9**
    - **Propriedade 9: Deleção Remove Registro**
    - **Valida: Requisitos 4.11**
    - Usar banco de dados de teste
    - Verificar persistência e isolamento
  
  - [ ]* 8.7 Escrever testes unitários para RLS
    - **Propriedade 10: RLS Isola Organizações**
    - **Valida: Requisitos 4.12**
    - Criar dois usuários de organizações diferentes
    - Verificar que um não acessa rascunhos do outro

- [x] 9. Checkpoint - Validar endpoints completos
  - Garantir que todos os endpoints estão funcionando
  - Executar testes: `pytest tests/unit/test_module1.py`
  - Testar manualmente via Swagger UI (`/docs`)
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 10. Registrar router no main.py
  - [x] 10.1 Modificar `app/main.py`
    - Importar router: `from app.api.routes import module1`
    - Registrar router: `app.include_router(module1.router, prefix="/api/modules/1", tags=["Module 1 - ScriptAI"])`
    - _Requisitos: 8.5_
  
  - [ ]* 10.2 Testar integração completa
    - Iniciar servidor: `uvicorn app.main:app --reload`
    - Acessar `/docs` e testar todos os endpoints
    - Verificar logs em `api_logs`

- [ ] 11. Implementar testes de propriedade para logging
  - [ ]* 11.1 Escrever testes para estrutura de logs
    - **Propriedade 11: Estrutura de Logs Consistente**
    - **Valida: Requisitos 6.2**
    - **Propriedade 12: Logging de Erros no Servidor**
    - **Valida: Requisitos 10.8**
    - Verificar que todos os campos obrigatórios estão presentes (organization_id, module, endpoint, status_code)
    - Verificar que erros têm detalhes no logger Python (não no banco)

- [ ] 12. Implementar testes de propriedade para tratamento de erros
  - [ ]* 12.1 Escrever testes para mapeamento de erros
    - **Propriedade 16: Mapeamento de Erros de APIs Externas**
    - **Valida: Requisitos 10.1, 10.2**
    - **Propriedade 17: Erros de Validação Incluem Detalhes**
    - **Valida: Requisitos 10.4**
    - **Propriedade 18: Erros 500 Não Expõem Detalhes Técnicos**
    - **Valida: Requisitos 10.7**
    - **Propriedade 12: Logging de Erros no Servidor**
    - **Valida: Requisitos 10.8**
    - Mockar erros de APIs externas
    - Verificar mensagens em português
    - Verificar que detalhes técnicos não são expostos
    - Verificar que erros são logados no logger Python

- [ ] 13. Implementar teste de propriedade para acesso sem restrição de plano
  - [ ]* 13.1 Escrever teste para disponibilidade universal
    - **Propriedade 15: Acesso Sem Restrição de Plano**
    - **Valida: Requisitos 7.1**
    - Criar usuários com planos 'free', 'starter', 'pro'
    - Verificar que todos conseguem acessar endpoints do Módulo 1
    - Verificar que nenhum retorna 403 por restrição de plano

- [-] 14. Criar documentação técnica
  - [x] 14.1 Criar arquivo `backend/docs/MODULE1_SCRIPTAI.md`
    - Documentar visão geral do módulo
    - Documentar todos os endpoints com exemplos de request/response
    - Documentar estrutura de metadata para scripts
    - Documentar as três jornadas pós-aprovação (teleprompter, avatar AI, salvar)
    - Documentar códigos de erro e suas causas
    - Incluir exemplos de uso via cURL e Python
    - _Requisitos: 5.5, 8.6_
  
  - [x] 14.2 Atualizar `backend/CHANGELOG.md`
    - Adicionar entrada para versão v1.3.0
    - Listar todas as funcionalidades do Módulo 1
    - Mencionar breaking changes (se houver)
    - _Requisitos: 8.7_
  
  - [x] 14.3 Atualizar README principal (se necessário)
    - Adicionar seção sobre Módulo 1 - ScriptAI
    - Atualizar diagrama de arquitetura se houver

- [x] 15. Checkpoint final - Validação completa
  - Executar todos os testes: `pytest --cov=app --cov-report=term-missing`
  - Verificar cobertura de código (meta: 80%)
  - Testar fluxo completo end-to-end:
    1. Gerar script via `/generate-script`
    2. Regenerar com feedback via `/regenerate-script`
    3. Salvar como rascunho via `/save-draft`
    4. Listar rascunhos via `/drafts`
    5. Atualizar rascunho via `PUT /drafts/:id`
    6. Deletar rascunho via `DELETE /drafts/:id`
  - Verificar logs em `api_logs` para todas as operações
  - Perguntar ao usuário se está tudo funcionando conforme esperado

## Notas

- Tarefas marcadas com `*` são opcionais (testes) e podem ser puladas para MVP mais rápido
- Cada tarefa referencia os requisitos específicos que implementa
- Checkpoints garantem validação incremental
- Testes de propriedade usam `hypothesis` com mínimo 100 iterações
- Todos os testes devem referenciar a propriedade do design com comentário
- Documentação e comentários em português brasileiro
- Código (variáveis, funções) em inglês seguindo padrões Python/FastAPI
