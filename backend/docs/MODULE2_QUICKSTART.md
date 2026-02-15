# Módulo 2 (PostRápido) - Guia Rápido

## Configuração Inicial

### 1. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no `.env`:

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
ANTHROPIC_API_KEY=your_anthropic_key

# Transcription (escolha uma)
DEEPGRAM_API_KEY=your_deepgram_key  # Recomendado para produção
WHISPER_MODEL=base  # Fallback local

# Metricool (configurado por organização)
# Tokens são salvos na tabela organizations

# Encryption
ENCRYPTION_KEY=your_32_byte_key

# Storage
TEMP_VIDEO_PATH=/tmp/videos
```

### 2. Dependências do Sistema

```bash
# FFmpeg (obrigatório)
# Windows: choco install ffmpeg
# Linux: apt-get install ffmpeg
# Mac: brew install ffmpeg

# Python dependencies
pip install -r requirements.txt

# Whisper (opcional, para transcrição local)
pip install openai-whisper
```

### 3. Supabase Storage

Crie os seguintes buckets no Supabase:

```sql
-- Bucket para vídeos originais
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos-raw', 'videos-raw', true);

-- Bucket para vídeos processados
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos-processed', 'videos-processed', true);
```

## Fluxo de Uso

### Passo 1: Upload de Vídeo

```bash
curl -X POST http://localhost:8000/api/modules/2/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@video.mp4" \
  -F "title=Meu Vídeo"
```

**Response:**
```json
{
  "videoId": "abc-123",
  "videoUrl": "https://...",
  "duration": 120.5,
  "metadata": {...}
}
```

### Passo 2: Transcrição

```bash
curl -X POST http://localhost:8000/api/modules/2/transcribe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "abc-123",
    "language": "pt"
  }'
```

### Passo 3: Detecção de Silêncios (Opcional)

```bash
curl -X POST http://localhost:8000/api/modules/2/detect-silences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "abc-123",
    "minSilenceDuration": 1.0,
    "silenceThreshold": -30
  }'
```

### Passo 4: Processamento

```bash
curl -X POST http://localhost:8000/api/modules/2/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "abc-123",
    "subtitles": {
      "enabled": true,
      "style": {
        "preset": "word-by-word",
        "fontSize": 32,
        "textColor": "#FFFFFF",
        "backgroundColor": "#000000"
      },
      "segments": [...]
    },
    "trim": {
      "start": 0,
      "end": 120
    }
  }'
```

**Response:**
```json
{
  "jobId": "job-456",
  "status": "processing",
  "message": "Vídeo em processamento"
}
```

### Passo 5: Polling de Status

```bash
curl -X GET http://localhost:8000/api/modules/2/process/job-456/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "jobId": "job-456",
  "status": "completed",
  "progress": 100,
  "currentStep": "Concluído",
  "processedVideoUrl": "https://...",
  "processedDuration": 118.2,
  "processedSizeMb": 45.3
}
```

### Passo 6: Geração de Descrições

```bash
curl -X POST http://localhost:8000/api/modules/2/generate-descriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "abc-123",
    "platforms": ["linkedin", "instagram", "tiktok"],
    "tone": "profissional",
    "includeHashtags": true
  }'
```

### Passo 7: Agendamento

```bash
curl -X POST http://localhost:8000/api/modules/2/schedule \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "abc-123",
    "schedules": [
      {
        "platform": "linkedin",
        "description": "Confira este conteúdo incrível! #marketing",
        "scheduledAt": "2026-02-20T18:00:00Z"
      },
      {
        "platform": "instagram",
        "description": "Novo vídeo no ar! 🚀 #reels #conteudo",
        "scheduledAt": "2026-02-20T18:00:00Z"
      }
    ]
  }'
```

## Exemplos de Código

### Python Client

```python
import requests
import time

class Module2Client:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {token}"}
    
    def upload_video(self, file_path, title=None):
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'title': title} if title else {}
            response = requests.post(
                f"{self.base_url}/api/modules/2/upload",
                headers=self.headers,
                files=files,
                data=data
            )
        return response.json()
    
    def transcribe(self, video_id, language="pt"):
        response = requests.post(
            f"{self.base_url}/api/modules/2/transcribe",
            headers=self.headers,
            json={"videoId": video_id, "language": language}
        )
        return response.json()
    
    def process_video(self, video_id, config):
        response = requests.post(
            f"{self.base_url}/api/modules/2/process",
            headers=self.headers,
            json={"videoId": video_id, **config}
        )
        return response.json()
    
    def wait_for_processing(self, job_id, timeout=600):
        start = time.time()
        while time.time() - start < timeout:
            response = requests.get(
                f"{self.base_url}/api/modules/2/process/{job_id}/status",
                headers=self.headers
            )
            data = response.json()
            
            if data["status"] == "completed":
                return data
            elif data["status"] == "error":
                raise Exception(f"Processing failed: {data['error']}")
            
            time.sleep(5)
        
        raise TimeoutError("Processing timeout")
    
    def generate_descriptions(self, video_id, platforms, tone="profissional"):
        response = requests.post(
            f"{self.base_url}/api/modules/2/generate-descriptions",
            headers=self.headers,
            json={
                "videoId": video_id,
                "platforms": platforms,
                "tone": tone,
                "includeHashtags": True
            }
        )
        return response.json()
    
    def schedule_posts(self, video_id, schedules):
        response = requests.post(
            f"{self.base_url}/api/modules/2/schedule",
            headers=self.headers,
            json={"videoId": video_id, "schedules": schedules}
        )
        return response.json()

# Uso
client = Module2Client("http://localhost:8000", "your_jwt_token")

# Upload
result = client.upload_video("video.mp4", "Meu Vídeo")
video_id = result["videoId"]

# Transcrição
transcription = client.transcribe(video_id)

# Processamento
job = client.process_video(video_id, {
    "subtitles": {
        "enabled": True,
        "style": {"preset": "word-by-word"},
        "segments": transcription["segments"]
    }
})

# Aguardar processamento
processed = client.wait_for_processing(job["jobId"])

# Gerar descrições
descriptions = client.generate_descriptions(
    video_id,
    ["linkedin", "instagram"]
)

# Agendar
scheduled = client.schedule_posts(video_id, [
    {
        "platform": "linkedin",
        "description": descriptions["descriptions"]["linkedin"]["text"],
        "scheduledAt": "2026-02-20T18:00:00Z"
    }
])
```

### JavaScript/TypeScript Client

```typescript
class Module2Client {
  constructor(private baseUrl: string, private token: string) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return response.json();
  }

  async uploadVideo(file: File, title?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return this.request('/api/modules/2/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async transcribe(videoId: string, language = 'pt') {
    return this.request('/api/modules/2/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, language }),
    });
  }

  async processVideo(videoId: string, config: any) {
    return this.request('/api/modules/2/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, ...config }),
    });
  }

  async getProcessStatus(jobId: string) {
    return this.request(`/api/modules/2/process/${jobId}/status`);
  }

  async waitForProcessing(jobId: string, timeout = 600000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const status = await this.getProcessStatus(jobId);
      
      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'error') {
        throw new Error(`Processing failed: ${status.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Processing timeout');
  }

  async generateDescriptions(
    videoId: string,
    platforms: string[],
    tone = 'profissional'
  ) {
    return this.request('/api/modules/2/generate-descriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        platforms,
        tone,
        includeHashtags: true,
      }),
    });
  }

  async schedulePosts(videoId: string, schedules: any[]) {
    return this.request('/api/modules/2/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, schedules }),
    });
  }
}

// Uso
const client = new Module2Client('http://localhost:8000', 'your_jwt_token');

// Fluxo completo
async function processAndSchedule(videoFile: File) {
  // Upload
  const upload = await client.uploadVideo(videoFile, 'Meu Vídeo');
  console.log('Video uploaded:', upload.videoId);

  // Transcrição
  const transcription = await client.transcribe(upload.videoId);
  console.log('Transcription completed');

  // Processamento
  const job = await client.processVideo(upload.videoId, {
    subtitles: {
      enabled: true,
      style: { preset: 'word-by-word' },
      segments: transcription.segments,
    },
  });
  console.log('Processing started:', job.jobId);

  // Aguardar
  const processed = await client.waitForProcessing(job.jobId);
  console.log('Processing completed:', processed.processedVideoUrl);

  // Descrições
  const descriptions = await client.generateDescriptions(
    upload.videoId,
    ['linkedin', 'instagram']
  );
  console.log('Descriptions generated');

  // Agendar
  const scheduled = await client.schedulePosts(upload.videoId, [
    {
      platform: 'linkedin',
      description: descriptions.descriptions.linkedin.text,
      scheduledAt: '2026-02-20T18:00:00Z',
    },
  ]);
  console.log('Posts scheduled:', scheduled.scheduled.length);
}
```

## Troubleshooting

### Erro: "FFmpeg not found"
```bash
# Instale o FFmpeg
# Windows: choco install ffmpeg
# Linux: apt-get install ffmpeg
# Mac: brew install ffmpeg
```

### Erro: "Anthropic API key not configured"
```bash
# Configure a chave no .env
ANTHROPIC_API_KEY=your_key_here
```

### Erro: "Plataformas não conectadas"
```bash
# Configure o Metricool na organização
# Via endpoint /integrations/metricool/connect
```

### Processamento muito lento
- Use Deepgram em vez de Whisper para transcrição
- Reduza a resolução do vídeo antes do upload
- Use vídeos mais curtos para testes

### Job não completa
- Verifique logs do backend
- Verifique se FFmpeg está instalado
- Verifique espaço em disco em /tmp

## Limites e Restrições

### Upload
- Free: 100MB
- Starter: 500MB
- Pro: 2GB

### Formatos Suportados
- MP4, MOV, AVI, WebM

### Plataformas
- LinkedIn, Instagram, Facebook, X, TikTok, YouTube, Pinterest

### Descrições
- Limites de caracteres respeitados por plataforma
- Hashtags geradas automaticamente

## Próximos Passos

Após dominar o Módulo 2, explore:
- **Módulo 3**: Avatar com IA
- **Módulo 4**: Clipes Virais
- **Módulo 5**: Pesquisa de Tendências

---

**Documentação completa:** `backend/docs/FASE_1_COMPLETED.md`
