# Metricool MCP Tools - Documentação

Esta documentação lista todas as ferramentas MCP disponíveis para integração com Metricool.

## Ferramentas Disponíveis

### Gestão de Marcas (Brands)

#### `mcp_metricool_get_brands`
Obtém a lista de marcas (brands) da conta Metricool.

**Parâmetros:** Nenhum

**Retorno:**
```json
{
  "brands": [
    {
      "id": 123456,
      "name": "Minha Marca",
      "timezone": "Europe/Madrid",
      "networks": [...]
    }
  ]
}
```

#### `mcp_metricool_get_brands_complete`
Obtém a lista completa de marcas com informações detalhadas.
Nota: Apenas Instagram, Facebook, Twitch, YouTube, Twitter e Bluesky suportam competidores.

**Parâmetros:** Nenhum

### Posts por Plataforma

#### `mcp_metricool_get_instagram_reels`
Obtém lista de Instagram Reels.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_instagram_posts`
Obtém lista de Instagram Posts.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_instagram_stories`
Obtém lista de Instagram Stories.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_tiktok_videos`
Obtém lista de TikTok Videos.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_facebook_reels`
Obtém lista de Facebook Reels.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_facebook_posts`
Obtém lista de Facebook Posts.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_facebook_stories`
Obtém lista de Facebook Stories.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_thread_posts`
Obtém lista de Threads Posts.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_x_posts`
Obtém lista de X (Twitter) Posts.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYYMMDD) - Formato diferente!
- `end_date` (string): Data final (YYYYMMDD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_bluesky_posts`
Obtém lista de Bluesky Posts.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_linkedin_posts`
Obtém lista de LinkedIn Posts.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_pinterest_pins`
Obtém lista de Pinterest Pins.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_youtube_videos`
Obtém lista de YouTube Videos.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_twitch_videos`
Obtém lista de Twitch Videos.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYYMMDD) - Formato diferente!
- `end_date` (string): Data final (YYYYMMDD)
- `blog_id` (integer): ID da marca no Metricool

### Campanhas de Anúncios

#### `mcp_metricool_get_facebookads_campaigns`
Obtém lista de campanhas do Facebook Ads.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYYMMDD)
- `end_date` (string): Data final (YYYYMMDD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_googleads_campaigns`
Obtém lista de campanhas do Google Ads.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYYMMDD)
- `end_date` (string): Data final (YYYYMMDD)
- `blog_id` (integer): ID da marca no Metricool

#### `mcp_metricool_get_tiktokads_campaigns`
Obtém lista de campanhas do TikTok Ads.

**Parâmetros:**
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool

### Competidores

#### `mcp_metricool_get_network_competitors`
Obtém lista de competidores de uma rede social.

**Parâmetros:**
- `network` (string): Rede social (twitter, facebook, instagram, youtube, twitch, bluesky)
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool
- `limit` (integer): Limite de competidores (padrão: 10)
- `timezone` (string): Timezone (formato: Europe%2FMadrid)

#### `mcp_metricool_get_network_competitors_posts`
Obtém posts dos competidores.

**Parâmetros:**
- `network` (string): Rede social (twitter, facebook, instagram, youtube, twitch, bluesky)
- `init_date` (string): Data inicial (YYYY-MM-DD)
- `end_date` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool
- `limit` (integer): Limite de posts (padrão: 50)
- `timezone` (string): Timezone (formato: Europe%2FMadrid)

### Pinterest

#### `mcp_metricool_get_pinterest_boards`
Obtém lista de boards do Pinterest para uma marca específica.

**Parâmetros:**
- `blog_id` (integer): ID da marca no Metricool

### Agendamento de Posts

#### `mcp_metricool_post_schedule_post`
Agenda um post no Metricool.

**IMPORTANTE:** Este é o método principal para agendamento!

**Parâmetros:**
- `date` (string): Data e hora de publicação (YYYY-MM-DDTHH:MM:SS)
- `blog_id` (integer): ID da marca no Metricool
- `info` (object): Dados do post

**Estrutura do `info`:**
```json
{
  "autoPublish": true,
  "descendants": [],
  "draft": false,
  "firstCommentText": "",
  "hasNotReadNotes": false,
  "media": ["url_do_video"],
  "mediaAltText": [],
  "providers": [{"network": "instagram"}],
  "publicationDate": {
    "dateTime": "2026-02-20T18:00:00",
    "timezone": "Europe/Madrid"
  },
  "shortener": false,
  "smartLinkData": {"ids": []},
  "text": "Texto do post",
  
  // Network-specific data
  "instagramData": {
    "type": "REEL",  // POST, REEL, STORY
    "collaborators": [],
    "carouselTags": {},
    "showReelOnFeed": true
  },
  "facebookData": {
    "type": "REEL",  // POST, REEL, STORY
    "title": "",
    "boost": 0,
    "boostPayer": "",
    "boostBeneficiary": ""
  },
  "twitterData": {
    "tags": []
  },
  "linkedinData": {
    "documentTitle": "",
    "publishImagesAsPDF": false,
    "previewIncluded": true,
    "type": "post"
  },
  "pinterestData": {
    "boardId": "board_id",
    "pinTitle": "Título",
    "pinLink": "https://...",
    "pinNewFormat": true
  },
  "youtubeData": {
    "title": "Título do vídeo",
    "type": "video",  // video, short
    "privacy": "public",  // public, unlisted, private
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
    "title": "Título",
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

**Limites de Caracteres:**
- Bluesky: 300 caracteres
- X (Twitter): 280 caracteres
- Instagram: 2200 caracteres
- TikTok: 2200 caracteres
- Facebook: 2200 caracteres
- LinkedIn: 3000 caracteres
- YouTube: 5000 caracteres

#### `mcp_metricool_get_scheduled_posts`
Obtém lista de posts agendados.

**Parâmetros:**
- `blog_id` (integer): ID da marca no Metricool
- `start` (string): Data inicial (YYYY-MM-DD)
- `end` (string): Data final (YYYY-MM-DD)
- `timezone` (string): Timezone (formato: Europe%2FMadrid)
- `extendedRange` (boolean): Expandir busca em 1 dia antes/depois (padrão: false)

#### `mcp_metricool_update_schedule_post`
Atualiza um post agendado.

**IMPORTANTE:** Requer confirmação do usuário antes de modificar!

**Parâmetros:**
- `id` (string): ID do post a atualizar
- `date` (string): Nova data de publicação (YYYY-MM-DDTHH:MM:SS)
- `blog_id` (integer): ID da marca no Metricool
- `info` (object): Dados completos do post (mesma estrutura do schedule_post)

**Nota:** Deve incluir `id` e `uuid` do post original no `info`.

### Melhor Horário para Postar

#### `mcp_metricool_get_best_time_to_post`
Obtém os melhores horários para postar em uma plataforma.

**Parâmetros:**
- `start` (string): Data inicial (YYYY-MM-DD)
- `end` (string): Data final (YYYY-MM-DD)
- `blog_id` (integer): ID da marca no Metricool
- `provider` (string): Plataforma (twitter, facebook, instagram, linkedin, youtube, tiktok)
- `timezone` (string): Timezone (formato: Europe%2FMadrid)

**Retorno:**
```json
{
  "bestTimes": [
    {
      "day": "monday",
      "hour": 18,
      "value": 0.95
    }
  ]
}
```

Quanto maior o `value`, melhor o horário.

### Analytics

#### `mcp_metricool_get_metrics`
Obtém métricas disponíveis para uma rede social.

**Parâmetros:**
- `network` (string): Nome da rede social

#### `mcp_metricool_get_analytics`
Obtém dados analíticos de uma marca.

**Parâmetros:**
- `blog_id` (integer): ID da marca no Metricool
- `start` (string): Data inicial (YYYY-MM-DD)
- `end` (string): Data final (YYYY-MM-DD)
- `timezone` (string): Timezone (formato: Europe%2FMadrid)
- `network` (string): Rede social
- `metric` (array): Lista de métricas

## Configuração

As ferramentas MCP do Metricool requerem as seguintes variáveis de ambiente:

```env
METRICOOL_USER_TOKEN=your_token_here
METRICOOL_USER_ID=your_user_id_here
```

Essas credenciais são armazenadas na tabela `organizations` e passadas para o MetricoolService.

## Uso no MetricoolService

O MetricoolService deve:
1. Receber `user_token` e `user_id` no construtor
2. Usar as ferramentas MCP via chamadas diretas (não subprocess)
3. Abstrair a complexidade das ferramentas MCP
4. Fornecer métodos simples para os endpoints

## Notas Importantes

1. **Formatos de Data:**
   - Maioria: `YYYY-MM-DD`
   - X e Twitch: `YYYYMMDD`
   - Agendamento: `YYYY-MM-DDTHH:MM:SS`

2. **Timezone:**
   - Formato: `Europe%2FMadrid` (URL encoded)
   - Extrair do brand via `get_brands`

3. **Network Names:**
   - Use nomes em minúsculas
   - X é referenciado como "twitter" no Metricool

4. **Validações:**
   - Bluesky: máximo 300 caracteres
   - X: máximo 280 caracteres
   - Não dividir em threads automaticamente

5. **Mídia:**
   - Instagram: obrigatório para REEL
   - TikTok: obrigatório
   - YouTube: obrigatório
   - Pinterest: obrigatório + board_id
