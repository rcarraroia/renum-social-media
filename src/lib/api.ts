import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

// Tipos de plataformas sociais
export type SocialPlatform = 
  | 'instagram' 
  | 'tiktok' 
  | 'linkedin' 
  | 'facebook' 
  | 'x' 
  | 'youtube';

// Dashboard
export interface DashboardStats {
  videos_total: number;
  posts_scheduled_month: number;
  posts_published_month: number;
  engagement_total: number;
  connected_platforms: SocialPlatform[];
}

// ScriptAI (Módulo 1)
export interface GenerateScriptRequest {
  topic: string;
  audience?: string;
  tone?: string;
  duration?: number;
  language?: string;
}

export interface ScriptResponse {
  id: string;
  script: string;
  topic: string;
  sources?: string[];
  created_at: string;
}

export interface RegenerateScriptRequest {
  topic: string;
  script: string;
  feedback: string;
  audience?: string;
}

export interface SaveDraftRequest {
  title: string;
  script: string;
  topic?: string;
  audience?: string;
  sources?: string[];
  metadata?: Record<string, any>;
}

export interface DraftResponse {
  id: string;
  title: string;
  script: string;
  topic?: string;
  audience?: string;
  sources?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DraftListResponse {
  drafts: DraftResponse[];
  total: number;
}

export interface UpdateDraftRequest {
  title?: string;
  script?: string;
  topic?: string;
  audience?: string;
  sources?: string[];
  metadata?: Record<string, any>;
}

// PostRápido (Módulo 2)
export interface VideoUploadResponse {
  id: string;
  videoId: string;
  url: string;
  title?: string;
  created_at: string;
}

export interface TranscriptionRequest {
  videoId: string;
  language?: string;
}

export interface TranscriptionResponse {
  videoId: string;
  transcription: string;
  language: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface SilenceDetectionRequest {
  videoId: string;
  minSilenceDuration?: number;
  silenceThreshold?: number;
}

export interface SilenceDetectionResponse {
  videoId: string;
  silences: Array<{
    start: number;
    end: number;
    duration: number;
  }>;
}

export interface VideoProcessRequest {
  videoId: string;
  subtitles?: {
    enabled: boolean;
    style?: {
      fontSize?: number;
      color?: string;
      backgroundColor?: string;
    };
  };
  trim?: {
    start: number;
    end: number;
  };
  silenceRemoval?: {
    enabled: boolean;
  };
}

export interface VideoProcessResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface VideoProcessStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result_url?: string;
  error?: string;
}

export interface DescriptionGenerateRequest {
  videoId: string;
  platforms: SocialPlatform[];
  tone?: string;
  includeHashtags?: boolean;
}

export interface DescriptionGenerateResponse {
  videoId: string;
  descriptions: Record<SocialPlatform, string>;
}

export interface DescriptionRegenerateRequest {
  videoId: string;
  platform: SocialPlatform;
  instructions?: string;
}

export interface ScheduleRequest {
  videoId: string;
  schedules: Array<{
    platform: SocialPlatform;
    description: string;
    scheduledAt: string;
  }>;
}

export interface ScheduleResponse {
  success: boolean;
  scheduled_posts: Array<{
    id: string;
    platform: SocialPlatform;
    scheduled_at: string;
  }>;
}

// AvatarAI (Módulo 3)
export interface VideoGenerationRequest {
  script: string;
  avatarId: string;
  voiceId: string;
  title?: string;
}

export interface VideoGenerationResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface VideoStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

export interface SendToPostRapidoRequest {
  video_id: string;
}

// Integrations - HeyGen
export interface HeyGenConfigRequest {
  api_key: string;
  avatar_id?: string;
  voice_id?: string;
}

export interface Avatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
}

export interface Voice {
  voice_id: string;
  voice_name: string;
  language?: string;
  gender?: string;
}

// Integrations - Social Accounts
export interface PlatformStatus {
  platform: SocialPlatform;
  connected: boolean;
  account_name?: string;
}

export interface SocialAccountsResponse {
  accounts: PlatformStatus[];
}

// Calendar
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

// ============================================================================
// API CLIENT INTERFACE
// ============================================================================

export interface APIClient {
  // Dashboard
  dashboard: {
    getStats(): Promise<DashboardStats>;
  };
  
  // ScriptAI (Módulo 1)
  scriptai: {
    generateScript(request: GenerateScriptRequest): Promise<ScriptResponse>;
    regenerateScript(request: RegenerateScriptRequest): Promise<ScriptResponse>;
    saveDraft(request: SaveDraftRequest): Promise<DraftResponse>;
    listDrafts(): Promise<DraftListResponse>;
    getDraft(draftId: string): Promise<DraftResponse>;
    updateDraft(draftId: string, request: UpdateDraftRequest): Promise<DraftResponse>;
    deleteDraft(draftId: string): Promise<{ message: string }>;
  };
  
  // PostRápido (Módulo 2)
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
  
  // AvatarAI (Módulo 3)
  avatarai: {
    generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
    getVideoStatus(jobId: string): Promise<VideoStatusResponse>;
    sendToPostRapido(request: SendToPostRapidoRequest): Promise<{ success: boolean; message: string; redirect_url: string }>;
  };
  
  // Integrations - HeyGen
  heygen: {
    configure(request: HeyGenConfigRequest): Promise<{ success: boolean; message: string }>;
    test(): Promise<{ success: boolean; message: string }>;
    getCredits(): Promise<{ remaining_credits: number; total_credits: number }>;
    getAvatars(): Promise<{ avatars: Avatar[] }>;
    getVoices(): Promise<{ voices: Voice[] }>;
  };
  
  // Integrations - Metricool
  metricool: {
    test(): Promise<{ success: boolean; message: string }>;
    getStatus(): Promise<{ connected: boolean; blog_id?: string }>;
  };
  
  // Calendar
  calendar: {
    listPosts(query: CalendarQuery): Promise<CalendarResponse>;
    getPost(id: string): Promise<CalendarPost>;
    reschedulePost(id: string, scheduledAt: string): Promise<CalendarPost>;
    cancelPost(id: string): Promise<void>;
  };
  
  // Social Accounts
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

// ============================================================================
// API CLIENT IMPLEMENTATION
// ============================================================================

class APIClientImpl implements APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  /**
   * Método privado para fazer requisições HTTP com autenticação e error handling
   */
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    isFormData: boolean = false
  ): Promise<T> {
    try {
      // Obter token JWT do Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente',
          variant: 'destructive',
        });
        window.location.href = '/login';
        throw new Error('Not authenticated');
      }

      // Preparar headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      // Adicionar Content-Type apenas se não for FormData
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      // Preparar body
      let body: any = undefined;
      if (data) {
        body = isFormData ? data : JSON.stringify(data);
      }

      // Fazer requisição
      const response = await fetch(`${this.baseURL}${path}`, {
        method,
        headers,
        body,
      });

      // Error handling baseado no status code
      if (response.status === 401) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente',
          variant: 'destructive',
        });
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (response.status === 403) {
        const error = await response.json();
        toast({
          title: 'Acesso negado',
          description: error.detail || 'Você não tem permissão para esta ação',
          variant: 'destructive',
        });
        throw new Error(error.detail);
      }

      if (response.status === 404) {
        const error = await response.json();
        toast({
          title: 'Recurso não encontrado',
          description: error.detail || 'O recurso solicitado não foi encontrado',
          variant: 'destructive',
        });
        throw new Error(error.detail);
      }

      if (response.status === 422) {
        const error = await response.json();
        const messages = error.detail?.map((e: any) => e.msg).join(', ') || 'Dados inválidos';
        toast({
          title: 'Dados inválidos',
          description: messages,
          variant: 'destructive',
        });
        throw new Error(messages);
      }

      if (response.status === 429) {
        const error = await response.json();
        toast({
          title: 'Muitas requisições',
          description: error.detail || 'Aguarde um momento antes de tentar novamente',
          variant: 'destructive',
        });
        throw new Error(error.detail);
      }

      if (response.status >= 500) {
        const error = await response.json();
        toast({
          title: 'Erro no servidor',
          description: error.detail || 'Ocorreu um erro no servidor. Tente novamente',
          variant: 'destructive',
        });
        throw new Error(error.detail);
      }

      if (!response.ok) {
        throw new Error('Request failed');
      }

      return response.json();
    } catch (error) {
      // Network error
      if (error instanceof TypeError) {
        toast({
          title: 'Erro de conexão',
          description: 'Verifique sua conexão com a internet',
          variant: 'destructive',
        });
      }
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  dashboard = {
    getStats: async (): Promise<DashboardStats> => {
      return this.request<DashboardStats>('GET', '/api/dashboard/stats');
    },
  };

  // ============================================================================
  // SCRIPTAI (MÓDULO 1)
  // ============================================================================

  scriptai = {
    generateScript: async (request: GenerateScriptRequest): Promise<ScriptResponse> => {
      return this.request<ScriptResponse>('POST', '/api/scriptai/generate', request);
    },

    regenerateScript: async (request: RegenerateScriptRequest): Promise<ScriptResponse> => {
      return this.request<ScriptResponse>('POST', '/api/scriptai/regenerate', request);
    },

    saveDraft: async (request: SaveDraftRequest): Promise<DraftResponse> => {
      return this.request<DraftResponse>('POST', '/api/scriptai/drafts', request);
    },

    listDrafts: async (): Promise<DraftListResponse> => {
      return this.request<DraftListResponse>('GET', '/api/scriptai/drafts');
    },

    getDraft: async (draftId: string): Promise<DraftResponse> => {
      return this.request<DraftResponse>('GET', `/api/scriptai/drafts/${draftId}`);
    },

    updateDraft: async (draftId: string, request: UpdateDraftRequest): Promise<DraftResponse> => {
      return this.request<DraftResponse>('PUT', `/api/scriptai/drafts/${draftId}`, request);
    },

    deleteDraft: async (draftId: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>('DELETE', `/api/scriptai/drafts/${draftId}`);
    },
  };

  // ============================================================================
  // POSTRAPIDO (MÓDULO 2)
  // ============================================================================

  postrapido = {
    upload: async (file: File, title?: string): Promise<VideoUploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      if (title) {
        formData.append('title', title);
      }
      return this.request<VideoUploadResponse>('POST', '/api/postrapido/upload', formData, true);
    },

    transcribe: async (request: TranscriptionRequest): Promise<TranscriptionResponse> => {
      return this.request<TranscriptionResponse>('POST', '/api/postrapido/transcribe', request);
    },

    detectSilences: async (request: SilenceDetectionRequest): Promise<SilenceDetectionResponse> => {
      return this.request<SilenceDetectionResponse>('POST', '/api/postrapido/detect-silences', request);
    },

    process: async (request: VideoProcessRequest): Promise<VideoProcessResponse> => {
      return this.request<VideoProcessResponse>('POST', '/api/postrapido/process', request);
    },

    getProcessStatus: async (jobId: string): Promise<VideoProcessStatus> => {
      return this.request<VideoProcessStatus>('GET', `/api/postrapido/process/${jobId}/status`);
    },

    generateDescriptions: async (request: DescriptionGenerateRequest): Promise<DescriptionGenerateResponse> => {
      return this.request<DescriptionGenerateResponse>('POST', '/api/postrapido/descriptions/generate', request);
    },

    regenerateDescription: async (request: DescriptionRegenerateRequest): Promise<{ [platform: string]: string }> => {
      return this.request<{ [platform: string]: string }>('POST', '/api/postrapido/descriptions/regenerate', request);
    },

    schedule: async (request: ScheduleRequest): Promise<ScheduleResponse> => {
      return this.request<ScheduleResponse>('POST', '/api/postrapido/schedule', request);
    },
  };

  // ============================================================================
  // AVATARAI (MÓDULO 3)
  // ============================================================================

  avatarai = {
    generateVideo: async (request: VideoGenerationRequest): Promise<VideoGenerationResponse> => {
      return this.request<VideoGenerationResponse>('POST', '/api/avatarai/generate', request);
    },

    getVideoStatus: async (jobId: string): Promise<VideoStatusResponse> => {
      return this.request<VideoStatusResponse>('GET', `/api/avatarai/videos/${jobId}/status`);
    },

    sendToPostRapido: async (request: SendToPostRapidoRequest): Promise<{ success: boolean; message: string; redirect_url: string }> => {
      return this.request<{ success: boolean; message: string; redirect_url: string }>('POST', '/api/avatarai/send-to-postrapido', request);
    },
  };

  // ============================================================================
  // INTEGRATIONS - HEYGEN
  // ============================================================================

  heygen = {
    configure: async (request: HeyGenConfigRequest): Promise<{ success: boolean; message: string }> => {
      return this.request<{ success: boolean; message: string }>('POST', '/api/integrations/heygen/configure', request);
    },

    test: async (): Promise<{ success: boolean; message: string }> => {
      return this.request<{ success: boolean; message: string }>('POST', '/api/integrations/heygen/test');
    },

    getCredits: async (): Promise<{ remaining_credits: number; total_credits: number }> => {
      return this.request<{ remaining_credits: number; total_credits: number }>('GET', '/api/integrations/heygen/credits');
    },

    getAvatars: async (): Promise<{ avatars: Avatar[] }> => {
      return this.request<{ avatars: Avatar[] }>('GET', '/api/integrations/heygen/avatars');
    },

    getVoices: async (): Promise<{ voices: Voice[] }> => {
      return this.request<{ voices: Voice[] }>('GET', '/api/integrations/heygen/voices');
    },
  };

  // ============================================================================
  // INTEGRATIONS - METRICOOL
  // ============================================================================

  metricool = {
    test: async (): Promise<{ success: boolean; message: string }> => {
      return this.request<{ success: boolean; message: string }>('POST', '/api/integrations/metricool/test');
    },

    getStatus: async (): Promise<{ connected: boolean; blog_id?: string }> => {
      return this.request<{ connected: boolean; blog_id?: string }>('GET', '/api/integrations/metricool/status');
    },
  };

  // ============================================================================
  // CALENDAR
  // ============================================================================

  calendar = {
    listPosts: async (query: CalendarQuery): Promise<CalendarResponse> => {
      const params = new URLSearchParams();
      if (query.start_date) params.append('start_date', query.start_date);
      if (query.end_date) params.append('end_date', query.end_date);
      if (query.platform) params.append('platform', query.platform);
      if (query.status) params.append('status', query.status);
      
      const queryString = params.toString();
      const path = queryString ? `/api/calendar/posts?${queryString}` : '/api/calendar/posts';
      
      return this.request<CalendarResponse>('GET', path);
    },

    getPost: async (id: string): Promise<CalendarPost> => {
      return this.request<CalendarPost>('GET', `/api/calendar/posts/${id}`);
    },

    reschedulePost: async (id: string, scheduledAt: string): Promise<CalendarPost> => {
      return this.request<CalendarPost>('PUT', `/api/calendar/posts/${id}/reschedule`, {
        scheduled_at: scheduledAt,
      });
    },

    cancelPost: async (id: string): Promise<void> => {
      await this.request<{ message: string }>('PUT', `/api/calendar/posts/${id}/cancel`);
    },
  };

  // ============================================================================
  // SOCIAL ACCOUNTS
  // ============================================================================

  social = {
    listAccounts: async (): Promise<SocialAccountsResponse> => {
      return this.request<SocialAccountsResponse>('GET', '/api/integrations/social-accounts');
    },

    connect: async (platform: string): Promise<{ authorization_url: string }> => {
      return this.request<{ authorization_url: string }>('POST', '/api/integrations/social-accounts/connect', {
        platform,
      });
    },

    disconnect: async (platform: string): Promise<void> => {
      await this.request<{ message: string }>('DELETE', `/api/integrations/social-accounts/${platform}`);
    },
  };

  // ============================================================================
  // HEALTH
  // ============================================================================

  health = {
    check: async (): Promise<{ status: string }> => {
      return this.request<{ status: string }>('GET', '/health');
    },

    ready: async (): Promise<{ status: string }> => {
      return this.request<{ status: string }>('GET', '/health/ready');
    },
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export const api = new APIClientImpl();
export default api;
