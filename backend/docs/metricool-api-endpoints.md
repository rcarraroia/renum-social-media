# Metricool API - Documentação de Endpoints

## Visão Geral

Esta documentação detalha todos os endpoints disponíveis no Metricool MCP (Model Context Protocol) para integração com o RENUM Social AI. O Metricool fornece funcionalidades de agendamento de posts, analytics, gerenciamento de contas sociais e campanhas publicitárias.

**Base URL**: A ser determinada pela configuração do MCP  
**Autenticação**: API Key via header ou configuração MCP  
**Formato de Resposta**: JSON

## Índice

1. [Gerenciamento de Brands](#gerenciamento-de-brands)
2. [Posts de Redes Sociais](#posts-de-redes-sociais)
3. [Agendamento](#agendamento)
4. [Competidores](#competidores)
5. [Campanhas Publicitárias](#campanhas-publicitárias)
6. [Analytics](#analytics)
7. [Configurações](#configurações)

---

## Gerenciamento de Brands

### GET /brands - Listar Brands

**Descrição**: Retorna lista de brands (marcas/contas) disponíveis na conta Metricool do usuário.

**Método HTTP**: `GET`

**Parâmetros**: Nenhum

**Resposta de Sucesso** (200):
```json
{
  "brands": [
    {
      "id": 12345,
      "name": "Minha Marca",
      "timezone": "America/Sao_Paulo",
      "networks": ["instagram", "tiktok", "facebook"]
    }
  ]
}
```


**Campos da Resposta**:
- `id` (integer): ID único do brand
- `name` (string): Nome do brand
- `timezone` (string): Timezone no formato IANA (ex: "America/Sao_Paulo", "Europe/Madrid")
- `networks` (array): Lista de redes sociais conectadas

**Exemplo de Uso**:
```python
brands = await metricool_service.get_brands()
blog_id = brands[0]["id"]
```

**Validação**: Requirements 1.3, 2.1

---

### GET /brands/complete - Listar Brands Completo

**Descrição**: Retorna lista detalhada de brands com informações completas sobre redes conectadas.

**Método HTTP**: `GET`

**Parâmetros**: Nenhum

**Resposta de Sucesso** (200):
```json
{
  "brands": [
    {
      "id": 12345,
      "name": "Minha Marca",
      "timezone": "America/Sao_Paulo",
      "networks": {
        "instagram": { "connected": true, "username": "@minhaconta" },
        "tiktok": { "connected": true, "username": "@minhaconta" },
        "facebook": { "connected": false },
        "x": { "connected": false },
        "linkedin": { "connected": false },
        "youtube": { "connected": false }
      }
    }
  ]
}
```

**Nota**: Apenas Instagram, Facebook, Twitch, YouTube, Twitter (X) e Bluesky suportam competidores.

**Validação**: Requirements 1.3, 3.1

---

## Posts de Redes Sociais


### GET /instagram/reels - Listar Instagram Reels

**Descrição**: Retorna lista de Reels publicados no Instagram.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "reels": [
    {
      "id": "post_123",
      "content": "Texto do reel",
      "url": "https://instagram.com/p/...",
      "published_at": "2024-01-15T10:00:00Z",
      "views": 1500,
      "likes": 120,
      "comments": 15,
      "shares": 8
    }
  ]
}
```

**Exemplo de Uso**:
```python
reels = await metricool_service.get_instagram_reels(
    blog_id=12345,
    init_date="2024-01-01",
    end_date="2024-01-31"
)
```

**Validação**: Requirements 1.3

---

### GET /instagram/posts - Listar Instagram Posts

**Descrição**: Retorna lista de posts publicados no Instagram (feed).

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "posts": [
    {
      "id": "post_456",
      "content": "Texto do post",
      "media_type": "image",
      "url": "https://instagram.com/p/...",
      "published_at": "2024-01-15T14:00:00Z",
      "likes": 250,
      "comments": 30,
      "saves": 45
    }
  ]
}
```

**Validação**: Requirements 1.3

---

### GET /instagram/stories - Listar Instagram Stories

**Descrição**: Retorna lista de stories publicados no Instagram.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "stories": [
    {
      "id": "story_789",
      "media_type": "video",
      "url": "https://instagram.com/stories/...",
      "published_at": "2024-01-15T18:00:00Z",
      "views": 800,
      "replies": 12,
      "exits": 5
    }
  ]
}
```

**Validação**: Requirements 1.3

---


### GET /tiktok/videos - Listar TikTok Videos

**Descrição**: Retorna lista de vídeos publicados no TikTok.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "videos": [
    {
      "id": "video_123",
      "content": "Descrição do vídeo",
      "url": "https://tiktok.com/@user/video/...",
      "published_at": "2024-01-15T12:00:00Z",
      "views": 5000,
      "likes": 450,
      "comments": 80,
      "shares": 120
    }
  ]
}
```

**Validação**: Requirements 1.3

---

### GET /facebook/reels - Listar Facebook Reels

**Descrição**: Retorna lista de Reels publicados no Facebook.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Validação**: Requirements 1.3

---

### GET /facebook/posts - Listar Facebook Posts

**Descrição**: Retorna lista de posts publicados no Facebook.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Validação**: Requirements 1.3

---

### GET /facebook/stories - Listar Facebook Stories

**Descrição**: Retorna lista de stories publicados no Facebook.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Validação**: Requirements 1.3

---

### GET /threads/posts - Listar Threads Posts

**Descrição**: Retorna lista de posts publicados no Threads.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Validação**: Requirements 1.3

---


### GET /x/posts - Listar Posts do X (Twitter)

**Descrição**: Retorna lista de posts publicados no X (antigo Twitter).

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYYMMDD`
- `end_date` (string, obrigatório): Data final no formato `YYYYMMDD`
- `blog_id` (integer, obrigatório): ID do brand

**Nota**: O formato de data para X é diferente (sem hífens): `YYYYMMDD`

**Resposta de Sucesso** (200):
```json
{
  "posts": [
    {
      "id": "tweet_123",
      "content": "Texto do tweet",
      "url": "https://x.com/user/status/...",
      "published_at": "2024-01-15T16:00:00Z",
      "impressions": 3000,
      "likes": 150,
      "retweets": 45,
      "replies": 20
    }
  ]
}
```

**Validação**: Requirements 1.3

---

### GET /bluesky/posts - Listar Posts do Bluesky

**Descrição**: Retorna lista de posts publicados no Bluesky.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Validação**: Requirements 1.3

---

### GET /linkedin/posts - Listar Posts do LinkedIn

**Descrição**: Retorna lista de posts publicados no LinkedIn.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "posts": [
    {
      "id": "post_linkedin_123",
      "content": "Texto do post profissional",
      "url": "https://linkedin.com/feed/update/...",
      "published_at": "2024-01-15T09:00:00Z",
      "impressions": 2500,
      "likes": 180,
      "comments": 35,
      "shares": 22
    }
  ]
}
```

**Validação**: Requirements 1.3

---

### GET /pinterest/pins - Listar Pins do Pinterest

**Descrição**: Retorna lista de pins publicados no Pinterest.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Validação**: Requirements 1.3

---

### GET /youtube/videos - Listar Vídeos do YouTube

**Descrição**: Retorna lista de vídeos publicados no YouTube.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "videos": [
    {
      "id": "video_yt_123",
      "title": "Título do vídeo",
      "url": "https://youtube.com/watch?v=...",
      "published_at": "2024-01-15T11:00:00Z",
      "views": 10000,
      "likes": 850,
      "comments": 120,
      "duration": 600
    }
  ]
}
```

**Validação**: Requirements 1.3

---

### GET /twitch/videos - Listar Vídeos do Twitch

**Descrição**: Retorna lista de vídeos publicados no Twitch.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYYMMDD`
- `end_date` (string, obrigatório): Data final no formato `YYYYMMDD`
- `blog_id` (integer, obrigatório): ID do brand

**Nota**: O formato de data para Twitch é diferente (sem hífens): `YYYYMMDD`

**Validação**: Requirements 1.3

---


## Agendamento

### POST /schedule/post - Agendar Post

**Descrição**: Agenda um novo post para publicação em uma ou mais redes sociais.

**Método HTTP**: `POST`

**Parâmetros do Body**:
- `date` (string, obrigatório): Data e hora de publicação no formato `YYYY-MM-DDTHH:MM:SS`
- `blog_id` (integer, obrigatório): ID do brand
- `info` (object, obrigatório): Objeto com detalhes do post

**Estrutura do objeto `info`**:
```json
{
  "autoPublish": true,
  "descendants": [],
  "draft": false,
  "firstCommentText": "",
  "hasNotReadNotes": false,
  "media": [],
  "mediaAltText": [],
  "providers": [
    { "network": "instagram" }
  ],
  "publicationDate": {
    "dateTime": "2024-01-15T10:00:00",
    "timezone": "America/Sao_Paulo"
  },
  "shortener": false,
  "smartLinkData": { "ids": [] },
  "text": "Conteúdo do post",
  "instagramData": {
    "type": "POST",
    "collaborators": [],
    "carouselTags": {},
    "showReelOnFeed": true
  },
  "twitterData": {
    "tags": []
  },
  "facebookData": {
    "type": "POST",
    "title": "",
    "boost": 0,
    "boostPayer": "",
    "boostBeneficiary": ""
  },
  "linkedinData": {
    "documentTitle": "",
    "publishImagesAsPDF": false,
    "previewIncluded": true,
    "type": "post"
  },
  "pinterestData": {
    "boardId": "",
    "pinTitle": "",
    "pinLink": "",
    "pinNewFormat": false
  },
  "youtubeData": {
    "title": "",
    "type": "video",
    "privacy": "public",
    "tags": [],
    "madeForKids": false
  },
  "tiktokData": {
    "disableComment": false,
    "disableDuet": false,
    "disableStitch": false,
    "privacyOption": "PUBLIC_TO_EVERYONE",
    "commercialContentThirdParty": false,
    "commercialContentOwnBrand": false,
    "title": "",
    "autoAddMusic": false,
    "photoCoverIndex": 0
  },
  "blueskyData": {
    "postLanguages": ["pt", "en"]
  },
  "threadsData": {
    "allowedCountryCodes": ["BR", "US"]
  }
}
```

**Resposta de Sucesso** (200):
```json
{
  "id": "scheduled_post_123",
  "status": "scheduled",
  "scheduled_at": "2024-01-15T10:00:00Z",
  "platforms": ["instagram"]
}
```

**Regras Importantes**:
- **Instagram**: Requer pelo menos uma imagem ou vídeo. Posts devem ter imagem/carrossel, Reels devem ter vídeo, Stories podem ter imagem ou vídeo
- **Pinterest**: Requer imagem e `boardId` (ID do board onde publicar)
- **YouTube**: Requer vídeo, título e `madeForKids` (boolean)
- **TikTok**: Requer pelo menos uma imagem ou vídeo
- **Facebook Reel**: Requer vídeo. Facebook Story requer imagem ou vídeo
- **Bluesky**: Limite de 300 caracteres no texto
- **X (Twitter)**: Limite de 280 caracteres no texto

**Validação**: Requirements 1.3, 2.2

---

### GET /schedule/posts - Listar Posts Agendados

**Descrição**: Retorna lista de posts agendados (não publicados ainda).

**Método HTTP**: `GET`

**Parâmetros**:
- `blog_id` (integer, obrigatório): ID do brand
- `start` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `timezone` (string, obrigatório): Timezone no formato URL-encoded (ex: `America%2FSao_Paulo`)
- `extendedRange` (boolean, opcional): Se `true`, expande busca 1 dia antes e depois. Padrão: `false`

**Resposta de Sucesso** (200):
```json
{
  "posts": [
    {
      "id": "scheduled_123",
      "uuid": "abc-def-ghi",
      "content": "Texto do post",
      "platforms": ["instagram", "tiktok"],
      "scheduled_at": "2024-01-15T10:00:00Z",
      "status": "scheduled",
      "media": [
        {
          "url": "https://...",
          "type": "image"
        }
      ]
    }
  ]
}
```

**Validação**: Requirements 1.3, 2.3

---


### PUT /schedule/post - Atualizar Post Agendado

**Descrição**: Atualiza um post agendado existente (reagendamento, alteração de conteúdo, etc).

**Método HTTP**: `PUT`

**Parâmetros**:
- `id` (string, obrigatório): ID do post a ser atualizado
- `date` (string, obrigatório): Nova data/hora no formato `YYYY-MM-DDTHH:MM:SS`
- `blog_id` (integer, obrigatório): ID do brand
- `info` (object, obrigatório): Objeto completo do post (mesma estrutura do POST)

**Campos Obrigatórios no `info`**:
- `id` (integer): ID do post
- `uuid` (string): UUID do post (obtido do GET /schedule/posts)
- Todos os demais campos do post original devem ser mantidos

**Resposta de Sucesso** (200):
```json
{
  "id": "scheduled_123",
  "status": "updated",
  "scheduled_at": "2024-01-20T14:00:00Z"
}
```

**Importante**: 
- Deve incluir o conteúdo completo original, modificando apenas os campos desejados
- A data não pode ser no passado
- Requer confirmação do usuário antes de executar

**Validação**: Requirements 1.3, 2.4

---

### GET /best-time-to-post - Melhor Horário para Publicar

**Descrição**: Retorna sugestões de melhores horários para publicar baseado em histórico de engajamento.

**Método HTTP**: `GET`

**Parâmetros**:
- `start` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand
- `provider` (string, obrigatório): Rede social (`twitter`, `facebook`, `instagram`, `linkedin`, `youtube`, `tiktok`)
- `timezone` (string, obrigatório): Timezone no formato URL-encoded (ex: `America%2FSao_Paulo`)

**Resposta de Sucesso** (200):
```json
{
  "best_times": [
    {
      "day": "monday",
      "hour": 10,
      "score": 0.95
    },
    {
      "day": "wednesday",
      "hour": 14,
      "score": 0.88
    }
  ]
}
```

**Campos da Resposta**:
- `day` (string): Dia da semana
- `hour` (integer): Hora do dia (0-23)
- `score` (float): Pontuação de engajamento (0-1, quanto maior melhor)

**Recomendação**: Buscar período máximo de 1 semana para resultados mais precisos.

**Validação**: Requirements 1.3, 2.10

---

### GET /pinterest/boards - Listar Boards do Pinterest

**Descrição**: Retorna lista de boards (painéis) disponíveis no Pinterest para um brand específico.

**Método HTTP**: `GET`

**Parâmetros**:
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "boards": [
    {
      "id": "board_123",
      "name": "Inspirações",
      "url": "https://pinterest.com/user/inspiracoes/",
      "pin_count": 45
    }
  ]
}
```

**Uso**: Necessário para obter `boardId` ao agendar pins no Pinterest.

**Validação**: Requirements 1.3

---

## Competidores

### GET /competitors - Listar Competidores

**Descrição**: Retorna lista de competidores configurados para uma rede social específica.

**Método HTTP**: `GET`

**Parâmetros**:
- `network` (string, obrigatório): Rede social (`twitter`, `facebook`, `instagram`, `youtube`, `twitch`, `bluesky`)
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand
- `limit` (integer, opcional): Limite de competidores. Padrão: `10`
- `timezone` (string, obrigatório): Timezone no formato URL-encoded

**Resposta de Sucesso** (200):
```json
{
  "competitors": [
    {
      "id": "comp_123",
      "username": "@concorrente",
      "followers": 50000,
      "engagement_rate": 0.045,
      "posts_count": 120
    }
  ]
}
```

**Nota**: Apenas Instagram, Facebook, Twitch, YouTube, Twitter (X) e Bluesky suportam análise de competidores.

**Validação**: Requirements 1.3

---


### GET /competitors/posts - Listar Posts de Competidores

**Descrição**: Retorna lista de posts publicados pelos competidores configurados.

**Método HTTP**: `GET`

**Parâmetros**:
- `network` (string, obrigatório): Rede social (`twitter`, `facebook`, `instagram`, `youtube`, `twitch`, `bluesky`)
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand
- `limit` (integer, opcional): Limite de posts. Padrão: `50`
- `timezone` (string, obrigatório): Timezone no formato URL-encoded

**Resposta de Sucesso** (200):
```json
{
  "posts": [
    {
      "id": "comp_post_123",
      "competitor_username": "@concorrente",
      "content": "Texto do post do concorrente",
      "published_at": "2024-01-15T12:00:00Z",
      "likes": 500,
      "comments": 80,
      "shares": 45,
      "url": "https://..."
    }
  ],
  "insights": "Análise automática: Seus competidores estão postando mais sobre tendências X e Y."
}
```

**Uso**: Útil para análise de estratégia de conteúdo da concorrência.

**Validação**: Requirements 1.3

---

## Campanhas Publicitárias

### GET /facebookads/campaigns - Listar Campanhas do Facebook Ads

**Descrição**: Retorna lista de campanhas publicitárias do Facebook Ads.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYYMMDD`
- `end_date` (string, obrigatório): Data final no formato `YYYYMMDD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "campaigns": [
    {
      "id": "campaign_fb_123",
      "name": "Campanha de Verão",
      "status": "active",
      "budget": 500.00,
      "spent": 320.50,
      "impressions": 15000,
      "clicks": 450,
      "conversions": 25
    }
  ]
}
```

**Validação**: Requirements 1.3

---

### GET /googleads/campaigns - Listar Campanhas do Google Ads

**Descrição**: Retorna lista de campanhas publicitárias do Google Ads.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYYMMDD`
- `end_date` (string, obrigatório): Data final no formato `YYYYMMDD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "campaigns": [
    {
      "id": "campaign_google_123",
      "name": "Campanha Search",
      "status": "active",
      "budget": 1000.00,
      "spent": 780.00,
      "impressions": 25000,
      "clicks": 890,
      "ctr": 0.0356
    }
  ]
}
```

**Validação**: Requirements 1.3

---

### GET /tiktokads/campaigns - Listar Campanhas do TikTok Ads

**Descrição**: Retorna lista de campanhas publicitárias do TikTok Ads.

**Método HTTP**: `GET`

**Parâmetros**:
- `init_date` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end_date` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `blog_id` (integer, obrigatório): ID do brand

**Resposta de Sucesso** (200):
```json
{
  "campaigns": [
    {
      "id": "campaign_tiktok_123",
      "name": "Campanha Viral",
      "status": "active",
      "budget": 300.00,
      "spent": 245.00,
      "impressions": 50000,
      "clicks": 1200,
      "video_views": 8500
    }
  ]
}
```

**Validação**: Requirements 1.3

---


## Analytics

### GET /analytics - Obter Métricas de Analytics

**Descrição**: Retorna métricas de analytics para uma rede social específica em um período.

**Método HTTP**: `GET`

**Parâmetros**:
- `blog_id` (integer, obrigatório): ID do brand
- `start` (string, obrigatório): Data inicial no formato `YYYY-MM-DD`
- `end` (string, obrigatório): Data final no formato `YYYY-MM-DD`
- `timezone` (string, obrigatório): Timezone no formato URL-encoded
- `network` (string, obrigatório): Rede social (`facebook`, `instagram`, `linkedin`, `youtube`, `tiktok`, etc)
- `metric` (array, obrigatório): Lista de métricas desejadas

**Métricas Disponíveis por Rede**:

**Instagram**:
- `followers` - Total de seguidores
- `engagement_rate` - Taxa de engajamento
- `impressions` - Impressões totais
- `reach` - Alcance total
- `profile_views` - Visualizações do perfil
- `website_clicks` - Cliques no site

**Facebook**:
- `page_likes` - Curtidas na página
- `post_engagement` - Engajamento em posts
- `page_impressions` - Impressões da página
- `page_reach` - Alcance da página

**LinkedIn**:
- `followers` - Seguidores
- `impressions` - Impressões
- `engagement_rate` - Taxa de engajamento
- `clicks` - Cliques

**YouTube**:
- `subscribers` - Inscritos
- `views` - Visualizações
- `watch_time` - Tempo de visualização (minutos)
- `likes` - Curtidas
- `comments` - Comentários

**TikTok**:
- `followers` - Seguidores
- `video_views` - Visualizações de vídeos
- `likes` - Curtidas
- `comments` - Comentários
- `shares` - Compartilhamentos

**Resposta de Sucesso** (200):
```json
{
  "metrics": {
    "followers": 15420,
    "engagement_rate": 0.045,
    "impressions": 125000,
    "reach": 98000
  },
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

**Exemplo de Uso**:
```python
analytics = await metricool_service.get_analytics(
    blog_id=12345,
    start="2024-01-01",
    end="2024-01-31",
    timezone="America%2FSao_Paulo",
    network="instagram",
    metric=["followers", "engagement_rate", "impressions"]
)
```

**Validação**: Requirements 1.3, 2.9

---

### GET /metrics - Listar Métricas Disponíveis

**Descrição**: Retorna lista de métricas disponíveis para uma rede social específica.

**Método HTTP**: `GET`

**Parâmetros**:
- `network` (string, obrigatório): Rede social

**Resposta de Sucesso** (200):
```json
{
  "network": "instagram",
  "available_metrics": [
    {
      "key": "followers",
      "name": "Seguidores",
      "description": "Total de seguidores da conta"
    },
    {
      "key": "engagement_rate",
      "name": "Taxa de Engajamento",
      "description": "Percentual de engajamento nos posts"
    }
  ]
}
```

**Uso**: Útil para descobrir quais métricas podem ser solicitadas no endpoint `/analytics`.

**Validação**: Requirements 1.3

---

## Configurações

### POST /metricool/test - Testar Conexão

**Descrição**: Testa a conexão com a API do Metricool usando as credenciais configuradas.

**Método HTTP**: `POST`

**Parâmetros**: Nenhum (usa credenciais configuradas no MCP)

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "message": "Conexão com Metricool estabelecida com sucesso"
}
```

**Resposta de Erro** (401):
```json
{
  "success": false,
  "message": "Credenciais inválidas ou expiradas"
}
```

**Validação**: Requirements 1.4

---

### GET /metricool/status - Status da Conexão

**Descrição**: Retorna status atual da conexão com Metricool e informações do brand conectado.

**Método HTTP**: `GET`

**Parâmetros**: Nenhum

**Resposta de Sucesso** (200):
```json
{
  "connected": true,
  "blog_id": 12345,
  "brand_name": "Minha Marca",
  "connected_networks": ["instagram", "tiktok", "facebook"]
}
```

**Validação**: Requirements 1.4

---


## Modelo de Autenticação

### Autenticação via API Key

O Metricool MCP utiliza autenticação via **API Key** (Access Token), não OAuth.

**Configuração**:
1. Obter Access Token no painel do Metricool (conta Advanced necessária - $45/mês)
2. Configurar variável de ambiente: `METRICOOL_ACCESS_TOKEN`
3. O MCP gerencia automaticamente a autenticação nas requisições

**Importante**: 
- O Access Token é configurado uma vez e reutilizado
- Não há necessidade de refresh tokens
- O token é válido enquanto a conta Metricool estiver ativa

**Validação**: Requirements 1.4

---

## OAuth de Redes Sociais

### Fluxo de Conexão de Redes Sociais

O Metricool gerencia o OAuth das redes sociais internamente. O fluxo funciona assim:

1. **Iniciar Conexão**: Chamar endpoint do Metricool para iniciar OAuth
2. **Autorização**: Usuário é redirecionado para página de autorização da rede social
3. **Callback**: Rede social redireciona para callback do Metricool
4. **Armazenamento**: Metricool armazena credenciais OAuth internamente
5. **Verificação**: Sistema consulta status de conexão via API

**Endpoints Relacionados** (a serem implementados no backend RENUM):
- `POST /api/integrations/social-accounts/connect` - Inicia OAuth
- `GET /api/integrations/social-accounts` - Lista status de conexões
- `DELETE /api/integrations/social-accounts/{platform}` - Desconecta conta

**Nota**: O Metricool MCP não expõe diretamente endpoints de OAuth. A integração OAuth deve ser feita através da interface web do Metricool ou via API específica (a ser descoberta).

**Validação**: Requirements 1.3, 3.2, 3.4

---

## Estrutura de Dados Comum

### Formato de Datas

O Metricool utiliza diferentes formatos de data dependendo do endpoint:

- **Padrão**: `YYYY-MM-DD` (ex: `2024-01-15`)
- **Com Hora**: `YYYY-MM-DDTHH:MM:SS` (ex: `2024-01-15T10:00:00`)
- **X e Twitch**: `YYYYMMDD` (sem hífens, ex: `20240115`)

### Timezone

Sempre fornecer timezone no formato IANA URL-encoded:
- `America/Sao_Paulo` → `America%2FSao_Paulo`
- `Europe/Madrid` → `Europe%2FMadrid`
- `America/New_York` → `America%2FNew_York`

### IDs

- **blog_id**: ID numérico do brand (ex: `12345`)
- **post_id**: ID string do post agendado (ex: `"scheduled_123"`)
- **uuid**: UUID do post (ex: `"abc-def-ghi-jkl"`)

### Status de Posts

- `scheduled` - Agendado, aguardando publicação
- `published` - Publicado com sucesso
- `failed` - Falha na publicação
- `cancelled` - Cancelado pelo usuário

---

## Limites e Restrições

### Rate Limits

O Metricool impõe limites de requisições:
- **Padrão**: 100 requisições por minuto
- **Burst**: 20 requisições por segundo

**Tratamento**: Implementar retry com backoff exponencial quando receber erro 429.

### Limites de Conteúdo

- **Bluesky**: Máximo 300 caracteres
- **X (Twitter)**: Máximo 280 caracteres
- **Instagram Caption**: Máximo 2.200 caracteres
- **LinkedIn**: Máximo 3.000 caracteres

### Requisitos de Mídia

- **Instagram Post**: Requer pelo menos 1 imagem
- **Instagram Reel**: Requer 1 vídeo
- **TikTok**: Requer 1 vídeo
- **Pinterest**: Requer 1 imagem + boardId
- **YouTube**: Requer 1 vídeo + título

---

## Códigos de Erro

### Erros HTTP Comuns

- **400 Bad Request**: Parâmetros inválidos ou faltando
- **401 Unauthorized**: Access Token inválido ou expirado
- **403 Forbidden**: Sem permissão para acessar recurso
- **404 Not Found**: Recurso não encontrado (post, brand, etc)
- **422 Unprocessable Entity**: Dados de entrada inválidos
- **429 Too Many Requests**: Rate limit atingido
- **500 Internal Server Error**: Erro no servidor Metricool
- **502 Bad Gateway**: Metricool API indisponível

### Mensagens de Erro

```json
{
  "error": {
    "code": "INVALID_BLOG_ID",
    "message": "O blog_id fornecido não existe ou você não tem acesso",
    "details": {
      "blog_id": 99999
    }
  }
}
```

---

## Exemplos de Integração

### Exemplo 1: Listar Brands e Agendar Post

```python
# 1. Listar brands disponíveis
brands = await metricool_service.get_brands()
blog_id = brands[0]["id"]
timezone = brands[0]["timezone"]

# 2. Agendar post no Instagram
post_data = {
    "date": "2024-01-15T10:00:00",
    "blog_id": blog_id,
    "info": {
        "autoPublish": True,
        "text": "Novo post incrível! 🚀",
        "providers": [{"network": "instagram"}],
        "publicationDate": {
            "dateTime": "2024-01-15T10:00:00",
            "timezone": timezone
        },
        "media": ["https://example.com/image.jpg"],
        "instagramData": {
            "type": "POST",
            "showReelOnFeed": True
        }
    }
}

result = await metricool_service.schedule_post(post_data)
print(f"Post agendado com ID: {result['id']}")
```

### Exemplo 2: Obter Analytics do Instagram

```python
# Obter métricas do Instagram do último mês
analytics = await metricool_service.get_analytics(
    blog_id=12345,
    start="2024-01-01",
    end="2024-01-31",
    timezone="America%2FSao_Paulo",
    network="instagram",
    metric=["followers", "engagement_rate", "impressions", "reach"]
)

print(f"Seguidores: {analytics['metrics']['followers']}")
print(f"Taxa de Engajamento: {analytics['metrics']['engagement_rate']:.2%}")
```

### Exemplo 3: Listar Posts Agendados

```python
# Listar posts agendados para os próximos 7 dias
from datetime import datetime, timedelta

today = datetime.now()
next_week = today + timedelta(days=7)

scheduled = await metricool_service.get_scheduled_posts(
    blog_id=12345,
    start=today.strftime("%Y-%m-%d"),
    end=next_week.strftime("%Y-%m-%d"),
    timezone="America%2FSao_Paulo",
    extendedRange=False
)

for post in scheduled["posts"]:
    print(f"{post['scheduled_at']}: {post['content'][:50]}...")
```

---

## Conclusão

Esta documentação cobre todos os endpoints disponíveis no Metricool MCP identificados através das ferramentas MCP disponíveis no sistema. 

**Próximos Passos**:
1. Implementar `MetricoolService` no backend usando estes endpoints
2. Criar modelos Pydantic para validação de dados
3. Implementar routers FastAPI para expor funcionalidades ao frontend
4. Adicionar testes unitários e property-based tests

**Validação Completa**: Requirements 1.1, 1.2, 1.3, 1.4, 1.5 ✅

---

**Documento gerado em**: 2024  
**Versão**: 1.0  
**Autor**: RENUM Social AI Team
