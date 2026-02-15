# Módulo 3 - AvatarAI

## Visão Geral

O módulo AvatarAI permite que usuários da plataforma RENUM gerem vídeos com avatares digitais utilizando a API do HeyGen em modelo self-service. Cada organização gerencia suas próprias credenciais HeyGen (API Key, Avatar ID, Voice ID) e créditos, proporcionando autonomia completa na geração de conteúdo em vídeo com avatares realistas.

## Funcionalidades

- ✅ Configuração de credenciais HeyGen (API Key, Avatar, Voz)
- ✅ Consulta de avatares e vozes disponíveis
- ✅ Consulta de créditos HeyGen
- ✅ Geração de vídeos com avatares
- ✅ Monitoramento de status de geração
- ✅ Download automático e armazenamento no Supabase
- ✅ Integração com PostRápido (Módulo 2)

## Requisitos

- Plano Pro ativo
- Conta HeyGen com API Key válida
- Créditos HeyGen disponíveis

## Fluxo de Configuração

### 1. Obter Credenciais HeyGen

1. Acesse [HeyGen](https://heygen.com)
2. Faça login na sua conta
3. Navegue até **Settings > API Keys**
4. Copie sua API Key
5. Escolha um Avatar ID e Voice ID disponíveis na sua conta

### 2. Configurar na Plataforma RENUM

**Endpoint:** `PUT /api/integrations/heygen`

**Request:**
```json
{
  "api_key": "sua_api_key_aqui",
  "avatar_id": "avatar_123",
  "voice_id": "voice_456"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Credenciais HeyGen configuradas com sucesso",
  "credits_remaining": 150.5
}
```

**Response (Erro - Credenciais Inválidas):**
```json
{
  "success": false,
  "error": "Credenciais HeyGen inválidas. Verifique sua API Key em Configurações"
}
```

### 3. Testar Conexão

**Endpoint:** `POST /api/integrations/heygen/test`

**Response:**
```json
{
  "success": true,
  "message": "Conexão com HeyGen estabelecida",
  "account_name": "Minha Empresa",
  "credits_remaining": 150.5
}
```

## Endpoints Disponíveis

### Configuração

#### 1. Configurar Credenciais
- **Método:** `PUT`
- **Endpoint:** `/api/integrations/heygen`
- **Autenticação:** Bearer Token
- **Plano:** Pro
- **Descrição:** Salva ou atualiza credenciais HeyGen da organização

#### 2. Testar Conexão
- **Método:** `POST`
- **Endpoint:** `/api/integrations/heygen/test`
- **Autenticação:** Bearer Token
- **Plano:** Pro
- **Descrição:** Testa conexão com HeyGen usando credenciais salvas

#### 3. Consultar Créditos
- **Método:** `GET`
- **Endpoint:** `/api/integrations/heygen/credits`
- **Autenticação:** Bearer Token
- **Plano:** Pro
- **Descrição:** Consulta créditos HeyGen disponíveis

**Response:**
```json
{
  "remaining_credits": 150.5,
  "total_credits": 200.0,
  "credits_used": 49.5,
  "low_credits_warning": false
}
```

#### 4. Listar Avatares
- **Método:** `GET`
- **Endpoint:** `/api/integrations/heygen/avatars`
- **Autenticação:** Bearer Token
- **Plano:** Pro
- **Descrição:** Lista avatares disponíveis na conta HeyGen

**Response:**
```json
{
  "avatars": [
    {
      "avatar_id": "avatar_123",
      "avatar_name": "John Professional",
      "preview_image_url": "https://...",
      "gender": "male"
    }
  ]
}
```

#### 5. Listar Vozes
- **Método:** `GET`
- **Endpoint:** `/api/integrations/heygen/voices?language=pt`
- **Autenticação:** Bearer Token
- **Plano:** Pro
- **Query Params:** `language` (opcional) - Filtrar por idioma (pt, en, es, etc.)
- **Descrição:** Lista vozes disponíveis na conta HeyGen

**Response:**
```json
{
  "voices": [
    {
      "voice_id": "voice_456",
      "voice_name": "Maria Brazilian",
      "language": "pt",
      "gender": "female",
      "preview_audio_url": "https://..."
    }
  ]
}
```

### Geração de Vídeos

#### 6. Gerar Vídeo
- **Método:** `POST`
- **Endpoint:** `/api/modules/3/generate-video`
- **Autenticação:** Bearer Token
- **Plano:** Pro
- **Descrição:** Inicia geração de vídeo com avatar

**Request:**
```json
{
  "script": "Olá! Bem-vindo ao nosso canal. Hoje vamos falar sobre...",
  "title": "Vídeo de Boas-Vindas",
  "avatar_id": "avatar_123",
  "voice_id": "voice_456",
  "dimension": {
    "width": 1920,
    "height": 1080
  }
}
```

**Campos:**
- `script` (obrigatório): Texto que será narrado pelo avatar (1-5000 caracteres)
- `title` (opcional): Título do vídeo
- `avatar_id` (opcional): ID do avatar. Se não informado, usa o padrão da organização
- `voice_id` (opcional): ID da voz. Se não informado, usa o padrão da organização
- `dimension` (opcional): Dimensões do vídeo. Padrão: 1920x1080

**Response (Sucesso):**
```json
{
  "success": true,
  "job_id": "uuid-video-job",
  "video_id": "heygen_video_123",
  "status": "processing",
  "message": "Vídeo em processamento. Consulte o status em alguns minutos"
}
```

**Response (Erro - Script Inválido):**
```json
{
  "success": false,
  "error": "Script muito longo. Máximo: 5000 caracteres"
}
```

**Response (Erro - Créditos Insuficientes):**
```json
{
  "success": false,
  "error": "Créditos HeyGen insuficientes. Recarregue sua conta em heygen.com"
}
```

#### 7. Consultar Status
- **Método:** `GET`
- **Endpoint:** `/api/modules/3/generate-video/{job_id}/status`
- **Autenticação:** Bearer Token
- **Plano:** Pro
- **Descrição:** Consulta status de geração de vídeo

**Response (Processing):**
```json
{
  "job_id": "uuid-video-job",
  "video_id": "heygen_video_123",
  "status": "processing",
  "progress": 45,
  "estimated_time_remaining": 120
}
```

**Response (Completed):**
```json
{
  "job_id": "uuid-video-job",
  "video_id": "heygen_video_123",
  "status": "completed",
  "video_url": "https://supabase.../video.mp4",
  "duration": 45.5,
  "thumbnail_url": "https://...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Response (Failed):**
```json
{
  "job_id": "uuid-video-job",
  "video_id": "heygen_video_123",
  "status": "failed",
  "error": "Falha na geração do vídeo. Tente novamente"
}
```

### Integração com PostRápido

#### 8. Enviar para PostRápido
- **Método:** `POST`
- **Endpoint:** `/api/modules/3/send-to-postrapido`
- **Autenticação:** Bearer Token
- **Plano:** Pro
- **Descrição:** Envia vídeo gerado para o módulo PostRápido

**Request:**
```json
{
  "video_id": "uuid-video-job"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Vídeo enviado para PostRápido",
  "redirect_url": "/modules/2?video_id=uuid-video-job"
}
```

**Response (Erro - Vídeo Não Pronto):**
```json
{
  "success": false,
  "error": "Aguarde a conclusão da geração do vídeo"
}
```

## Fluxo Completo de Uso

### Exemplo: Gerar e Publicar Vídeo

```bash
# 1. Configurar credenciais (uma vez)
curl -X PUT https://api.renum.com/api/integrations/heygen \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "sua_api_key",
    "avatar_id": "avatar_123",
    "voice_id": "voice_456"
  }'

# 2. Consultar créditos disponíveis
curl -X GET https://api.renum.com/api/integrations/heygen/credits \
  -H "Authorization: Bearer $TOKEN"

# 3. Gerar vídeo
curl -X POST https://api.renum.com/api/modules/3/generate-video \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Olá! Este é um vídeo de teste com avatar digital.",
    "title": "Vídeo Teste"
  }'

# Response: { "job_id": "abc-123", "status": "processing" }

# 4. Consultar status (aguardar alguns minutos)
curl -X GET https://api.renum.com/api/modules/3/generate-video/abc-123/status \
  -H "Authorization: Bearer $TOKEN"

# 5. Quando status = "completed", enviar para PostRápido
curl -X POST https://api.renum.com/api/modules/3/send-to-postrapido \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "abc-123"
  }'
```

## Mensagens de Erro Comuns

### 400 - Bad Request

| Mensagem | Causa | Solução |
|----------|-------|---------|
| "Script não pode estar vazio" | Script vazio ou apenas espaços | Forneça um script válido |
| "Script muito longo. Máximo: 5000 caracteres" | Script excede limite | Reduza o tamanho do script |
| "Configure suas credenciais HeyGen em Configurações > Integrações" | Credenciais não configuradas | Configure credenciais primeiro |
| "Configure avatar e voz padrão em Configurações > Integrações" | Avatar/Voice padrão não configurados | Configure defaults ou informe IDs no request |
| "Aguarde a conclusão da geração do vídeo" | Tentou enviar vídeo não pronto para PostRápido | Aguarde status "completed" |

### 401 - Unauthorized

| Mensagem | Causa | Solução |
|----------|-------|---------|
| "Credenciais HeyGen inválidas. Verifique sua API Key em Configurações" | API Key inválida ou expirada | Verifique e atualize sua API Key no HeyGen |

### 402 - Payment Required

| Mensagem | Causa | Solução |
|----------|-------|---------|
| "Créditos HeyGen insuficientes. Recarregue sua conta em heygen.com" | Sem créditos HeyGen | Recarregue créditos na sua conta HeyGen |

### 403 - Forbidden

| Mensagem | Causa | Solução |
|----------|-------|---------|
| "Módulo AvatarAI disponível apenas no plano Pro" | Plano insuficiente | Faça upgrade para plano Pro |
| "Módulo PostRápido não disponível no seu plano" | Plano insuficiente | Faça upgrade para plano Pro |

### 404 - Not Found

| Mensagem | Causa | Solução |
|----------|-------|---------|
| "Vídeo não encontrado" | Job ID inválido ou vídeo de outra organização | Verifique o job_id retornado na geração |

### 429 - Too Many Requests

| Mensagem | Causa | Solução |
|----------|-------|---------|
| "Limite de requisições atingido. Aguarde alguns minutos e tente novamente" | Rate limit da API HeyGen | Aguarde alguns minutos antes de tentar novamente |

### 500 - Internal Server Error

| Mensagem | Causa | Solução |
|----------|-------|---------|
| "Serviço HeyGen temporariamente indisponível. Tente novamente em alguns minutos" | Erro no servidor HeyGen | Aguarde e tente novamente |
| "Erro ao gerar vídeo. Tente novamente" | Erro interno | Tente novamente ou contate suporte |

## Boas Práticas

### 1. Gerenciamento de Créditos

- Consulte créditos antes de gerar vídeos em lote
- Configure alertas quando créditos estiverem baixos
- Monitore consumo através dos logs de API

### 2. Polling de Status

- Aguarde pelo menos 10 segundos entre consultas de status
- Implemente backoff exponencial para evitar rate limiting
- Não faça polling contínuo - vídeos podem levar vários minutos

### 3. Tratamento de Erros

- Sempre verifique o campo `success` nas respostas
- Implemente retry com backoff para erros 429 e 500
- Não faça retry automático para erros 400, 401, 402, 403

### 4. Segurança

- Nunca exponha API Keys no frontend
- Sempre use HTTPS para todas as requisições
- Rotacione API Keys periodicamente

## Limitações

### HeyGen API

- **Rate Limit:** 100 requisições/minuto por API Key
- **Vídeos Simultâneos:** Máximo 10 vídeos em processamento
- **Tamanho do Script:** 1-5000 caracteres
- **Tempo de Geração:** 2-10 minutos dependendo da duração

### Plataforma RENUM

- **Plano Requerido:** Pro
- **Storage:** Vídeos armazenados no bucket `videos-raw` do Supabase
- **Formato:** MP4 (1920x1080 por padrão)

## Suporte

Para dúvidas ou problemas:

1. Consulte a [documentação oficial do HeyGen](https://docs.heygen.com)
2. Verifique os logs em `api_logs` para detalhes técnicos
3. Entre em contato com o suporte RENUM

## Changelog

### v1.0.0 (2024-01-15)
- ✅ Implementação inicial do módulo AvatarAI
- ✅ Integração com API HeyGen
- ✅ Endpoints de configuração e geração
- ✅ Upload automático para Supabase Storage
- ✅ Integração com PostRápido
