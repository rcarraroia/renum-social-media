# Documento de Requisitos - Módulo 1: ScriptAI

## Introdução

O Módulo 1 (ScriptAI) é um sistema de geração inteligente de scripts para vídeos de redes sociais que combina pesquisa web contextualizada via Tavily com geração de conteúdo via Claude AI. O módulo permite que usuários criem scripts otimizados baseados em temas específicos, com suporte a diferentes audiências, tons e durações, além de gerenciar rascunhos e oferecer três jornadas pós-aprovação: teleprompter, geração de vídeo com avatar AI, ou salvamento para uso posterior.

## Glossário

- **Sistema**: O Módulo 1 - ScriptAI completo
- **TavilyService**: Serviço de integração com a API Tavily para pesquisa web
- **ClaudeService**: Serviço de integração com a API Claude para geração de texto
- **Script**: Texto roteirizado para vídeo de rede social
- **Rascunho**: Script salvo com status 'draft' para edição futura
- **Jornada_Pós_Aprovação**: Fluxo de ação após aprovação do script (teleprompter, avatar AI ou salvamento)
- **Organização**: Entidade multi-tenant que agrupa usuários e recursos
- **API_Log**: Registro de chamadas de API para monitoramento e debug
- **Metadados_Script**: Informações contextuais do script (fontes, parâmetros de geração, etc.)

## Requisitos

### Requisito 1: Integração com Tavily API

**User Story:** Como desenvolvedor do sistema, eu quero integrar a API Tavily para pesquisa web, para que o sistema possa obter informações contextualizadas e atualizadas sobre os temas dos scripts.

#### Critérios de Aceitação

1. O Sistema DEVE criar um TavilyService em `app/services/tavily.py`
2. QUANDO o TavilyService é inicializado, O Sistema DEVE usar a API Key configurada em `settings.tavily_api_key` (não hardcoded)
3. O TavilyService DEVE implementar o método `search(query, search_depth, max_results, include_domains, exclude_domains)`
4. QUANDO uma pesquisa é realizada, O TavilyService DEVE retornar resultados contendo título, URL, snippet e score de relevância
5. SE a API Key for inválida, ENTÃO O TavilyService DEVE retornar erro com código 401 e mensagem descritiva
6. SE o rate limit for excedido, ENTÃO O TavilyService DEVE retornar erro com código 429 e mensagem descritiva
7. SE nenhum resultado for encontrado, ENTÃO O TavilyService DEVE retornar lista vazia sem erro
8. O TavilyService DEVE implementar o método `extract(urls)` se disponível na API Tavily
9. QUANDO ocorrer timeout na requisição, O TavilyService DEVE retornar erro com código 'timeout' e mensagem descritiva

### Requisito 2: Geração de Script com Contexto

**User Story:** Como usuário, eu quero gerar scripts inteligentes baseados em um tema, para que eu possa criar conteúdo relevante e contextualizado para minhas redes sociais.

#### Critérios de Aceitação

1. O Sistema DEVE expor o endpoint `POST /api/modules/1/generate-script`
2. QUANDO uma requisição é recebida, O Sistema DEVE validar os campos obrigatórios: `topic`, `audience`, `tone`, `duration`, `language`
3. O campo `audience` DEVE aceitar apenas os valores: 'mlm', 'politics', 'general'
4. O campo `tone` DEVE aceitar apenas os valores: 'informal', 'professional', 'inspirational'
5. O campo `duration` DEVE aceitar apenas os valores: 30, 60, 90 (segundos)
6. O campo `language` DEVE aceitar valores como 'pt-BR', 'en-US', 'es-ES'
7. QUANDO os inputs são válidos, O Sistema DEVE executar pesquisa via TavilyService usando o `topic` como query
8. QUANDO os resultados da pesquisa são obtidos, O Sistema DEVE enviar o contexto para ClaudeService para gerar o script
9. O ClaudeService DEVE expandir o método existente ou criar `generate_script()` que aceita: topic, context, audience, tone, duration, language
10. QUANDO o script é gerado, O Sistema DEVE retornar JSON contendo: `script` (texto), `sources` (lista de URLs), `metadata` (parâmetros usados)
11. SE qualquer validação falhar, ENTÃO O Sistema DEVE retornar erro 400 com mensagem descritiva
12. O Sistema DEVE registrar todas as chamadas em `api_logs` com service='module1', endpoint='/generate-script'

### Requisito 3: Regeneração de Script com Feedback

**User Story:** Como usuário, eu quero regenerar um script com feedback adicional, para que eu possa refinar o conteúdo até atingir o resultado desejado.

#### Critérios de Aceitação

1. O Sistema DEVE expor o endpoint `POST /api/modules/1/regenerate-script`
2. QUANDO uma requisição é recebida, O Sistema DEVE validar os campos obrigatórios: `topic`, `audience`, `tone`, `duration`, `language`, `feedback`
3. O campo `feedback` DEVE ser uma string contendo as instruções do usuário para ajuste
4. QUANDO os inputs são válidos, O Sistema DEVE executar o mesmo fluxo de geração (Tavily + Claude)
5. O ClaudeService DEVE incluir o `feedback` no prompt de geração para ajustar o script
6. QUANDO o script é regenerado, O Sistema DEVE retornar JSON no mesmo formato do endpoint de geração
7. O Sistema DEVE registrar todas as chamadas em `api_logs` com service='module1', endpoint='/regenerate-script'

### Requisito 4: Gestão de Rascunhos

**User Story:** Como usuário, eu quero salvar, listar, visualizar, editar e deletar rascunhos de scripts, para que eu possa gerenciar meu conteúdo em progresso.

#### Critérios de Aceitação

1. O Sistema DEVE expor o endpoint `POST /api/modules/1/scripts/save-draft`
2. QUANDO um rascunho é salvo, O Sistema DEVE criar registro na tabela `videos` com `recording_source='script'` e `status='draft'`
3. O campo `recording_source` DEVE ser adicionado à tabela `videos` como opção válida se não existir
4. QUANDO um rascunho é salvo, O Sistema DEVE armazenar: `title`, `script`, `metadata` (JSON com parâmetros de geração e fontes)
5. O Sistema DEVE expor o endpoint `GET /api/modules/1/scripts/drafts` para listar todos os rascunhos da Organização
6. QUANDO rascunhos são listados, O Sistema DEVE retornar apenas registros com `recording_source='script'` e `status='draft'`
7. O Sistema DEVE expor o endpoint `GET /api/modules/1/scripts/drafts/{draft_id}` para obter detalhes de um rascunho
8. O Sistema DEVE expor o endpoint `PUT /api/modules/1/scripts/drafts/{draft_id}` para atualizar um rascunho
9. QUANDO um rascunho é atualizado, O Sistema DEVE permitir modificação de: `title`, `script`, `metadata`
10. O Sistema DEVE expor o endpoint `DELETE /api/modules/1/scripts/drafts/{draft_id}` para deletar um rascunho
11. QUANDO um rascunho é deletado, O Sistema DEVE remover o registro da tabela `videos`
12. PARA TODOS os endpoints de rascunhos, O Sistema DEVE aplicar RLS garantindo acesso apenas à Organização do usuário autenticado

### Requisito 5: Jornadas Pós-Aprovação

**User Story:** Como usuário, eu quero escolher o que fazer com meu script aprovado (usar teleprompter, gerar vídeo com avatar ou salvar), para que eu possa seguir diferentes fluxos de produção de conteúdo.

#### Critérios de Aceitação

1. QUANDO o usuário escolhe "Teleprompter", O Sistema frontend DEVE redirecionar para a interface de teleprompter sem criar novo endpoint
2. QUANDO o usuário escolhe "Avatar AI", O Sistema DEVE usar o endpoint existente `POST /api/modules/3/generate-video`
3. QUANDO o usuário escolhe "Salvar", O Sistema DEVE usar o endpoint `POST /api/modules/1/scripts/save-draft`
4. O Sistema NÃO DEVE criar novos endpoints para as jornadas de teleprompter e avatar AI
5. O Sistema DEVE documentar as três jornadas no arquivo `backend/docs/MODULE1_SCRIPTAI.md`

### Requisito 6: Logging e Monitoramento

**User Story:** Como administrador do sistema, eu quero que todas as operações do Módulo 1 sejam registradas, para que eu possa monitorar uso, debugar problemas e analisar performance.

#### Critérios de Aceitação

1. PARA TODOS os endpoints do Módulo 1, O Sistema DEVE registrar chamadas na tabela `api_logs`
2. QUANDO um log é criado, O Sistema DEVE incluir: `organization_id`, `module` (="1"), `endpoint`, `status_code`
3. O Sistema DEVE usar o padrão existente de logging dos módulos 2 e 3 (simples: 4 campos)
4. O logging detalhado (request/response bodies, duration_ms) DEVE ser feito via logger Python (`logger.info/error`), não no banco
5. QUANDO ocorrer erro em qualquer operação, O Sistema DEVE registrar o erro completo no logger do servidor
6. O Sistema DEVE calcular o tempo de execução para logging de performance

### Requisito 7: Disponibilidade por Plano

**User Story:** Como usuário de qualquer plano, eu quero acessar o Módulo 1, para que eu possa gerar scripts independentemente do meu nível de assinatura.

#### Critérios de Aceitação

1. O Sistema DEVE permitir acesso ao Módulo 1 para usuários com plano 'free', 'starter' e 'pro'
2. O Sistema NÃO DEVE implementar verificação de plano mínimo para o Módulo 1
3. O Sistema DEVE documentar que o Módulo 1 está disponível para todos os planos

### Requisito 8: Estrutura de Arquivos e Documentação

**User Story:** Como desenvolvedor, eu quero que o código seja organizado e documentado, para que eu possa manter e evoluir o sistema facilmente.

#### Critérios de Aceitação

1. O Sistema DEVE criar o arquivo `app/services/tavily.py` com a classe TavilyService
2. O Sistema DEVE criar o arquivo `app/models/scriptai.py` com modelos Pydantic para validação
3. O Sistema DEVE criar o arquivo `app/api/routes/module1.py` com todos os endpoints do Módulo 1
4. O Sistema DEVE modificar `app/services/claude.py` para adicionar ou expandir métodos de geração de script
5. O Sistema DEVE modificar `app/main.py` para registrar o router do Módulo 1
6. O Sistema DEVE criar o arquivo `backend/docs/MODULE1_SCRIPTAI.md` com documentação completa
7. O Sistema DEVE atualizar `backend/CHANGELOG.md` com entrada para versão v1.3.0 descrevendo o Módulo 1
8. PARA TODOS os arquivos Python, O Sistema DEVE incluir docstrings em português brasileiro
9. PARA TODOS os comentários inline, O Sistema DEVE usar inglês apenas quando necessário para clareza técnica

### Requisito 9: Validação de Schema de Banco de Dados

**User Story:** Como desenvolvedor, eu quero garantir que a tabela `videos` suporte o Módulo 1, para que os dados sejam armazenados corretamente.

#### Critérios de Aceitação

1. O Sistema DEVE verificar se o campo `recording_source` existe na tabela `videos`
2. SE o campo `recording_source` não existir, ENTÃO O Sistema DEVE criar migration para adicionar o campo
3. O campo `recording_source` DEVE aceitar os valores: 'upload', 'heygen', 'script'
4. O Sistema DEVE verificar se os campos `script` e `metadata` existem na tabela `videos`
5. SE os campos não existirem, ENTÃO O Sistema DEVE criar migration para adicioná-los
6. O campo `metadata` DEVE ser do tipo JSONB para armazenar dados estruturados
7. O Sistema DEVE documentar a estrutura esperada do campo `metadata` para scripts

### Requisito 10: Tratamento de Erros e Resiliência

**User Story:** Como usuário, eu quero receber mensagens de erro claras e úteis, para que eu possa entender e resolver problemas rapidamente.

#### Critérios de Aceitação

1. QUANDO a API Tavily retornar erro, O Sistema DEVE mapear o erro para mensagem user-friendly em português
2. QUANDO a API Claude retornar erro, O Sistema DEVE mapear o erro para mensagem user-friendly em português
3. QUANDO ocorrer timeout em qualquer serviço externo, O Sistema DEVE retornar erro 504 com mensagem descritiva
4. QUANDO ocorrer erro de validação, O Sistema DEVE retornar erro 400 com lista de campos inválidos
5. QUANDO ocorrer erro de autenticação, O Sistema DEVE retornar erro 401 com mensagem descritiva
6. QUANDO ocorrer erro de autorização (RLS), O Sistema DEVE retornar erro 403 com mensagem descritiva
7. QUANDO ocorrer erro interno, O Sistema DEVE retornar erro 500 sem expor detalhes técnicos ao usuário
8. PARA TODOS os erros, O Sistema DEVE logar detalhes completos no servidor para debug
