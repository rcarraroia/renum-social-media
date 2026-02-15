# MetricoolService - Ajustes Implementados

## Data: 14 de Fevereiro de 2026

## Resumo das Mudanças

O MetricoolService foi ajustado conforme solicitado para corrigir a arquitetura e adicionar funcionalidades necessárias.

## 1. Credenciais a Nível de Sistema ✅

### Antes:
```python
class MetricoolService:
    def __init__(self, organization_id: str, user_token: str = None, user_id: str = None):
        self.organization_id = organization_id
        self.user_token = user_token
        self.user_id = user_id
```

### Depois:
```python
class MetricoolService:
    def __init__(self):
        self.user_token = settings.metricool_user_token
        self.user_id = settings.metricool_user_id
```

### Mudanças:
- Credenciais carregadas do `config.py` (variáveis de ambiente)
- `METRICOOL_USER_TOKEN` e `METRICOOL_USER_ID` no `.env`
- Cada organização identificada pelo `blogId` (marca no Metricool)
- Métodos recebem `blog_id` como parâmetro

### Atualização no config.py:
```python
# Metricool (system-level credentials)
metricool_user_token: str | None = Field(None, env="METRICOOL_USER_TOKEN")
metricool_user_id: str | None = Field(None, env="METRICOOL_USER_ID")
```

## 2. Novos Métodos Adicionados ✅

### cancel_scheduled_post()
```python
async def cancel_scheduled_post(self, blog_id: int, post_id: str) -> bool:
    """
    Cancela um post agendado
    
    Endpoint: DELETE /posts/{post_id}
    
    Args:
        blog_id: ID da marca no Metricool
        post_id: ID do post a cancelar
    
    Returns:
        True se cancelado com sucesso, False caso contrário
    """
```

**Uso:**
```python
metricool = MetricoolService()
success = await metricool.cancel_scheduled_post(blog_id=123456, post_id="abc-123")
```

### update_scheduled_post()
```python
async def update_scheduled_post(
    self,
    blog_id: int,
    post_id: str,
    platform: str,
    text: str,
    media_url: Optional[str] = None,
    scheduled_at: str = None,
    timezone: str = "UTC",
    **kwargs
) -> Dict[str, Any]:
    """
    Atualiza um post agendado
    
    Endpoint: PUT /posts/{post_id}
    
    IMPORTANTE: Requer confirmação do usuário antes de modificar!
    """
```

**Uso:**
```python
metricool = MetricoolService()
result = await metricool.update_scheduled_post(
    blog_id=123456,
    post_id="abc-123",
    platform="instagram",
    text="Novo texto atualizado",
    scheduled_at="2026-02-20T18:00:00"
)
```

**Características:**
- Busca o post atual para obter `uuid` e outros dados
- Mantém estrutura original do post
- Valida comprimento do texto por plataforma
- Atualiza apenas campos fornecidos

## 3. Assinatura dos Métodos Atualizada ✅

### get_connected_accounts()
**Antes:** `async def get_connected_accounts(self, blog_id: Optional[int] = None)`  
**Depois:** `async def get_connected_accounts(self, blog_id: int)`

Agora requer `blog_id` obrigatório e retorna apenas as contas conectadas para aquela marca específica.

### Todos os métodos agora recebem blog_id:
- `schedule_post(blog_id, ...)`
- `get_scheduled_posts(blog_id, ...)`
- `get_best_time_to_post(blog_id, ...)`
- `cancel_scheduled_post(blog_id, ...)`
- `update_scheduled_post(blog_id, ...)`
- `get_connected_accounts(blog_id)`

## 4. Endpoint /schedule Atualizado ✅

### Mudanças no endpoint:
```python
# Antes: Tentava usar MCP tools diretamente (incorreto)
# Depois: Usa MetricoolService corretamente

# Initialize Metricool service (credentials from system config)
metricool_service = MetricoolService()

# Verify connected accounts for this blog
connected_accounts = await metricool_service.get_connected_accounts(blog_id)

# Schedule post via Metricool API
result = await metricool_service.schedule_post(
    blog_id=blog_id,
    platform=schedule.platform,
    text=schedule.description,
    media_url=video_data["processed_url"],
    scheduled_at=schedule.scheduledAt,
    timezone="UTC"
)
```

### Fluxo correto:
1. Busca `metricool_blog_id` da tabela `organizations`
2. Inicializa `MetricoolService()` (sem parâmetros)
3. Verifica contas conectadas para o `blog_id`
4. Agenda posts via `schedule_post()`
5. Salva no banco com `external_post_id`

## 5. Validação de URLs dos Endpoints

### Endpoints Implementados:

| Método | Endpoint | Status |
|--------|----------|--------|
| GET | `/admin/simpleProfiles` | ✅ Implementado |
| POST | `/posts` | ✅ Implementado |
| GET | `/posts/scheduled` | ✅ Implementado |
| DELETE | `/posts/{post_id}` | ✅ Implementado |
| PUT | `/posts/{post_id}` | ✅ Implementado |
| GET | `/analytics/best-time` | ✅ Implementado |

### Base URL:
```python
BASE_URL = "https://app.metricool.com/api"
```

### Autenticação:
```python
headers = {
    "X-Mc-Auth": user_token,
    "Content-Type": "application/json"
}

params = {
    "userId": user_id,
    "blogId": blog_id
}
```

## Estrutura de Dados

### Network-Specific Data:
O método `_build_network_data()` constrói dados específicos para cada plataforma:

- **Instagram**: `instagramData` (type, collaborators, carouselTags, showReelOnFeed)
- **Facebook**: `facebookData` (type, title, boost, boostPayer, boostBeneficiary)
- **Twitter/X**: `twitterData` (tags)
- **TikTok**: `tiktokData` (disableComment, disableDuet, privacyOption, title, etc.)
- **YouTube**: `youtubeData` (title, type, privacy, tags, madeForKids)
- **LinkedIn**: `linkedinData` (documentTitle, publishImagesAsPDF, type)
- **Pinterest**: `pinterestData` (boardId, pinTitle, pinLink)
- **Bluesky**: `blueskyData` (postLanguages)
- **Threads**: `threadsData` (allowedCountryCodes)

## Validações Implementadas

### Comprimento de Texto:
```python
limits = {
    "bluesky": 300,
    "x": 280,
    "twitter": 280,
    "instagram": 2200,
    "tiktok": 2200,
    "facebook": 2200,
    "linkedin": 3000,
    "youtube": 5000
}
```

### Credenciais:
```python
def _validate_credentials(self):
    if not self.user_token or not self.user_id:
        raise Exception("Metricool credentials not configured in system settings")
```

## Uso no Código

### Exemplo Completo:
```python
from app.services.metricool import MetricoolService

# Inicializar (credenciais do config)
metricool = MetricoolService()

# Listar brands
brands = await metricool.get_brands()
blog_id = brands[0]["id"]

# Verificar contas conectadas
connected = await metricool.get_connected_accounts(blog_id)

# Agendar post
result = await metricool.schedule_post(
    blog_id=blog_id,
    platform="instagram",
    text="Confira este vídeo incrível!",
    media_url="https://storage.supabase.co/video.mp4",
    scheduled_at="2026-02-20T18:00:00",
    timezone="UTC"
)

# Cancelar post
success = await metricool.cancel_scheduled_post(blog_id, result["post_id"])

# Atualizar post
updated = await metricool.update_scheduled_post(
    blog_id=blog_id,
    post_id=result["post_id"],
    platform="instagram",
    text="Texto atualizado!",
    scheduled_at="2026-02-20T19:00:00"
)
```

## Arquivos Modificados

1. **backend/app/config.py**
   - Adicionado `metricool_user_token` e `metricool_user_id`

2. **backend/app/services/metricool.py**
   - Reescrito construtor para usar credenciais do config
   - Adicionado `cancel_scheduled_post()`
   - Adicionado `update_scheduled_post()`
   - Atualizado `get_connected_accounts()` para requerer `blog_id`

3. **backend/app/api/routes/module2.py**
   - Atualizado endpoint `/schedule` para usar `MetricoolService()` corretamente
   - Removida lógica de MCP tools diretos
   - Adicionada verificação de contas conectadas

## Próximos Passos

### Para Calendário (Módulo futuro):
- Usar `get_scheduled_posts()` para listar posts
- Usar `cancel_scheduled_post()` para cancelar
- Usar `update_scheduled_post()` para editar

### Para Analytics:
- Usar `get_best_time_to_post()` para sugerir horários
- Implementar `get_analytics()` quando necessário

## Notas Importantes

1. **Credenciais são globais**: Um único par de credenciais Metricool para todo o sistema
2. **Organizações via blogId**: Cada organização tem seu `metricool_blog_id` na tabela `organizations`
3. **Validação de texto**: Sempre valida comprimento antes de enviar
4. **Erro handling**: Todos os métodos têm try/catch e logging
5. **Async/await**: Todos os métodos são assíncronos usando `httpx.AsyncClient`

---

**Status:** ✅ Todos os ajustes implementados e testados  
**Data:** 14 de Fevereiro de 2026  
**Desenvolvido por:** Kiro AI Assistant
