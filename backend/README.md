# RENUM Social AI - Backend API

Backend FastAPI para automação de conteúdo em redes sociais com IA.

## 🚀 Quick Start

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 2. Build e start
docker-compose up -d

# 3. Verificar health
curl http://localhost:8000/health
```

## 📚 Documentação

Toda a documentação está organizada na pasta `docs/`:

- **[FASE_0_SETUP.md](docs/FASE_0_SETUP.md)** - Guia completo de setup e configuração
- **[FASE_0_COMPLETED.md](docs/FASE_0_COMPLETED.md)** - Resumo das implementações da FASE 0
- **[README.md](docs/README.md)** - Documentação detalhada da API

## 🏗️ Estrutura

```
backend/
├── app/                    # Código da aplicação
│   ├── api/               # Rotas e endpoints
│   ├── core/              # Configuração e segurança
│   ├── models/            # Schemas e enums
│   ├── services/          # Serviços (AI, vídeo, etc.)
│   └── utils/             # Utilitários
├── docs/                  # Documentação (não vai para Docker)
├── migrations/            # SQL migrations (não vai para Docker)
├── .env.example           # Template de variáveis de ambiente
├── docker-compose.yml     # Configuração Docker
├── Dockerfile             # Imagem Docker
└── requirements.txt       # Dependências Python
```

## 🔧 Tecnologias

- **FastAPI** - Framework web async
- **Supabase** - Database + Auth + Storage
- **FFmpeg** - Processamento de vídeo
- **Whisper/Deepgram** - Transcrição de áudio
- **Claude AI** - Geração de conteúdo
- **Docker** - Containerização

## 📖 Endpoints Principais

- `GET /health` - Health check com status dos serviços
- `GET /ready` - Readiness check
- `POST /api/modules/*` - Endpoints dos módulos (ScriptAI, PostRápido, AvatarAI)
- `GET /api/integrations/*` - Integrações (Metricool, HeyGen, etc.)

## 🔐 Segurança

- JWT authentication em todas as rotas protegidas
- RLS (Row-Level Security) no Supabase
- Criptografia de API keys sensíveis
- CORS configurado para frontend Vercel

## 🧪 Desenvolvimento

```bash
# Logs em tempo real
docker-compose logs -f

# Entrar no container
docker-compose exec backend bash

# Rebuild após mudanças
docker-compose build --no-cache
docker-compose up -d
```

## 📦 Deploy

O `.dockerignore` garante que apenas o código necessário vai para produção:
- ✅ Código da aplicação (`app/`)
- ✅ Dependências (`requirements.txt`)
- ❌ Documentação (`docs/`)
- ❌ Migrations (`migrations/`)
- ❌ Arquivos de desenvolvimento

## 🆘 Troubleshooting

Consulte [FASE_0_SETUP.md](docs/FASE_0_SETUP.md) para soluções de problemas comuns.

## 📝 Licença

Proprietary - RENUM Social AI
