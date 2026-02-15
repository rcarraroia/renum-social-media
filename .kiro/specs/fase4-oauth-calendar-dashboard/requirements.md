# Requirements Document - Fase 4: OAuth, Calendar & Dashboard

## Introdução

A Fase 4 do RENUM Social AI implementa a integração completa entre frontend e backend, adicionando funcionalidades críticas de OAuth para redes sociais, sistema de calendário para posts agendados, dashboard com estatísticas reais, e eliminação de chamadas diretas ao Supabase no frontend. Esta fase utiliza o Metricool como provedor de serviços de agendamento e analytics, mantendo-o transparente para o usuário final.

## Glossário

- **RENUM_Backend**: Sistema backend FastAPI que processa requisições do frontend
- **RENUM_Frontend**: Aplicação React/TypeScript (Dyad) que fornece interface ao usuário
- **Metricool_Service**: Serviço interno que integra com API do Metricool
- **Metricool_MCP**: Model Context Protocol do Metricool (https://ai.metricool.com/mcp)
- **Social_Platform**: Rede social suportada (Instagram, TikTok, LinkedIn, Facebook, X, YouTube)
- **OAuth_Flow**: Fluxo de autenticação OAuth 2.0 para conectar redes sociais
- **Calendar_System**: Sistema de visualização e gerenciamento de posts agendados
- **Dashboard_Stats**: Estatísticas agregadas exibidas no painel principal
- **API_Client**: Cliente TypeScript que centraliza chamadas HTTP ao backend
- **Organization**: Entidade que representa conta de usuário no sistema
- **Scheduled_Post**: Post agendado para publicação futura em rede social
- **Connected_Account**: Conta de rede social conectada via OAuth
- **Supabase_JWT**: Token de autenticação gerado pelo Supabase Auth

## Requisitos

### Requisito 1: Descoberta da API Metricool

**User Story:** Como desenvolvedor, eu quero documentar todos os endpoints disponíveis no Metricool MCP, para que eu possa implementar integrações corretas com a API real.

#### Acceptance Criteria

1. WHEN o desenvolvedor acessa o Metricool MCP THEN o RENUM_Backend SHALL documentar todos os endpoints disponíveis em backend/docs/metricool-api-endpoints.md
2. THE documentação SHALL incluir métodos HTTP, parâmetros, respostas esperadas e exemplos de uso para cada endpoint
3. THE documentação SHALL confirmar suporte para agendamento de posts, OAuth de redes sociais, analytics e listagem de brands
4. THE documentação SHALL resolver questões críticas sobre modelo de autenticação (API key vs OAuth)
5. THE documentação SHALL especificar estrutura de dados retornada por cada endpoint

### Requisito 2: Serviço Metricool Completo

**User Story:** Como sistema backend, eu quero um serviço completo para integração com Metricool, para que eu possa abstrair toda comunicação com a API externa.

#### Acceptance Criteria

1. THE Metricool_Service SHALL implementar método get_brands() que retorna lista de brands disponíveis
2. THE Metricool_Service SHALL implementar método schedule_post() que agenda publicação em rede social
3. THE Metricool_Service SHALL implementar método get_scheduled_posts() que lista posts agendados com filtros opcionais
4. THE Metricool_Service SHALL implementar método update_scheduled_post() que reagenda post existente
5. THE Metricool_Service SHALL implementar método delete_scheduled_post() que cancela post agendado
6. THE Metricool_Service SHALL implementar método get_connected_accounts() que lista contas conectadas
7. THE Metricool_Service SHALL implementar método initiate_oauth() que inicia fluxo OAuth para conectar rede social
8. THE Metricool_Service SHALL implementar método disconnect_account() que desconecta conta de rede social
9. THE Metricool_Service SHALL implementar método get_analytics() que retorna métricas de engajamento
10. THE Metricool_Service SHALL implementar método get_best_times() que sugere melhores horários para publicação
11. WHEN qualquer método falha THEN o Metricool_Service SHALL registrar erro com logging estruturado incluindo organization_id
12. THE Metricool_Service SHALL usar httpx.AsyncClient para todas requisições HTTP
13. THE Metricool_Service SHALL autenticar usando settings.metricool_access_token

### Requisito 3: OAuth de Redes Sociais

**User Story:** Como usuário, eu quero conectar minhas contas de redes sociais, para que eu possa agendar publicações automaticamente.

#### Acceptance Criteria

1. WHEN usuário solicita listagem de contas THEN o RENUM_Backend SHALL retornar status de conexão para cada Social_Platform suportada
2. WHEN usuário inicia conexão de rede social THEN o RENUM_Backend SHALL iniciar OAuth_Flow e retornar URL de autorização
3. WHEN usuário completa OAuth_Flow THEN o RENUM_Backend SHALL armazenar credenciais e marcar plataforma como conectada
4. WHEN usuário solicita desconexão THEN o RENUM_Backend SHALL revogar acesso e marcar plataforma como desconectada
5. THE RENUM_Frontend SHALL nunca exibir referência a "Metricool" na interface do usuário
6. WHEN erro ocorre durante OAuth_Flow THEN o RENUM_Backend SHALL retornar mensagem de erro descritiva
7. THE RENUM_Backend SHALL validar Supabase_JWT em todas requisições de integração social

### Requisito 4: Sistema de Calendário

**User Story:** Como usuário, eu quero visualizar e gerenciar meus posts agendados em um calendário, para que eu possa organizar minha estratégia de conteúdo.

#### Acceptance Criteria

1. WHEN usuário solicita posts agendados THEN o Calendar_System SHALL retornar lista filtrada por data, plataforma e status
2. WHEN usuário solicita detalhes de post THEN o Calendar_System SHALL retornar informações completas incluindo conteúdo, mídia e horário
3. WHEN usuário reagenda post THEN o Calendar_System SHALL atualizar data/hora e sincronizar com Metricool_Service
4. WHEN usuário cancela post THEN o Calendar_System SHALL marcar como cancelado e remover do Metricool_Service
5. THE Calendar_System SHALL retornar posts ordenados por data de publicação
6. THE Calendar_System SHALL incluir thumbnail_url para posts com vídeo
7. WHEN post é cancelado THEN o Calendar_System SHALL registrar cancelled_at timestamp

### Requisito 5: Dashboard com Estatísticas

**User Story:** Como usuário, eu quero ver estatísticas consolidadas no dashboard, para que eu possa acompanhar performance da minha estratégia de conteúdo.

#### Acceptance Criteria

1. WHEN usuário acessa dashboard THEN o RENUM_Backend SHALL retornar Dashboard_Stats com métricas agregadas
2. THE Dashboard_Stats SHALL incluir videos_total (total de vídeos gerados)
3. THE Dashboard_Stats SHALL incluir posts_scheduled_month (posts agendados no mês atual)
4. THE Dashboard_Stats SHALL incluir posts_published_month (posts publicados no mês atual)
5. THE Dashboard_Stats SHALL incluir engagement_total (soma de likes, comentários e compartilhamentos)
6. THE Dashboard_Stats SHALL incluir connected_platforms (lista de plataformas conectadas)
7. THE RENUM_Backend SHALL calcular métricas consultando banco de dados e Metricool_Service

### Requisito 6: API Client Frontend

**User Story:** Como desenvolvedor frontend, eu quero um cliente HTTP centralizado, para que eu possa fazer requisições ao backend de forma consistente.

#### Acceptance Criteria

1. THE API_Client SHALL implementar métodos para todos os endpoints do backend
2. THE API_Client SHALL incluir interceptor que adiciona Supabase_JWT em header Authorization
3. THE API_Client SHALL usar variável de ambiente VITE_API_URL para base URL
4. WHEN requisição retorna 401 THEN o API_Client SHALL redirecionar usuário para página de login
5. WHEN requisição retorna 403 ou 500 THEN o API_Client SHALL exibir toast com mensagem de erro
6. THE API_Client SHALL usar axios ou fetch para requisições HTTP
7. THE API_Client SHALL exportar métodos organizados por módulo (dashboard, scriptai, postrapido, avatarai, calendar, integrations)

### Requisito 7: Migração Frontend para Backend

**User Story:** Como desenvolvedor, eu quero eliminar chamadas diretas ao Supabase no frontend, para que toda lógica de negócio seja centralizada no backend.

#### Acceptance Criteria

1. WHEN página Dashboard é carregada THEN o RENUM_Frontend SHALL consumir api.dashboard.getStats()
2. WHEN página ScriptAI é usada THEN o RENUM_Frontend SHALL consumir endpoints do Módulo 1
3. WHEN página PostRápido é usada THEN o RENUM_Frontend SHALL consumir endpoints do Módulo 2
4. WHEN página AvatarAI é usada THEN o RENUM_Frontend SHALL consumir endpoints do Módulo 3
5. WHEN página Settings é usada THEN o RENUM_Frontend SHALL consumir endpoints de integrations
6. WHEN página Calendar é usada THEN o RENUM_Frontend SHALL consumir endpoints de calendar
7. THE RENUM_Frontend SHALL remover todas importações diretas do Supabase client para operações de negócio
8. THE RENUM_Frontend SHALL manter Supabase apenas para autenticação (login/logout/signup)
9. WHEN migração é completa THEN o RENUM_Frontend SHALL funcionar sem erros de console

### Requisito 8: Modelos de Dados

**User Story:** Como desenvolvedor backend, eu quero modelos Pydantic validados, para que eu possa garantir integridade de dados em todas requisições e respostas.

#### Acceptance Criteria

1. THE RENUM_Backend SHALL definir enum SocialPlatform com valores: instagram, tiktok, linkedin, facebook, x, youtube
2. THE RENUM_Backend SHALL definir modelo ConnectRequest para iniciar OAuth_Flow
3. THE RENUM_Backend SHALL definir modelo PlatformStatus com campos: platform, connected, account_name
4. THE RENUM_Backend SHALL definir modelo SocialAccountsResponse com lista de PlatformStatus
5. THE RENUM_Backend SHALL definir modelo CalendarQuery para filtros de busca
6. THE RENUM_Backend SHALL definir modelo CalendarPost com todos campos de post agendado
7. THE RENUM_Backend SHALL definir modelo CalendarResponse com lista de CalendarPost
8. THE RENUM_Backend SHALL definir modelo RescheduleRequest para reagendamento
9. THE RENUM_Backend SHALL definir modelo DashboardStats com todas métricas
10. WHEN dados inválidos são recebidos THEN o RENUM_Backend SHALL retornar erro 422 com detalhes de validação

### Requisito 9: Migration de Banco de Dados

**User Story:** Como desenvolvedor, eu quero atualizar schema do banco de dados, para que eu possa armazenar novos campos necessários para calendário.

#### Acceptance Criteria

1. WHERE migration é necessária, THE RENUM_Backend SHALL adicionar campo metricool_post_id na tabela posts
2. WHERE migration é necessária, THE RENUM_Backend SHALL adicionar campo thumbnail_url na tabela posts
3. WHERE migration é necessária, THE RENUM_Backend SHALL adicionar campo cancelled_at na tabela posts
4. WHERE migration é necessária, THE RENUM_Backend SHALL criar índice em posts(organization_id, scheduled_at)
5. WHERE migration é necessária, THE RENUM_Backend SHALL criar índice em posts(metricool_post_id)
6. THE migration SHALL ser idempotente (executável múltiplas vezes sem erro)

### Requisito 10: Logging e Observabilidade

**User Story:** Como desenvolvedor, eu quero logs estruturados em todos endpoints, para que eu possa debugar problemas em produção.

#### Acceptance Criteria

1. WHEN endpoint é chamado THEN o RENUM_Backend SHALL registrar log com organization_id, module, endpoint, status_code
2. WHEN erro ocorre THEN o RENUM_Backend SHALL registrar stack trace completo
3. WHEN integração externa falha THEN o RENUM_Backend SHALL registrar detalhes da requisição e resposta
4. THE RENUM_Backend SHALL usar logger configurado com formato JSON estruturado
5. THE RENUM_Backend SHALL incluir request_id único em cada log para rastreamento

### Requisito 11: Autenticação e Autorização

**User Story:** Como sistema, eu quero validar identidade do usuário em todas requisições, para que eu possa garantir segurança dos dados.

#### Acceptance Criteria

1. THE RENUM_Backend SHALL usar dependency Depends(get_current_organization) em todos endpoints protegidos
2. WHEN Supabase_JWT é inválido THEN o RENUM_Backend SHALL retornar erro 401
3. WHEN Supabase_JWT está expirado THEN o RENUM_Backend SHALL retornar erro 401
4. WHEN usuário tenta acessar recurso de outra organização THEN o RENUM_Backend SHALL retornar erro 403
5. THE RENUM_Backend SHALL extrair organization_id do Supabase_JWT decodificado

### Requisito 12: Tratamento de Erros

**User Story:** Como usuário, eu quero mensagens de erro claras, para que eu possa entender o que deu errado e como resolver.

#### Acceptance Criteria

1. WHEN Metricool_Service retorna erro THEN o RENUM_Backend SHALL traduzir para mensagem amigável
2. WHEN validação falha THEN o RENUM_Backend SHALL retornar lista de campos inválidos
3. WHEN recurso não é encontrado THEN o RENUM_Backend SHALL retornar erro 404 com mensagem descritiva
4. WHEN rate limit é atingido THEN o RENUM_Backend SHALL retornar erro 429 com tempo de espera
5. THE RENUM_Frontend SHALL exibir erros em toast notifications com ícone apropriado

### Requisito 13: Configuração de Ambiente

**User Story:** Como desenvolvedor, eu quero configuração centralizada, para que eu possa ajustar comportamento sem modificar código.

#### Acceptance Criteria

1. THE RENUM_Backend SHALL ler METRICOOL_ACCESS_TOKEN de variável de ambiente
2. THE RENUM_Frontend SHALL ler VITE_API_URL de variável de ambiente
3. WHEN variável obrigatória está ausente THEN o sistema SHALL falhar na inicialização com mensagem clara
4. THE RENUM_Backend SHALL validar formato de variáveis de ambiente no startup
5. THE RENUM_Frontend SHALL usar valor padrão http://localhost:8000 quando VITE_API_URL não está definida

### Requisito 14: Documentação de API

**User Story:** Como desenvolvedor, eu quero documentação interativa da API, para que eu possa testar endpoints sem escrever código.

#### Acceptance Criteria

1. THE RENUM_Backend SHALL expor documentação Swagger em /docs
2. THE documentação SHALL incluir descrições para todos endpoints
3. THE documentação SHALL incluir exemplos de request/response para cada endpoint
4. THE documentação SHALL agrupar endpoints por tags (Dashboard, Calendar, Integrations, ScriptAI, PostRápido, AvatarAI)
5. WHEN servidor está rodando THEN a documentação SHALL estar acessível sem erros

### Requisito 15: Validação End-to-End

**User Story:** Como desenvolvedor, eu quero validar fluxo completo, para que eu possa garantir que sistema funciona de ponta a ponta.

#### Acceptance Criteria

1. WHEN usuário faz login THEN o Dashboard SHALL exibir estatísticas reais do backend
2. WHEN usuário acessa ScriptAI THEN os dados SHALL vir do backend via API_Client
3. WHEN usuário faz upload em PostRápido THEN o arquivo SHALL ser enviado ao backend
4. WHEN usuário acessa Calendário THEN posts agendados reais SHALL ser exibidos
5. WHEN usuário acessa Settings THEN status de conexão de redes sociais SHALL ser exibido
6. WHEN usuário conecta rede social THEN OAuth_Flow SHALL completar com sucesso
7. WHEN usuário desconecta rede social THEN status SHALL atualizar imediatamente
