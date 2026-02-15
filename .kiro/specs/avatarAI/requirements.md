# Requirements Document - AvatarAI Module

## Introduction

O módulo AvatarAI (Módulo 3) permite que usuários da plataforma RENUM gerem vídeos com avatares digitais utilizando a API do HeyGen em modelo self-service. Cada organização gerencia suas próprias credenciais HeyGen (API Key, Avatar ID, Voice ID) e créditos, proporcionando autonomia completa na geração de conteúdo em vídeo com avatares realistas.

O módulo integra-se com o ScriptAI (Módulo 1) para receber scripts gerados por IA e com o PostRápido (Módulo 2) para agendamento automático dos vídeos gerados nas redes sociais.

## Glossary

- **HeyGen**: Plataforma de geração de vídeos com avatares digitais via API
- **Avatar**: Personagem digital animado que apresenta o conteúdo do vídeo
- **Voice**: Voz sintética utilizada para narração do avatar
- **API_Key**: Chave de autenticação da API HeyGen fornecida pelo usuário
- **Avatar_ID**: Identificador único do avatar escolhido pelo usuário no HeyGen
- **Voice_ID**: Identificador único da voz escolhida pelo usuário no HeyGen
- **Video_Generation_Job**: Processo assíncrono de geração de vídeo no HeyGen
- **HeyGenService**: Serviço backend que integra com a API REST do HeyGen
- **EncryptionService**: Serviço existente para criptografia de credenciais sensíveis
- **Organization**: Entidade que representa uma empresa/cliente na plataforma RENUM
- **Self_Service_Model**: Modelo onde cada usuário gerencia suas próprias credenciais e créditos
- **Script**: Texto roteirizado que será narrado pelo avatar no vídeo
- **Credits**: Créditos HeyGen consumidos na geração de vídeos (gerenciados pelo usuário)

## Requirements

### Requirement 1: Configuração de Credenciais HeyGen

**User Story:** Como usuário Pro, quero configurar minhas credenciais HeyGen (API Key, Avatar ID, Voice ID), para que eu possa gerar vídeos com avatares usando minha própria conta HeyGen.

#### Acceptance Criteria

1. WHEN um usuário Pro acessa a página de configuração de integrações, THE System SHALL exibir formulário para inserir API Key, Avatar ID e Voice ID do HeyGen
2. WHEN um usuário submete credenciais HeyGen, THE System SHALL validar a API Key fazendo uma chamada de teste à API HeyGen
3. WHEN a validação da API Key é bem-sucedida, THE System SHALL criptografar a API Key usando o EncryptionService antes de salvar no banco de dados
4. WHEN as credenciais são salvas, THE System SHALL armazenar API Key criptografada, Avatar ID e Voice ID na tabela organizations
5. IF a validação da API Key falhar, THEN THE System SHALL retornar mensagem de erro clara orientando o usuário a verificar suas credenciais no HeyGen

### Requirement 2: Consulta de Recursos HeyGen

**User Story:** Como usuário Pro com credenciais configuradas, quero consultar avatares e vozes disponíveis na minha conta HeyGen, para que eu possa escolher qual avatar e voz utilizar nos meus vídeos.

#### Acceptance Criteria

1. WHEN um usuário solicita lista de avatares, THE System SHALL fazer requisição GET à API HeyGen usando a API Key descriptografada do usuário
2. WHEN a API HeyGen retorna avatares, THE System SHALL formatar e retornar lista com id, name, preview_image_url de cada avatar
3. WHEN um usuário solicita lista de vozes, THE System SHALL fazer requisição GET à API HeyGen com filtro opcional de idioma
4. WHEN a API HeyGen retorna vozes, THE System SHALL formatar e retornar lista com id, name, language, gender de cada voz
5. IF as credenciais não estiverem configuradas, THEN THE System SHALL retornar erro 400 com mensagem "Configure suas credenciais HeyGen antes de continuar"

### Requirement 3: Consulta de Créditos HeyGen

**User Story:** Como usuário Pro, quero visualizar meus créditos disponíveis no HeyGen, para que eu possa saber se tenho saldo suficiente para gerar vídeos.

#### Acceptance Criteria

1. WHEN um usuário solicita consulta de créditos, THE System SHALL fazer requisição GET à API HeyGen endpoint de créditos usando a API Key do usuário
2. WHEN a API HeyGen retorna informações de créditos, THE System SHALL retornar remaining_credits e total_credits
3. WHEN a consulta é bem-sucedida, THE System SHALL atualizar campos heygen_credits_total e heygen_credits_used na tabela organizations
4. IF os créditos restantes forem zero, THEN THE System SHALL incluir no response uma flag low_credits_warning com valor true
5. IF a API Key for inválida ou expirada, THEN THE System SHALL retornar erro 401 com mensagem orientando renovação das credenciais

### Requirement 4: Geração de Vídeo com Avatar

**User Story:** Como usuário Pro com credenciais configuradas, quero enviar um script para geração de vídeo com avatar, para que eu possa criar conteúdo em vídeo automaticamente.

#### Acceptance Criteria

1. WHEN um usuário envia script para geração, THE System SHALL validar que o script não está vazio e tem no máximo 5000 caracteres
2. WHEN a validação do script é bem-sucedida, THE System SHALL verificar se a organização tem credenciais HeyGen configuradas
3. WHEN as credenciais estão configuradas, THE System SHALL fazer requisição POST à API HeyGen com script, avatar_id e voice_id
4. WHEN a API HeyGen aceita a requisição, THE System SHALL retornar video_generation_id e status "processing"
5. WHEN o vídeo é criado, THE System SHALL salvar registro na tabela videos com recording_source "heygen" e video_generation_id
6. IF o script exceder 5000 caracteres, THEN THE System SHALL retornar erro 400 com mensagem "Script muito longo. Máximo: 5000 caracteres"
7. IF as credenciais não estiverem configuradas, THEN THE System SHALL retornar erro 400 com mensagem "Configure suas credenciais HeyGen em Configurações > Integrações"
8. IF os créditos HeyGen forem insuficientes, THEN THE System SHALL retornar erro 402 com mensagem "Créditos HeyGen insuficientes. Recarregue sua conta em heygen.com"

### Requirement 5: Monitoramento de Status de Geração

**User Story:** Como usuário Pro, quero consultar o status de geração do meu vídeo, para que eu possa saber quando o vídeo estiver pronto para uso.

#### Acceptance Criteria

1. WHEN um usuário consulta status de geração, THE System SHALL fazer requisição GET à API HeyGen usando video_generation_id
2. WHEN a API HeyGen retorna status "processing", THE System SHALL retornar status "processing" e estimated_time_remaining
3. WHEN a API HeyGen retorna status "completed", THE System SHALL retornar status "completed" e video_download_url
4. WHEN o status é "completed", THE System SHALL atualizar registro na tabela videos com video_url e status "ready"
5. IF a API HeyGen retornar status "failed", THEN THE System SHALL retornar status "failed" e error_message descritivo
6. IF o video_generation_id não existir, THEN THE System SHALL retornar erro 404 com mensagem "Vídeo não encontrado"

### Requirement 6: Download de Vídeo Gerado

**User Story:** Como usuário Pro, quero fazer download do vídeo gerado pelo HeyGen, para que eu possa armazená-lo na plataforma RENUM e utilizá-lo no PostRápido.

#### Acceptance Criteria

1. WHEN um usuário solicita download de vídeo pronto, THE System SHALL fazer requisição GET à API HeyGen para obter URL de download
2. WHEN a URL de download é obtida, THE System SHALL fazer download do arquivo de vídeo
3. WHEN o download é concluído, THE System SHALL fazer upload do vídeo para Supabase Storage bucket videos-raw
4. WHEN o upload é bem-sucedido, THE System SHALL atualizar registro na tabela videos com video_url do Supabase Storage
5. IF o vídeo ainda não estiver pronto, THEN THE System SHALL retornar erro 425 com mensagem "Vídeo ainda está sendo processado. Aguarde alguns minutos"
6. IF o download falhar, THEN THE System SHALL retornar erro 500 com mensagem "Falha ao baixar vídeo. Tente novamente"

### Requirement 7: Integração com PostRápido

**User Story:** Como usuário Pro, quero enviar vídeo gerado pelo AvatarAI para o PostRápido, para que eu possa agendar publicação nas redes sociais.

#### Acceptance Criteria

1. WHEN um usuário envia vídeo do AvatarAI para PostRápido, THE System SHALL verificar se o vídeo tem status "ready"
2. WHEN o vídeo está pronto, THE System SHALL criar registro na interface do PostRápido com video_url e metadata
3. WHEN o registro é criado, THE System SHALL retornar success true e redirect_url para página do PostRápido
4. IF o vídeo não estiver pronto, THEN THE System SHALL retornar erro 400 com mensagem "Aguarde a conclusão da geração do vídeo"
5. IF o usuário não tiver acesso ao Módulo 2, THEN THE System SHALL retornar erro 403 com mensagem "Módulo PostRápido não disponível no seu plano"

### Requirement 8: Validação de Plano Pro

**User Story:** Como sistema, quero garantir que apenas usuários Pro acessem o módulo AvatarAI, para que o modelo de negócio seja respeitado.

#### Acceptance Criteria

1. WHEN um usuário tenta acessar qualquer endpoint do módulo AvatarAI, THE System SHALL verificar o plano da organização
2. IF o plano da organização for "free" ou "starter", THEN THE System SHALL retornar erro 403 com mensagem "Módulo AvatarAI disponível apenas no plano Pro"
3. IF o plano da organização for "pro", THEN THE System SHALL permitir acesso ao endpoint
4. WHEN a verificação de plano falhar, THE System SHALL registrar tentativa de acesso em api_logs

### Requirement 9: Registro de Logs de API

**User Story:** Como administrador do sistema, quero registrar todas chamadas à API HeyGen, para que eu possa monitorar uso e custos.

#### Acceptance Criteria

1. WHEN o System faz qualquer chamada à API HeyGen, THE System SHALL registrar log na tabela api_logs
2. WHEN o log é criado, THE System SHALL incluir organization_id, module "3", endpoint, request_duration, status_code
3. WHEN a chamada consome créditos HeyGen, THE System SHALL incluir credits_consumed no log
4. WHEN a chamada falha, THE System SHALL incluir error_message no log
5. THE System SHALL registrar timestamp de cada chamada para auditoria

### Requirement 10: Tratamento de Erros da API HeyGen

**User Story:** Como usuário Pro, quero receber mensagens de erro claras quando algo falhar, para que eu saiba como resolver o problema.

#### Acceptance Criteria

1. WHEN a API HeyGen retorna erro 401 (Unauthorized), THE System SHALL retornar mensagem "Credenciais HeyGen inválidas. Verifique sua API Key em Configurações"
2. WHEN a API HeyGen retorna erro 402 (Payment Required), THE System SHALL retornar mensagem "Créditos HeyGen insuficientes. Recarregue sua conta em heygen.com"
3. WHEN a API HeyGen retorna erro 429 (Rate Limit), THE System SHALL retornar mensagem "Limite de requisições atingido. Aguarde alguns minutos e tente novamente"
4. WHEN a API HeyGen retorna erro 500 (Server Error), THE System SHALL retornar mensagem "Serviço HeyGen temporariamente indisponível. Tente novamente em alguns minutos"
5. WHEN ocorre timeout na requisição, THE System SHALL retornar mensagem "Tempo de resposta excedido. Verifique sua conexão e tente novamente"
6. THE System SHALL NUNCA expor detalhes técnicos da API HeyGen ao usuário final

### Requirement 11: Uso de Avatar e Voice Padrão

**User Story:** Como usuário Pro, quero que o sistema use avatar e voz padrão configurados quando eu não especificar, para que eu não precise informar esses dados em cada geração.

#### Acceptance Criteria

1. WHEN um usuário envia requisição de geração sem especificar avatar_id, THE System SHALL usar heygen_avatar_id da tabela organizations
2. WHEN um usuário envia requisição de geração sem especificar voice_id, THE System SHALL usar heygen_voice_id da tabela organizations
3. IF avatar_id e voice_id padrão não estiverem configurados, THEN THE System SHALL retornar erro 400 com mensagem "Configure avatar e voz padrão em Configurações > Integrações"
4. WHEN um usuário especifica avatar_id ou voice_id na requisição, THE System SHALL usar os valores especificados ao invés dos padrão



