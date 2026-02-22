# Requirements Document

## Introduction

Este documento especifica os requisitos para a refatoração da integração HeyGen no RENUM. A refatoração visa melhorar a experiência do usuário removendo a configuração HeyGen do onboarding principal e criando um wizard dedicado de 2 passos no módulo AvatarAI. O sistema permitirá que usuários Pro configurem sua integração HeyGen de forma guiada, validem API Keys, selecionem avatares e vozes, e criem clones digitais com instruções claras.

## Glossary

- **System**: O sistema RENUM (plataforma de gestão de redes sociais)
- **Onboarding**: Processo inicial de configuração quando usuário cria conta
- **Wizard**: Interface guiada de 2 passos para configuração HeyGen
- **HeyGen**: Plataforma externa de geração de vídeos com avatares AI
- **API_Key**: Chave de autenticação fornecida pelo HeyGen
- **Avatar**: Personagem digital usado para gerar vídeos
- **Voice**: Voz associada a um avatar específico
- **Clone**: Avatar personalizado criado a partir de vídeo do usuário
- **Module3**: Módulo AvatarAI dentro do sistema RENUM
- **Pro_User**: Usuário com plano pago que tem acesso ao módulo AvatarAI
- **HeyGenCloneGuide**: Modal com instruções para criar clone digital
- **Validator**: Componente que valida API Keys com a API HeyGen
- **Backend**: Servidor Node.js/Express que processa requisições
- **Database**: Banco de dados Supabase (PostgreSQL)

## Requirements

### Requirement 1: Onboarding Simplificado

**User Story:** Como novo usuário, quero completar o onboarding sem configurar HeyGen, para que eu possa começar a usar o sistema rapidamente sem configurações complexas.

#### Acceptance Criteria

1. WHEN um novo usuário acessa o onboarding, THE System SHALL exibir exatamente 3 passos (Perfil, Conectar Redes, Pronto)
2. THE System SHALL NOT exibir configuração de Avatar AI durante o onboarding
3. WHEN o usuário completa o Passo 3, THE System SHALL marcar onboarding_step como 3 no banco de dados
4. WHEN o onboarding é concluído, THE System SHALL redirecionar o usuário para o dashboard principal
5. THE System SHALL permitir que usuários Pro acessem a configuração HeyGen posteriormente via Module3

### Requirement 2: Wizard de Configuração HeyGen

**User Story:** Como usuário Pro, quero configurar HeyGen via wizard dedicado, para que eu possa integrar minha conta HeyGen de forma guiada e intuitiva.

#### Acceptance Criteria

1. WHEN um usuário Pro acessa Module3 sem HeyGen configurado, THE System SHALL exibir o HeyGenSetupWizard ocupando a tela inteira do módulo
2. THE Wizard SHALL consistir de exatamente 2 passos sequenciais (Conectar API Key → Escolher Avatar e Voz)
3. WHEN o usuário está no Passo 1, THE System SHALL exibir campo de API Key com tipo password e toggle mostrar/ocultar
4. THE Wizard SHALL exibir link "Criar conta grátis no HeyGen" apontando para heygen.com
5. WHEN o usuário avança entre passos, THE System SHALL manter estado consistente do wizard
6. WHEN o wizard é concluído com sucesso, THE System SHALL exibir o módulo AvatarAI normal

### Requirement 3: Validação de API Key

**User Story:** Como usuário, quero validar minha API Key antes de salvar, para que eu tenha certeza de que a chave está correta antes de prosseguir.

#### Acceptance Criteria

1. WHEN o usuário clica em "Conectar" no Passo 1, THE System SHALL enviar POST /api/heygen/validate-key com a API Key fornecida
2. THE Validator SHALL fazer requisição GET /v2/avatars à API HeyGen para validar a chave
3. IF a API Key é válida, THEN THE System SHALL permitir avanço para o Passo 2
4. IF a API Key é inválida, THEN THE System SHALL exibir mensagem de erro e impedir avanço
5. WHILE a validação está em progresso, THE System SHALL exibir estado de loading no botão "Conectar"
6. THE System SHALL completar a validação em menos de 3 segundos
7. THE System SHALL NOT salvar a API Key no banco de dados durante a validação

### Requirement 4: Seleção de Avatar e Voz

**User Story:** Como usuário, quero escolher avatar e voz juntos, para que eu possa configurar minha identidade digital de forma completa em um único passo.

#### Acceptance Criteria

1. WHEN o usuário avança para o Passo 2, THE System SHALL carregar lista de avatares via GET /api/heygen/avatars
2. WHEN o usuário avança para o Passo 2, THE System SHALL carregar lista de vozes via GET /api/heygen/voices
3. THE System SHALL exibir avatares em grid com preview visual (thumbnail)
4. WHEN o usuário seleciona um avatar, THE System SHALL exibir lista de vozes compatíveis
5. THE System SHALL permitir preview de voz antes da seleção final
6. WHEN o usuário clica em "Salvar", THE System SHALL enviar PUT /api/heygen com api_key, avatar_id e voice_id
7. THE System SHALL salvar heygen_api_key, heygen_avatar_id e heygen_voice_id na tabela organizations
8. THE System SHALL NOT permitir salvar sem avatar e voz selecionados

### Requirement 5: Criação de Clone Digital

**User Story:** Como usuário, quero criar meu clone digital com instruções claras, para que eu possa ter um avatar personalizado sem dificuldades técnicas.

#### Acceptance Criteria

1. WHEN o usuário clica em "Criar meu clone" no Passo 2, THE System SHALL exibir modal HeyGenCloneGuide
2. THE HeyGenCloneGuide SHALL exibir instruções passo-a-passo para criar clone na plataforma HeyGen
3. THE HeyGenCloneGuide SHALL incluir link direto para studio.heygen.com/instant-avatar
4. THE HeyGenCloneGuide SHALL explicar requisitos de vídeo (duração, qualidade, iluminação)
5. THE HeyGenCloneGuide SHALL informar que o clone é criado na plataforma HeyGen, não no RENUM
6. WHEN o usuário fecha o modal, THE System SHALL retornar ao Passo 2 do wizard
7. THE System SHALL permitir que o usuário continue com avatar padrão ou aguarde criação do clone

### Requirement 6: Gerenciamento de Avatar Configurado

**User Story:** Como usuário configurado, quero trocar avatar facilmente, para que eu possa atualizar minha identidade digital quando necessário.

#### Acceptance Criteria

1. WHEN um usuário Pro acessa Module3 com HeyGen configurado, THE System SHALL exibir o módulo AvatarAI normal
2. THE System SHALL exibir header com miniatura do avatar atual, créditos HeyGen e botão "Trocar avatar"
3. WHEN o usuário clica em "Trocar avatar", THE System SHALL reabrir o HeyGenSetupWizard no Passo 2
4. THE System SHALL pré-carregar avatar e voz atuais no wizard
5. WHEN o usuário salva novo avatar, THE System SHALL atualizar heygen_avatar_id e heygen_voice_id no banco
6. THE System SHALL manter a mesma heygen_api_key ao trocar avatar

### Requirement 7: Persistência de Dados

**User Story:** Como sistema, preciso persistir dados de configuração HeyGen corretamente, para que as configurações do usuário sejam mantidas entre sessões.

#### Acceptance Criteria

1. THE Database SHALL armazenar heygen_api_key na tabela organizations
2. THE Database SHALL armazenar heygen_access_token na tabela organizations (preparação para OAuth futuro)
3. THE Database SHALL armazenar heygen_avatar_id na tabela organizations
4. THE Database SHALL armazenar heygen_voice_id na tabela organizations
5. WHEN dados HeyGen são salvos, THE System SHALL garantir integridade referencial com organization_id
6. THE System SHALL permitir valores NULL para campos HeyGen quando não configurado
7. WHEN o usuário salva configuração, THE Backend SHALL validar que avatar_id e voice_id existem na API HeyGen

### Requirement 8: Segurança e Privacidade

**User Story:** Como usuário, quero que minha API Key seja protegida, para que minhas credenciais não sejam expostas ou comprometidas.

#### Acceptance Criteria

1. THE System SHALL armazenar heygen_api_key de forma segura no banco de dados
2. THE System SHALL NOT expor API Keys em logs do sistema
3. THE System SHALL NOT expor API Keys em respostas de API para o frontend
4. WHEN o frontend exibe campo de API Key, THE System SHALL usar type="password" por padrão
5. THE System SHALL transmitir API Keys apenas via HTTPS
6. THE Backend SHALL validar que apenas o owner da organização pode modificar configurações HeyGen
7. THE System SHALL aplicar políticas RLS (Row Level Security) para acesso aos dados HeyGen

### Requirement 9: Feedback Visual e Estados

**User Story:** Como usuário, quero feedback visual em todas as ações, para que eu saiba o que está acontecendo e se minhas ações foram bem-sucedidas.

#### Acceptance Criteria

1. WHEN uma requisição está em progresso, THE System SHALL exibir indicador de loading apropriado
2. WHEN uma ação é bem-sucedida, THE System SHALL exibir mensagem de sucesso
3. IF uma ação falha, THEN THE System SHALL exibir mensagem de erro descritiva
4. THE System SHALL exibir estado disabled em botões durante processamento
5. WHEN o usuário avança entre passos do wizard, THE System SHALL exibir indicador de progresso (1/2, 2/2)
6. THE System SHALL exibir skeleton loaders enquanto carrega avatares e vozes
7. WHEN dados são salvos com sucesso, THE System SHALL exibir confirmação visual antes de fechar o wizard

### Requirement 10: Responsividade e Acessibilidade

**User Story:** Como usuário, quero usar o sistema em qualquer dispositivo, para que eu possa configurar HeyGen de desktop ou mobile.

#### Acceptance Criteria

1. THE System SHALL implementar design mobile-first para o wizard
2. THE System SHALL adaptar layout do wizard para telas de 320px a 1920px
3. THE System SHALL garantir contraste mínimo WCAG 2.1 AA em todos os elementos
4. THE System SHALL permitir navegação completa via teclado
5. THE System SHALL fornecer labels acessíveis para leitores de tela
6. THE System SHALL exibir focus indicators visíveis em elementos interativos
7. THE System SHALL garantir que modais sejam acessíveis via teclado (ESC para fechar)

### Requirement 11: Performance

**User Story:** Como usuário, quero que o sistema responda rapidamente, para que eu possa configurar HeyGen sem esperas desnecessárias.

#### Acceptance Criteria

1. THE System SHALL completar validação de API Key em menos de 3 segundos
2. THE System SHALL carregar lista de avatares em menos de 2 segundos
3. THE System SHALL carregar lista de vozes em menos de 2 segundos
4. THE System SHALL salvar configuração HeyGen em menos de 1 segundo
5. THE System SHALL implementar cache de avatares e vozes por 5 minutos
6. THE System SHALL exibir feedback visual imediato (< 100ms) para todas as interações do usuário

### Requirement 12: Tratamento de Erros

**User Story:** Como usuário, quero entender o que deu errado quando algo falha, para que eu possa corrigir o problema e continuar.

#### Acceptance Criteria

1. IF a validação de API Key falha por chave inválida, THEN THE System SHALL exibir "API Key inválida. Verifique e tente novamente."
2. IF a validação de API Key falha por erro de rede, THEN THE System SHALL exibir "Erro de conexão. Verifique sua internet e tente novamente."
3. IF o carregamento de avatares falha, THEN THE System SHALL exibir mensagem de erro e botão "Tentar novamente"
4. IF o salvamento de configuração falha, THEN THE System SHALL manter dados preenchidos e permitir nova tentativa
5. THE System SHALL logar erros detalhados no backend para debugging
6. THE System SHALL NOT expor detalhes técnicos de erros para o usuário final
7. IF a API HeyGen está indisponível, THEN THE System SHALL exibir mensagem apropriada e sugerir tentar mais tarde

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Property 1: Onboarding sempre tem 3 passos

*Para qualquer* novo usuário que acessa o onboarding, o sistema deve exibir exatamente 3 passos e nunca incluir configuração de Avatar AI.

**Validates: Requirements 1.1, 1.2**

### Property 2: Wizard só é exibido quando HeyGen não está configurado

*Para qualquer* usuário Pro que acessa Module3, se heygen_api_key é NULL no banco, então o wizard deve ser exibido; se heygen_api_key existe, então o módulo normal deve ser exibido.

**Validates: Requirements 2.1, 6.1**

### Property 3: API Key válida é pré-requisito para Passo 2

*Para qualquer* tentativa de avançar do Passo 1 para Passo 2, o sistema deve ter validado com sucesso a API Key via API HeyGen antes de permitir o avanço.

**Validates: Requirements 3.3, 3.4**

### Property 4: Validação não persiste dados

*Para qualquer* requisição POST /validate-key, o sistema deve validar a API Key com a API HeyGen mas nunca salvar a chave no banco de dados.

**Validates: Requirements 3.7**

### Property 5: Avatar e voz são obrigatórios para salvar

*Para qualquer* tentativa de salvar configuração HeyGen, o sistema deve rejeitar a operação se avatar_id OU voice_id estiverem ausentes.

**Validates: Requirements 4.8**

### Property 6: Dados HeyGen são salvos atomicamente

*Para qualquer* operação PUT /heygen bem-sucedida, o sistema deve salvar heygen_api_key, heygen_avatar_id e heygen_voice_id na mesma transação, garantindo que todos sejam salvos ou nenhum seja salvo.

**Validates: Requirements 7.5, 7.7**

### Property 7: API Keys nunca são expostas

*Para qualquer* resposta de API do backend para o frontend, o sistema nunca deve incluir o valor de heygen_api_key no payload de resposta.

**Validates: Requirements 8.3**

### Property 8: Apenas owner pode modificar configurações HeyGen

*Para qualquer* requisição PUT /heygen, o sistema deve validar que o usuário autenticado é o owner da organização antes de permitir modificação.

**Validates: Requirements 8.6**

### Property 9: Feedback visual em todas as ações assíncronas

*Para qualquer* ação que envolve requisição ao backend (validar, carregar, salvar), o sistema deve exibir estado de loading durante a requisição e feedback de sucesso/erro após conclusão.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 10: Wizard mantém estado consistente

*Para qualquer* navegação entre passos do wizard, o sistema deve preservar dados já preenchidos (API Key no Passo 1, seleções no Passo 2) até que o wizard seja concluído ou cancelado.

**Validates: Requirements 2.5**

### Property 11: Trocar avatar preserva API Key

*Para qualquer* operação de trocar avatar via botão "Trocar avatar", o sistema deve manter a heygen_api_key existente e apenas atualizar heygen_avatar_id e heygen_voice_id.

**Validates: Requirements 6.5, 6.6**

### Property 12: Validação de performance

*Para qualquer* requisição de validação de API Key, o sistema deve completar a operação (sucesso ou erro) em menos de 3 segundos.

**Validates: Requirements 3.6, 11.1**

### Property 13: Cache de avatares e vozes

*Para qualquer* requisição GET /avatars ou GET /voices dentro de 5 minutos da requisição anterior, o sistema deve retornar dados do cache ao invés de fazer nova requisição à API HeyGen.

**Validates: Requirements 11.5**

### Property 14: Erros de rede são tratados graciosamente

*Para qualquer* falha de requisição à API HeyGen por erro de rede, o sistema deve exibir mensagem apropriada ao usuário e permitir nova tentativa sem perder dados já preenchidos.

**Validates: Requirements 12.2, 12.4**

### Property 15: Integridade referencial de avatar e voz

*Para qualquer* operação de salvar configuração HeyGen, o sistema deve validar que avatar_id e voice_id existem na API HeyGen antes de persistir no banco de dados.

**Validates: Requirements 7.7**

### Property 16: Modal de clone não altera estado do wizard

*Para qualquer* abertura e fechamento do modal HeyGenCloneGuide, o sistema deve preservar o estado do Passo 2 do wizard (seleções, dados preenchidos).

**Validates: Requirements 5.6**

### Property 17: Acessibilidade via teclado

*Para qualquer* elemento interativo do wizard (campos, botões, links), o sistema deve permitir navegação e ativação completa via teclado (Tab, Enter, ESC).

**Validates: Requirements 10.4, 10.7**

### Property 18: Responsividade em todas as resoluções

*Para qualquer* resolução de tela entre 320px e 1920px, o wizard deve adaptar seu layout mantendo todos os elementos visíveis e funcionais.

**Validates: Requirements 10.2**

### Property 19: RLS protege dados HeyGen

*Para qualquer* tentativa de acesso aos campos heygen_* na tabela organizations, o sistema deve aplicar políticas RLS garantindo que apenas usuários autorizados da organização possam ler/modificar.

**Validates: Requirements 8.7**

### Property 20: Logs não contêm API Keys

*Para qualquer* operação de logging no backend, o sistema nunca deve incluir valores de heygen_api_key nos logs, mesmo em caso de erro.

**Validates: Requirements 8.2**
