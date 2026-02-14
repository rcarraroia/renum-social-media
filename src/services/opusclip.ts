/**
 * OpusClip API Service
 * Integração direta com a API do OpusClip para corte automático de vídeos
 */

export interface OpusClipProject {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl: string;
  createdAt: string;
}

export interface OpusClipClip {
  id: string;
  projectId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  score: number;
  status: 'ready' | 'processing';
}

export interface CreateProjectRequest {
  videoUrl: string;
  clipLength?: '30' | '60' | '90';
  aspectRatio?: '9:16' | '16:9' | '1:1';
  language?: string;
  keywords?: string[];
}

export class OpusClipService {
  private apiKey: string;
  private baseUrl = 'https://api.opus.pro/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`OpusClip API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cria um novo projeto de corte de vídeo
   */
  async createProject(request: CreateProjectRequest): Promise<OpusClipProject> {
    return this.makeRequest<OpusClipProject>('/clip-projects', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Obtém o status de um projeto
   */
  async getProjectStatus(projectId: string): Promise<OpusClipProject> {
    return this.makeRequest<OpusClipProject>(`/clip-projects/${projectId}`);
  }

  /**
   * Obtém os clips gerados de um projeto
   */
  async getClips(projectId: string): Promise<OpusClipClip[]> {
    const response = await this.makeRequest<{ clips: OpusClipClip[] }>(
      `/exportable-clips?projectId=${projectId}`
    );
    return response.clips;
  }

  /**
   * Obtém todos os clips exportáveis
   */
  async getAllExportableClips(): Promise<OpusClipClip[]> {
    const response = await this.makeRequest<{ clips: OpusClipClip[] }>(
      '/exportable-clips'
    );
    return response.clips;
  }

  /**
   * Exporta um clip específico
   */
  async exportClip(clipId: string): Promise<{ downloadUrl: string }> {
    return this.makeRequest<{ downloadUrl: string }>(`/clips/${clipId}/export`, {
      method: 'POST',
    });
  }
}

// Instância singleton para uso global
let opusClipInstance: OpusClipService | null = null;

export const getOpusClipService = (): OpusClipService => {
  if (!opusClipInstance) {
    const apiKey = process.env.OPUSCLIP_API_KEY;
    if (!apiKey) {
      throw new Error('OPUSCLIP_API_KEY environment variable is required');
    }
    opusClipInstance = new OpusClipService(apiKey);
  }
  return opusClipInstance;
};