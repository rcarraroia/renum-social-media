# 🔧 Setup dos MCPs para Backend e Automações

## 📋 Pré-requisitos

Antes de configurar os MCPs, certifique-se de ter:

- **Python 3.10+** instalado
- **Node.js 18+** instalado  
- **uv** (Python package manager)
- **npx** (vem com Node.js)

### Instalando uv (se não tiver):

**Windows:**
```powershell
irm https://astral.sh/uv/install.ps1 | iex
```

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 🔑 Configuração das API Keys

### 1. **Metricool MCP**
- **Funcionalidades**: Análise de métricas, agendamento de posts, dados de campanhas
- **Requisitos**: Conta Metricool Advanced Tier
- **Como obter**:
  1. Acesse [Metricool](https://metricool.com)
  2. Vá em Settings > API
  3. Copie seu `USER_TOKEN` e `USER_ID`

### 2. **Tavily MCP** 
- **Funcionalidades**: Pesquisa web em tempo real, extração de conteúdo
- **Como obter**:
  1. Acesse [Tavily](https://tavily.com)
  2. Crie uma conta
  3. Copie sua API key (formato: `tvly-...`)

### 3. **HeyGen MCP**
- **Funcionalidades**: Geração de vídeos com avatares IA
- **Como obter**:
  1. Acesse [HeyGen](https://heygen.com)
  2. Vá em Settings > API Keys
  3. Crie uma nova API key

### 4. **OpusClip API** (Sem MCP - Integração Direta)
- **Funcionalidades**: Corte automático de vídeos longos em clips virais
- **Status**: API em beta fechado para clientes high-volume
- **Alternativa**: Integração direta via HTTP requests

## ⚙️ Configuração

### Passo 1: Atualizar as API Keys

Edite o arquivo `.kiro/settings/mcp.json` e substitua os placeholders:

```json
{
  "mcpServers": {
    "metricool": {
      "env": {
        "METRICOOL_USER_TOKEN": "seu_token_aqui",
        "METRICOOL_USER_ID": "seu_user_id_aqui"
      }
    },
    "tavily": {
      "env": {
        "TAVILY_API_KEY": "tvly-sua_key_aqui"
      }
    },
    "heygen": {
      "env": {
        "HEYGEN_API_KEY": "sua_heygen_key_aqui"
      }
    }
  }
}
```

### Passo 2: Testar as Conexões

Após configurar, reinicie o Kiro e teste cada MCP:

1. **Metricool**: Teste com `get_brands()` 
2. **Tavily**: Teste com pesquisa web
3. **HeyGen**: Teste com `get_remaining_credits()`

## 🛠️ Ferramentas Disponíveis

### **Metricool MCP Tools:**
- `get_brands()` - Lista marcas da conta
- `get_instagram_posts()` - Posts do Instagram
- `get_tiktok_videos()` - Vídeos do TikTok
- `post_schedule_post()` - Agendar posts
- `get_analytics()` - Métricas detalhadas
- `get_best_time_to_post()` - Melhores horários

### **Tavily MCP Tools:**
- `tavily_search()` - Pesquisa web em tempo real
- `tavily_extract()` - Extração de conteúdo de URLs

### **HeyGen MCP Tools:**
- `get_remaining_credits()` - Créditos restantes
- `get_voices()` - Lista de vozes disponíveis
- `get_avatars_in_avatar_group()` - Avatares disponíveis
- `generate_avatar_video()` - Gerar vídeo com avatar
- `get_avatar_video_status()` - Status do vídeo

## 🔄 Integração com OpusClip (API Direta)

Como OpusClip não tem MCP oficial, criaremos um serviço wrapper:

```typescript
// src/services/opusclip.ts
export class OpusClipService {
  private apiKey: string;
  private baseUrl = 'https://api.opus.pro/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createProject(videoUrl: string) {
    // Implementar chamada para /clip-projects
  }

  async getClips(projectId: string) {
    // Implementar chamada para /exportable-clips
  }
}
```

## 🚀 Próximos Passos

1. **Configure as API keys** nos arquivos de ambiente
2. **Teste cada MCP** individualmente
3. **Implemente os workflows** de automação
4. **Crie as integrações** com o banco Supabase
5. **Desenvolva as automações** Python/TypeScript

## 🔍 Troubleshooting

### Problemas Comuns:

**MCP não conecta:**
- Verifique se `uv` e `npx` estão instalados
- Confirme se as API keys estão corretas
- Reinicie o Kiro após mudanças na configuração

**Erro de permissões:**
- No Windows, habilite "Developer Mode" no Kiro
- Verifique se as API keys têm as permissões necessárias

**Timeout de conexão:**
- Verifique sua conexão com internet
- Confirme se os serviços estão online