# Design Document - Fase 4: OAuth, Calendar & Dashboard

## Overview

A Fase 4 implementa a integração completa entre frontend (Dyad) e backend (FastAPI), adicionando três pilares fundamentais:

1. **OAuth de Redes Sociais**: Conexão transparente com Instagram, TikTok, LinkedIn, Facebook, X e YouTube via Metricool
2. **Sistema de Calendário**: Visualização e gerenciamento de posts agendados com filtros avançados
3. **Dashboard com Estatísticas Reais**: Métricas agregadas de vídeos, posts e engajamento

A arquitetura elimina chamadas diretas ao Supabase no frontend, centralizando toda lógica de negócio no backend. O Metricool atua como provedor de serviços de agendamento e analytics, mas permanece completamente transparente para o usuário final.

### Princípios de Design

- **Separação de Responsabilidades**: Frontend apenas renderiza UI, backend processa lógica
- **Transparência do Metricool**: Usuário nunca vê referência ao Metricool na interface
- **Autenticação Centralizada**: Supabase JWT validado em todas requisições protegidas
- **Logging Estruturado**: Todos endpoints registram organization_id, module, endpoint, status_code
- **Error Handling Consistente**: Erros traduzidos para mensagens amigáveis

## Architecture

### Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      RENUM Frontend (Dyad)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ScriptAI  │  │PostRápido│  │AvatarAI  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │              │          │
│       └─────────────┴──────────────┴──────────────┘          │
│                         │                                     │
│                    ┌────▼────┐                               │
│                    │API Client│                              │
│                    └────┬────┘                               │
└─────────────────────────┼─────────────────────────────────────┘
                          │ HTTPS + Supabase JWT
                          │
┌─────────────────────────▼─────────────────────────────────────┐
│                   RENUM Backend (FastAPI)                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              API Routes Layer                         │    │
│  │  /api/dashboard  /api/calendar  /api/integrations    │    │
│  │  /api/scriptai   /api/postrapido  /api/avatarai      │    │
│  └────────────────────┬─────────────────────────────────┘    │
│                       │                                        │
│  ┌────────────────────▼─────────────────────────────────┐    │
│  │              Services Layer                           │    │
│  │  MetricoolService  HeyGenService  TavilyService      │    │
│  └────────────────────┬─────────────────────────────────┘    │
│                       │                                        │
│  ┌────────────────────▼─────────────────────────────────┐    │
│  │              Data Layer                               │    │
│  │  Supabase PostgreSQL (organizations, posts, videos)  │    │
│  └───────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS + API Key
                          │
┌─────────────────────────▼─────────────────────────────────────┐
│                   External Services                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │Metricool │  │ HeyGen   │  │ Tavily   │  │Supabase  │     │
│  │   API    │  │   API    │  │   API    │  │   Auth   │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└───────────────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

```
User → Frontend → Supabase Auth → JWT Token
                                      │
                                      ▼
Frontend → API Client (add JWT header) → Backend
                                           │
                                           ▼
                                  get_current_organization()
                                           │
                                           ▼
                                  Validate JWT + Extract org_id
                                           │
                                           ▼
                                  Execute Business Logic
```

### Fluxo OAuth de Redes Sociais

```
1. User clicks "Conectar Instagram" no Frontend
   │
   ▼
2. Frontend → POST /api/integrations/social-accounts/connect
   │         body: { platform: "instagram" }
   ▼
3. Backend → MetricoolService.initiate_oauth("instagram")
   │
   ▼
4. Metricool API → Returns OAuth URL
   │
   ▼
5. Backend → Returns { authorization_url: "https://..." }
   │
   ▼
6. Frontend → Opens OAuth URL in new window
   │
   ▼
7. User authorizes on Instagram
   │
   ▼
8. Instagram → Redirects to Metricool callback
   │
   ▼
9. Metricool → Stores credentials
   │
   ▼
10. Frontend → Polls GET /api/integrations/social-accounts
    │
    ▼
11. Backend → Returns updated status { instagram: { connected: true } }
```

## Components and Interfaces

### Backend Components

#### 1. MetricoolService (app/services/metricool.py)

Serviço que abstrai toda comunicação com Metricool API.

**Responsabilidades**:
- Gerenciar autenticação via API key
- Executar requisições HTTP assíncronas
- Traduzir erros da API para exceções internas
- Registrar logs estruturados

**Interface**:

```python
class MetricoolService:
    def __init__(self, access_token: str):
        self.access_token = access_token
        # TODO: Definir base_url após descoberta MCP (Task 4.0)
        # A URL real será determinada pela descoberta do Metricool MCP
        self.base_url = None  # Será configurado após Task 4.0
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_brands(self) -> List[Dict[str, Any]]:
        """Retorna lista de brands disponíveis"""
        pass
    
    async def schedule_post(
        self,
        brand_id: str,
        platform: str,
        content: str,
        media_urls: List[str],
        scheduled_at: datetime
    ) -> Dict[str, Any]:
        """Agenda post em rede social"""
        pass
    
    async def get_scheduled_posts(
        self,
        brand_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        platform: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lista posts agendados com filtros"""
        pass
    
    async def update_scheduled_post(
        self,
        post_id: str,
        scheduled_at: datetime
    ) -> Dict[str, Any]:
        """Reagenda post existente"""
        pass
    
    async def delete_scheduled_post(self, post_id: str) -> bool:
        """Cancela post agendado"""
        pass
    
    async def get_connected_accounts(self, brand_id: str) -> List[Dict[str, Any]]:
        """Lista contas de redes sociais conectadas"""
        pass
    
    async def initiate_oauth(
        self,
        brand_id: str,
        platform: str,
        redirect_uri: str
    ) -> Dict[str, str]:
        """Inicia fluxo OAuth, retorna authorization_url"""
        pass
    
    async def disconnect_account(
        self,
        brand_id: str,
        platform: str
    ) -> bool:
        """Desconecta conta de rede social"""
        pass
    
    async def get_analytics(
        self,
        brand_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Retorna métricas de engajamento"""
        pass
    
    async def get_best_times(
        self,
        brand_id: str,
        platform: str
    ) -> List[Dict[str, Any]]:
        """Sugere melhores horários para publicação"""
        pass
```

**Error Handling**:
- `MetricoolAPIError`: Erro genérico da API
- `MetricoolAuthError`: Erro de autenticação
- `MetricoolRateLimitError`: Rate limit atingido
- `MetricoolNotFoundError`: Recurso não encontrado

#### 2. Social Accounts Router (app/api/routes/social_accounts.py)

Endpoints para gerenciar conexões de redes sociais.

**Endpoints**:

```python
@router.get("/api/integrations/social-accounts")
async def list_social_accounts(
    organization: Organization = Depends(get_current_organization)
) -> SocialAccountsResponse:
    """
    Lista status de conexão de todas plataformas suportadas.
    
    Returns:
        {
            "accounts": [
                {
                    "platform": "instagram",
                    "connected": true,
                    "account_name": "@myaccount"
                },
                {
                    "platform": "tiktok",
                    "connected": false,
                    "account_name": null
                }
            ]
        }
    """
    pass

@router.post("/api/integrations/social-accounts/connect")
async def connect_social_account(
    request: ConnectRequest,
    organization: Organization = Depends(get_current_organization)
) -> Dict[str, str]:
    """
    Inicia fluxo OAuth para conectar rede social.
    
    Args:
        request: { "platform": "instagram" }
    
    Returns:
        {
            "authorization_url": "https://api.instagram.com/oauth/authorize?..."
        }
    """
    pass

@router.delete("/api/integrations/social-accounts/{platform}")
async def disconnect_social_account(
    platform: SocialPlatform,
    organization: Organization = Depends(get_current_organization)
) -> Dict[str, str]:
    """
    Desconecta conta de rede social.
    
    Returns:
        {
            "message": "Instagram desconectado com sucesso"
        }
    """
    pass
```

#### 3. Calendar Router (app/api/routes/calendar.py)

Endpoints para gerenciar posts agendados.

**Endpoints**:

```python
@router.get("/api/calendar/posts")
async def list_calendar_posts(
    query: CalendarQuery = Depends(),
    organization: Organization = Depends(get_current_organization)
) -> CalendarResponse:
    """
    Lista posts agendados com filtros.
    
    Query Params:
        - start_date: ISO datetime
        - end_date: ISO datetime
        - platform: instagram | tiktok | linkedin | facebook | x | youtube
        - status: scheduled | published | cancelled
    
    Returns:
        {
            "posts": [
                {
                    "id": "uuid",
                    "content": "...",
                    "platform": "instagram",
                    "scheduled_at": "2024-01-15T10:00:00Z",
                    "status": "scheduled",
                    "thumbnail_url": "https://...",
                    "metricool_post_id": "..."
                }
            ],
            "total": 42
        }
    """
    pass

@router.get("/api/calendar/posts/{post_id}")
async def get_calendar_post(
    post_id: str,
    organization: Organization = Depends(get_current_organization)
) -> CalendarPost:
    """
    Retorna detalhes completos de post agendado.
    """
    pass

@router.put("/api/calendar/posts/{post_id}/reschedule")
async def reschedule_post(
    post_id: str,
    request: RescheduleRequest,
    organization: Organization = Depends(get_current_organization)
) -> CalendarPost:
    """
    Reagenda post para nova data/hora.
    
    Args:
        request: { "scheduled_at": "2024-01-20T14:00:00Z" }
    """
    pass

@router.put("/api/calendar/posts/{post_id}/cancel")
async def cancel_post(
    post_id: str,
    organization: Organization = Depends(get_current_organization)
) -> Dict[str, str]:
    """
    Cancela post agendado.
    
    Returns:
        {
            "message": "Post cancelado com sucesso"
        }
    """
    pass
```

#### 4. Dashboard Router (app/api/routes/dashboard.py)

Endpoint para estatísticas do dashboard.

**Endpoints**:

```python
@router.get("/api/dashboard/stats")
async def get_dashboard_stats(
    organization: Organization = Depends(get_current_organization)
) -> DashboardStats:
    """
    Retorna estatísticas agregadas para dashboard.
    
    Returns:
        {
            "videos_total": 127,
            "posts_scheduled_month": 18,
            "posts_published_month": 24,
            "engagement_total": 15420,
            "connected_platforms": ["instagram", "tiktok"]
        }
    """
    pass
```

### Frontend Components

#### 1. API Client (frontend/src/lib/api.ts)

Cliente HTTP centralizado para todas requisições ao backend.

**Interface**:

```typescript
interface APIClient {
  // Dashboard (NOVO - Fase 4)
  dashboard: {
    getStats(): Promise<DashboardStats>;
  };
  
  // ScriptAI (Módulo 1) - Endpoints REAIS do Swagger
  scriptai: {
    generateScript(request: GenerateScriptRequest): Promise<ScriptResponse>;
    regenerateScript(request: RegenerateScriptRequest): Promise<ScriptResponse>;
    saveDraft(request: SaveDraftRequest): Promise<DraftResponse>;
    listDrafts(): Promise<DraftListResponse>;
    getDraft(draftId: string): Promise<DraftResponse>;
    updateDraft(draftId: string, request: UpdateDraftRequest): Promise<DraftResponse>;
    deleteDraft(draftId: string): Promise<{ message: string }>;
  };
  
  // PostRápido (Módulo 2) - Endpoints REAIS do Swagger
  postrapido: {
    upload(file: File, title?: string): Promise<VideoUploadResponse>;
    transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse>;
    detectSilences(request: SilenceDetectionRequest): Promise<SilenceDetectionResponse>;
    process(request: VideoProcessRequest): Promise<VideoProcessResponse>;
    getProcessStatus(jobId: string): Promise<VideoProcessStatus>;
    generateDescriptions(request: DescriptionGenerateRequest): Promise<DescriptionGenerateResponse>;
    regenerateDescription(request: DescriptionRegenerateRequest): Promise<{ [platform: string]: string }>;
    schedule(request: ScheduleRequest): Promise<ScheduleResponse>;
  };
  
  // AvatarAI (Módulo 3) - Endpoints REAIS do Swagger
  avatarai: {
    generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
    getVideoStatus(jobId: string): Promise<VideoStatusResponse>;
    sendToPostRapido(request: SendToPostRapidoRequest): Promise<{ success: boolean; message: string; redirect_url: string }>;
  };
  
  // Integrations - HeyGen (Endpoints REAIS do Swagger)
  heygen: {
    configure(request: HeyGenConfigRequest): Promise<{ success: boolean; message: string }>;
    test(): Promise<{ success: boolean; message: string }>;
    getCredits(): Promise<{ remaining_credits: number; total_credits: number }>;
    getAvatars(): Promise<{ avatars: Avatar[] }>;
    getVoices(): Promise<{ voices: Voice[] }>;
  };
  
  // Integrations - Metricool (Endpoints REAIS do Swagger)
  metricool: {
    test(): Promise<{ success: boolean; message: string }>;
    getStatus(): Promise<{ connected: boolean; blog_id?: string }>;
  };
  
  // Calendar (NOVO - Fase 4)
  calendar: {
    listPosts(query: CalendarQuery): Promise<CalendarResponse>;
    getPost(id: string): Promise<CalendarPost>;
    reschedulePost(id: string, scheduledAt: string): Promise<CalendarPost>;
    cancelPost(id: string): Promise<void>;
  };
  
  // Social Accounts (NOVO - Fase 4)
  social: {
    listAccounts(): Promise<SocialAccountsResponse>;
    connect(platform: string): Promise<{ authorization_url: string }>;
    disconnect(platform: string): Promise<void>;
  };
  
  // Health
  health: {
    check(): Promise<{ status: string }>;
    ready(): Promise<{ status: string }>;
  };
}

// Implementação
class APIClientImpl implements APIClient {
  private baseURL: string;
  private supabase: SupabaseClient;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.supabase = createClient(/* ... */);
  }
  
  private async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    const session = await this.supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${this.baseURL}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    if (response.status === 403 || response.status >= 500) {
      const error = await response.json();
      toast.error(error.message || 'Erro ao processar requisição');
      throw new Error(error.message);
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  }
  
  // Implementar métodos...
}

export const api = new APIClientImpl();
```

**Error Handling**:
- 401: Redireciona para /login
- 403/500: Exibe toast com mensagem de erro
- Network errors: Exibe toast "Erro de conexão"

#### 2. Migração de Páginas

**Dashboard (frontend/src/pages/Dashboard.tsx)**:

```typescript
// ANTES (chamada direta ao Supabase)
const { data: videos } = await supabase
  .from('videos')
  .select('*')
  .eq('organization_id', orgId);

// DEPOIS (via API Client)
const stats = await api.dashboard.getStats();
```

**ScriptAI (frontend/src/pages/ScriptAI.tsx)**:

```typescript
// ANTES
const { data } = await supabase
  .from('scripts')
  .insert({ ... });

// DEPOIS - Mapeamento completo dos 7 endpoints do Módulo 1
// Gerar script
const script = await api.scriptai.generateScript({
  topic: '...',
  audience: '...',
  tone: '...',
  duration: 60,
  language: 'pt'
});

// Regenerar com feedback
const newScript = await api.scriptai.regenerateScript({
  topic: '...',
  script: '...',
  feedback: '...',
  audience: '...'
});

// Salvar rascunho
const draft = await api.scriptai.saveDraft({
  title: '...',
  script: '...',
  topic: '...',
  audience: '...',
  sources: [...],
  metadata: {...}
});

// Listar rascunhos
const drafts = await api.scriptai.listDrafts();

// Obter rascunho específico
const draft = await api.scriptai.getDraft(draftId);

// Atualizar rascunho
const updated = await api.scriptai.updateDraft(draftId, {
  title: '...',
  script: '...'
});

// Deletar rascunho
await api.scriptai.deleteDraft(draftId);
```

**PostRápido (frontend/src/pages/PostRapido.tsx)**:

```typescript
// ANTES
const { data } = await supabase.storage
  .from('videos')
  .upload(file.name, file);

// DEPOIS - Mapeamento completo dos 8 endpoints do Módulo 2
// 1. Upload de vídeo
const upload = await api.postrapido.upload(file, 'Título do vídeo');

// 2. Transcrever vídeo
const transcription = await api.postrapido.transcribe({
  videoId: upload.videoId,
  language: 'pt'
});

// 3. Detectar silêncios
const silences = await api.postrapido.detectSilences({
  videoId: upload.videoId,
  minSilenceDuration: 0.5,
  silenceThreshold: -40
});

// 4. Processar vídeo (legendas, cortes, etc)
const processJob = await api.postrapido.process({
  videoId: upload.videoId,
  subtitles: {
    enabled: true,
    style: { fontSize: 24, color: '#FFFFFF' }
  },
  trim: { start: 0, end: 60 },
  silenceRemoval: { enabled: true }
});

// 5. Consultar status do processamento (polling)
const status = await api.postrapido.getProcessStatus(processJob.jobId);

// 6. Gerar descrições para plataformas
const descriptions = await api.postrapido.generateDescriptions({
  videoId: upload.videoId,
  platforms: ['instagram', 'tiktok', 'linkedin'],
  tone: 'professional',
  includeHashtags: true
});

// 7. Regenerar descrição específica
const newDescription = await api.postrapido.regenerateDescription({
  videoId: upload.videoId,
  platform: 'instagram',
  instructions: 'Mais casual e com emojis'
});

// 8. Agendar posts
const scheduled = await api.postrapido.schedule({
  videoId: upload.videoId,
  schedules: [
    {
      platform: 'instagram',
      description: descriptions.descriptions.instagram,
      scheduledAt: '2024-12-25T10:00:00Z'
    },
    {
      platform: 'tiktok',
      description: descriptions.descriptions.tiktok,
      scheduledAt: '2024-12-25T11:00:00Z'
    }
  ]
});
```

**Settings (frontend/src/pages/Settings.tsx)**:

```typescript
// NOVO - Integrations completas
// HeyGen
const heygenConfig = await api.heygen.configure({
  api_key: '...',
  avatar_id: '...',
  voice_id: '...'
});

const heygenTest = await api.heygen.test();
const credits = await api.heygen.getCredits();
const avatars = await api.heygen.getAvatars();
const voices = await api.heygen.getVoices();

// Metricool
const metricoolTest = await api.metricool.test();
const metricoolStatus = await api.metricool.getStatus();

// Social Accounts
const accounts = await api.social.listAccounts();

const handleConnect = async (platform: string) => {
  const { authorization_url } = await api.social.connect(platform);
  window.open(authorization_url, '_blank');
};

const handleDisconnect = async (platform: string) => {
  await api.social.disconnect(platform);
  toast.success(`${platform} desconectado com sucesso`);
};
```

**Calendar (frontend/src/pages/Calendar.tsx)**:

```typescript
// NOVO
const { posts } = await api.calendar.listPosts({
  start_date: startOfMonth,
  end_date: endOfMonth,
});

const handleReschedule = async (postId: string, newDate: string) => {
  await api.calendar.reschedulePost(postId, newDate);
  toast.success('Post reagendado com sucesso');
};
```

## Data Models

### Backend Models (app/models/social_accounts.py)

```python
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SocialPlatform(str, Enum):
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    FACEBOOK = "facebook"
    X = "x"
    YOUTUBE = "youtube"

class ConnectRequest(BaseModel):
    platform: SocialPlatform

class PlatformStatus(BaseModel):
    platform: SocialPlatform
    connected: bool
    account_name: Optional[str] = None

class SocialAccountsResponse(BaseModel):
    accounts: List[PlatformStatus]

class CalendarQuery(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    platform: Optional[SocialPlatform] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|published|cancelled)$")

class CalendarPost(BaseModel):
    id: str
    content: str
    platform: SocialPlatform
    scheduled_at: datetime
    status: str
    thumbnail_url: Optional[str] = None
    metricool_post_id: Optional[str] = None
    created_at: datetime
    cancelled_at: Optional[datetime] = None

class CalendarResponse(BaseModel):
    posts: List[CalendarPost]
    total: int

class RescheduleRequest(BaseModel):
    scheduled_at: datetime

class DashboardStats(BaseModel):
    videos_total: int
    posts_scheduled_month: int
    posts_published_month: int
    engagement_total: int
    connected_platforms: List[SocialPlatform]
```

### Frontend Types (frontend/src/types/api.ts)

```typescript
export type SocialPlatform = 
  | 'instagram' 
  | 'tiktok' 
  | 'linkedin' 
  | 'facebook' 
  | 'x' 
  | 'youtube';

export interface PlatformStatus {
  platform: SocialPlatform;
  connected: boolean;
  account_name?: string;
}

export interface SocialAccountsResponse {
  accounts: PlatformStatus[];
}

export interface CalendarQuery {
  start_date?: string;
  end_date?: string;
  platform?: SocialPlatform;
  status?: 'scheduled' | 'published' | 'cancelled';
}

export interface CalendarPost {
  id: string;
  content: string;
  platform: SocialPlatform;
  scheduled_at: string;
  status: string;
  thumbnail_url?: string;
  metricool_post_id?: string;
  created_at: string;
  cancelled_at?: string;
}

export interface CalendarResponse {
  posts: CalendarPost[];
  total: number;
}

export interface DashboardStats {
  videos_total: number;
  posts_scheduled_month: number;
  posts_published_month: number;
  engagement_total: number;
  connected_platforms: SocialPlatform[];
}
```

### Database Schema Updates

```sql
-- Migration: 004_fase4_calendar_dashboard.sql

-- Adicionar campos na tabela posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS metricool_post_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_org_scheduled 
ON posts(organization_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_posts_metricool 
ON posts(metricool_post_id) 
WHERE metricool_post_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN posts.metricool_post_id IS 'ID do post no Metricool para sincronização';
COMMENT ON COLUMN posts.thumbnail_url IS 'URL da thumbnail do vídeo';
COMMENT ON COLUMN posts.cancelled_at IS 'Timestamp de cancelamento do post';
```



## Correctness Properties

*Uma property (propriedade) é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. Properties servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquinas.*

### Property 1: MetricoolService CRUD de Posts

*Para qualquer* post válido com conteúdo, plataforma e data de agendamento, quando schedule_post() é chamado, então get_scheduled_posts() deve retornar o post agendado, e após delete_scheduled_post(), o post não deve mais aparecer na listagem.

**Validates: Requirements 2.2, 2.3, 2.5**

### Property 2: MetricoolService Reagendamento

*Para qualquer* post agendado existente e nova data válida, quando update_scheduled_post() é chamado, então get_scheduled_posts() deve retornar o post com a nova data de agendamento.

**Validates: Requirements 2.4**

### Property 3: MetricoolService OAuth Flow

*Para qualquer* plataforma social válida (instagram, tiktok, linkedin, facebook, x, youtube), quando initiate_oauth() é chamado, então deve retornar uma URL de autorização não-vazia começando com "https://".

**Validates: Requirements 2.7, 3.2**

### Property 4: MetricoolService Desconexão de Conta

*Para qualquer* conta conectada, quando disconnect_account() é chamado, então get_connected_accounts() não deve mais incluir essa plataforma na lista de contas conectadas.

**Validates: Requirements 2.8, 3.4**

### Property 5: MetricoolService Logging de Erros

*Para qualquer* método do MetricoolService que falha, o log registrado deve conter o campo organization_id não-vazio.

**Validates: Requirements 2.11**

### Property 6: Social Accounts Listagem Completa

*Para qualquer* organização, quando GET /api/integrations/social-accounts é chamado, então a resposta deve conter status para todas as 6 plataformas suportadas (instagram, tiktok, linkedin, facebook, x, youtube).

**Validates: Requirements 3.1**

### Property 7: Filtros de Calendário

*Para qualquer* combinação válida de filtros (start_date, end_date, platform, status), quando GET /api/calendar/posts é chamado, então todos os posts retornados devem satisfazer os critérios de filtro especificados.

**Validates: Requirements 4.1**

### Property 8: Detalhes Completos de Post

*Para qualquer* post agendado existente, quando GET /api/calendar/posts/{post_id} é chamado, então a resposta deve conter todos os campos obrigatórios: id, content, platform, scheduled_at, status, created_at.

**Validates: Requirements 4.2**

### Property 9: Reagendamento de Post

*Para qualquer* post agendado e nova data válida, quando PUT /api/calendar/posts/{post_id}/reschedule é chamado, então GET /api/calendar/posts/{post_id} deve retornar o post com scheduled_at igual à nova data.

**Validates: Requirements 4.3**

### Property 10: Cancelamento de Post

*Para qualquer* post agendado, quando PUT /api/calendar/posts/{post_id}/cancel é chamado, então GET /api/calendar/posts/{post_id} deve retornar o post com cancelled_at não-nulo e status "cancelled".

**Validates: Requirements 4.4**

### Property 11: Ordenação de Posts por Data

*Para qualquer* lista de posts retornada por GET /api/calendar/posts, os posts devem estar ordenados por scheduled_at em ordem crescente (do mais antigo para o mais recente).

**Validates: Requirements 4.5**

### Property 12: Thumbnail para Posts com Vídeo

*Para qualquer* post agendado que contém vídeo, o campo thumbnail_url deve ser não-nulo e começar com "https://".

**Validates: Requirements 4.6**

### Property 13: Dashboard Stats Estrutura Completa

*Para qualquer* organização, quando GET /api/dashboard/stats é chamado, então a resposta deve conter todos os campos obrigatórios (videos_total, posts_scheduled_month, posts_published_month, engagement_total, connected_platforms) com valores não-negativos para campos numéricos.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 14: API Client JWT em Todas Requisições

*Para qualquer* método do API Client, quando uma requisição é feita, então o header Authorization deve estar presente com formato "Bearer {token}".

**Validates: Requirements 6.2**

### Property 15: Validação de Dados Pydantic

*Para qualquer* endpoint que recebe dados no body, quando dados inválidos são enviados (campos faltando, tipos incorretos, valores fora do range), então a resposta deve ser 422 com detalhes dos campos inválidos.

**Validates: Requirements 8.10**

### Property 16: Migration Idempotente

*Para qualquer* estado do banco de dados, quando a migration 004_fase4_calendar_dashboard.sql é executada duas vezes consecutivas, então a segunda execução não deve causar erro e o schema final deve ser idêntico.

**Validates: Requirements 9.6**

### Property 17: Logging Estruturado em Endpoints

*Para qualquer* endpoint protegido, quando uma requisição é processada, então o log deve conter os campos obrigatórios: organization_id, module, endpoint, status_code.

**Validates: Requirements 10.1**

### Property 18: Logging de Stack Trace em Erros

*Para qualquer* erro não-tratado que ocorre durante processamento de requisição, então o log deve conter stack trace completo com pelo menos 3 linhas de contexto.

**Validates: Requirements 10.2**

### Property 19: Request ID Único em Logs

*Para qualquer* duas requisições processadas, os logs devem conter request_id diferentes (únicos).

**Validates: Requirements 10.5**

### Property 20: JWT Inválido Retorna 401

*Para qualquer* endpoint protegido, quando uma requisição é feita com JWT inválido (malformado, expirado, ou assinatura incorreta), então a resposta deve ser 401 Unauthorized.

**Validates: Requirements 11.2, 11.3**

### Property 21: Autorização Cross-Organization

*Para qualquer* recurso pertencente à organização A, quando usuário da organização B tenta acessá-lo, então a resposta deve ser 403 Forbidden.

**Validates: Requirements 11.4**

### Property 22: Tradução de Erros do Metricool

*Para qualquer* erro retornado pelo Metricool API, quando o backend processa a resposta, então a mensagem de erro retornada ao frontend deve ser em português e não conter códigos técnicos internos do Metricool.

**Validates: Requirements 12.1**

### Property 23: Detalhes de Validação em Erros 422

*Para qualquer* erro de validação Pydantic, quando a resposta 422 é retornada, então o body deve conter array "detail" com pelo menos um item especificando campo (loc) e mensagem (msg).

**Validates: Requirements 12.2**

### Property 24: Recurso Não Encontrado Retorna 404

*Para qualquer* endpoint que busca recurso por ID, quando o ID não existe no banco de dados, então a resposta deve ser 404 Not Found com mensagem descritiva.

**Validates: Requirements 12.3**

### Property 25: Rate Limit Retorna 429

*Para qualquer* endpoint, quando o rate limit é atingido, então a resposta deve ser 429 Too Many Requests com header Retry-After indicando tempo de espera em segundos.

**Validates: Requirements 12.4**

## Error Handling

### Categorias de Erros

**1. Erros de Validação (422)**:
- Dados inválidos no request body
- Parâmetros de query fora do range
- Formato de data inválido
- Enum com valor não suportado

Exemplo:
```json
{
  "detail": [
    {
      "loc": ["body", "platform"],
      "msg": "value is not a valid enumeration member; permitted: 'instagram', 'tiktok', 'linkedin', 'facebook', 'x', 'youtube'",
      "type": "type_error.enum"
    }
  ]
}
```

**2. Erros de Autenticação (401)**:
- JWT ausente
- JWT malformado
- JWT expirado
- Assinatura inválida

Exemplo:
```json
{
  "detail": "Token de autenticação inválido ou expirado"
}
```

**3. Erros de Autorização (403)**:
- Acesso a recurso de outra organização
- Permissões insuficientes

Exemplo:
```json
{
  "detail": "Você não tem permissão para acessar este recurso"
}
```

**4. Erros de Recurso Não Encontrado (404)**:
- Post ID inexistente
- Organização não encontrada
- Endpoint não existe

Exemplo:
```json
{
  "detail": "Post com ID 'abc-123' não encontrado"
}
```

**5. Erros de Rate Limit (429)**:
- Muitas requisições em curto período

Exemplo:
```json
{
  "detail": "Limite de requisições atingido. Tente novamente em 60 segundos"
}
```
Headers: `Retry-After: 60`

**6. Erros de Integração Externa (502)**:
- Metricool API indisponível
- Timeout em requisição externa
- Resposta inválida de serviço externo

Exemplo:
```json
{
  "detail": "Serviço de agendamento temporariamente indisponível. Tente novamente em alguns minutos"
}
```

**7. Erros Internos (500)**:
- Exceções não-tratadas
- Falhas de banco de dados
- Bugs no código

Exemplo:
```json
{
  "detail": "Erro interno do servidor. Nossa equipe foi notificada"
}
```

### Estratégia de Error Handling

**Backend**:
```python
# app/api/error_handlers.py

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.services.metricool import MetricoolAPIError, MetricoolRateLimitError
import logging

logger = logging.getLogger(__name__)

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler para erros de validação Pydantic"""
    logger.warning(
        "Validation error",
        extra={
            "path": request.url.path,
            "errors": exc.errors(),
        }
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

async def metricool_error_handler(request: Request, exc: MetricoolAPIError):
    """Handler para erros do Metricool"""
    logger.error(
        "Metricool API error",
        extra={
            "path": request.url.path,
            "error": str(exc),
        }
    )
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"detail": "Serviço de agendamento temporariamente indisponível"}
    )

async def metricool_rate_limit_handler(request: Request, exc: MetricoolRateLimitError):
    """Handler para rate limit do Metricool"""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": f"Limite de requisições atingido. Tente novamente em {exc.retry_after} segundos"},
        headers={"Retry-After": str(exc.retry_after)}
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """Handler para exceções não-tratadas"""
    logger.exception(
        "Unhandled exception",
        extra={
            "path": request.url.path,
        }
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Erro interno do servidor. Nossa equipe foi notificada"}
    )
```

**Frontend**:
```typescript
// frontend/src/lib/api.ts

private async request<T>(
  method: string,
  path: string,
  data?: any
): Promise<T> {
  try {
    const response = await fetch(`${this.baseURL}${path}`, {
      method,
      headers: await this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    
    // 401: Redirect to login
    if (response.status === 401) {
      toast.error('Sessão expirada. Faça login novamente');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    // 403: Permission denied
    if (response.status === 403) {
      const error = await response.json();
      toast.error(error.detail || 'Você não tem permissão para esta ação');
      throw new Error(error.detail);
    }
    
    // 404: Not found
    if (response.status === 404) {
      const error = await response.json();
      toast.error(error.detail || 'Recurso não encontrado');
      throw new Error(error.detail);
    }
    
    // 422: Validation error
    if (response.status === 422) {
      const error = await response.json();
      const messages = error.detail.map((e: any) => e.msg).join(', ');
      toast.error(`Dados inválidos: ${messages}`);
      throw new Error(messages);
    }
    
    // 429: Rate limit
    if (response.status === 429) {
      const error = await response.json();
      toast.warning(error.detail || 'Muitas requisições. Aguarde um momento');
      throw new Error(error.detail);
    }
    
    // 500+: Server error
    if (response.status >= 500) {
      const error = await response.json();
      toast.error(error.detail || 'Erro no servidor. Tente novamente');
      throw new Error(error.detail);
    }
    
    if (!response.ok) {
      throw new Error('Request failed');
    }
    
    return response.json();
  } catch (error) {
    // Network error
    if (error instanceof TypeError) {
      toast.error('Erro de conexão. Verifique sua internet');
    }
    throw error;
  }
}
```

## Testing Strategy

### Abordagem Dual: Unit Tests + Property-Based Tests

A estratégia de testes combina duas abordagens complementares:

1. **Unit Tests**: Validam exemplos específicos, casos extremos e condições de erro
2. **Property Tests**: Verificam propriedades universais através de múltiplas entradas geradas

Ambos são necessários para cobertura abrangente. Unit tests capturam bugs concretos, property tests verificam correção geral.

### Property-Based Testing

**Biblioteca**: `hypothesis` (Python) para backend, `fast-check` (TypeScript) para frontend

**Configuração**:
- Mínimo 100 iterações por property test
- Cada test deve referenciar sua property no design
- Tag format: `# Feature: fase4-oauth-calendar-dashboard, Property {N}: {texto}`

**Exemplo de Property Test**:

```python
# backend/tests/test_calendar_properties.py

from hypothesis import given, strategies as st
from datetime import datetime, timedelta
import pytest

@given(
    start_date=st.datetimes(min_value=datetime(2024, 1, 1)),
    end_date=st.datetimes(min_value=datetime(2024, 1, 1)),
    platform=st.sampled_from(['instagram', 'tiktok', 'linkedin', 'facebook', 'x', 'youtube']),
)
@pytest.mark.property_test
def test_calendar_filters_property(start_date, end_date, platform):
    """
    Feature: fase4-oauth-calendar-dashboard, Property 7: Filtros de Calendário
    
    Para qualquer combinação válida de filtros, todos os posts retornados
    devem satisfazer os critérios especificados.
    """
    # Arrange: criar posts de teste
    # Act: chamar GET /api/calendar/posts com filtros
    # Assert: verificar que todos posts satisfazem filtros
    pass
```

### Unit Testing

**Foco**:
- Exemplos específicos de cada endpoint
- Casos extremos (listas vazias, strings muito longas, datas no passado)
- Condições de erro (JWT inválido, IDs inexistentes, dados malformados)
- Integração entre componentes

**Exemplo de Unit Test**:

```python
# backend/tests/test_calendar_endpoints.py

import pytest
from fastapi.testclient import TestClient

def test_list_calendar_posts_empty(client: TestClient, auth_headers):
    """Testa listagem quando não há posts agendados"""
    response = client.get("/api/calendar/posts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["posts"] == []
    assert data["total"] == 0

def test_reschedule_post_to_past_fails(client: TestClient, auth_headers):
    """Testa que não é possível reagendar para data no passado"""
    post_id = "existing-post-id"
    past_date = "2020-01-01T10:00:00Z"
    
    response = client.put(
        f"/api/calendar/posts/{post_id}/reschedule",
        json={"scheduled_at": past_date},
        headers=auth_headers
    )
    
    assert response.status_code == 422
    assert "passado" in response.json()["detail"].lower()

def test_cancel_nonexistent_post_returns_404(client: TestClient, auth_headers):
    """Testa cancelamento de post inexistente"""
    response = client.put(
        "/api/calendar/posts/nonexistent-id/cancel",
        headers=auth_headers
    )
    assert response.status_code == 404
```

### Integration Testing

**Foco**:
- Fluxos end-to-end (criar post → agendar → reagendar → cancelar)
- Integração com Metricool (usando mocks ou ambiente de teste)
- Sincronização entre banco de dados e Metricool

**Exemplo**:

```python
# backend/tests/test_integration_calendar.py

@pytest.mark.integration
async def test_full_post_lifecycle(client: TestClient, auth_headers, metricool_mock):
    """Testa ciclo completo: criar → agendar → reagendar → cancelar"""
    
    # 1. Criar post via PostRápido
    video_response = client.post(
        "/api/postrapido/upload",
        files={"file": ("video.mp4", b"fake video data", "video/mp4")},
        headers=auth_headers
    )
    assert video_response.status_code == 200
    video_id = video_response.json()["id"]
    
    # 2. Agendar post
    schedule_response = client.post(
        "/api/postrapido/schedule",
        json={
            "video_id": video_id,
            "platform": "instagram",
            "scheduled_at": "2024-12-25T10:00:00Z",
            "content": "Feliz Natal!"
        },
        headers=auth_headers
    )
    assert schedule_response.status_code == 200
    post_id = schedule_response.json()["id"]
    
    # 3. Verificar no calendário
    calendar_response = client.get("/api/calendar/posts", headers=auth_headers)
    posts = calendar_response.json()["posts"]
    assert any(p["id"] == post_id for p in posts)
    
    # 4. Reagendar
    reschedule_response = client.put(
        f"/api/calendar/posts/{post_id}/reschedule",
        json={"scheduled_at": "2024-12-26T14:00:00Z"},
        headers=auth_headers
    )
    assert reschedule_response.status_code == 200
    
    # 5. Cancelar
    cancel_response = client.put(
        f"/api/calendar/posts/{post_id}/cancel",
        headers=auth_headers
    )
    assert cancel_response.status_code == 200
    
    # 6. Verificar cancelamento
    post_response = client.get(f"/api/calendar/posts/{post_id}", headers=auth_headers)
    post = post_response.json()
    assert post["status"] == "cancelled"
    assert post["cancelled_at"] is not None
```

### Frontend Testing

**Unit Tests** (Vitest + React Testing Library):
- Componentes renderizam corretamente
- Interações de usuário (cliques, inputs)
- Estados de loading e erro

**Integration Tests**:
- Fluxos completos de páginas
- Integração com API Client (usando MSW para mock)

**Exemplo**:

```typescript
// frontend/src/pages/Calendar.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { Calendar } from './Calendar';
import { api } from '@/lib/api';
import { vi } from 'vitest';

vi.mock('@/lib/api');

describe('Calendar Page', () => {
  it('should display posts from API', async () => {
    const mockPosts = [
      {
        id: '1',
        content: 'Test post',
        platform: 'instagram',
        scheduled_at: '2024-12-25T10:00:00Z',
        status: 'scheduled',
      },
    ];
    
    vi.mocked(api.calendar.listPosts).mockResolvedValue({
      posts: mockPosts,
      total: 1,
    });
    
    render(<Calendar />);
    
    await waitFor(() => {
      expect(screen.getByText('Test post')).toBeInTheDocument();
    });
  });
  
  it('should handle reschedule action', async () => {
    // Test implementation...
  });
});
```

### Test Coverage Goals

- **Backend**: Mínimo 80% de cobertura de código
- **Frontend**: Mínimo 70% de cobertura de componentes
- **Property Tests**: Todas as 25 properties implementadas
- **Integration Tests**: Todos os fluxos críticos cobertos

### Continuous Integration

Todos os testes devem passar antes de merge:

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run backend tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=app --cov-report=xml
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run frontend tests
        run: |
          cd frontend
          npm install
          npm run test -- --coverage
```
