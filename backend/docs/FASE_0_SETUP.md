# FASE 0 — SETUP E VERIFICAÇÃO

## Pré-requisitos

1. Docker e Docker Compose instalados
2. Acesso ao Supabase (URL e Service Role Key)
3. Python 3.11+ (para testes locais)

## Passo 1: Configurar Variáveis de Ambiente

```bash
cd backend
cp .env.example .env
```

Edite o `.env` e preencha:

### Obrigatórias:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY` (gerar com: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`)

### Opcionais (mas recomendadas):
- `ANTHROPIC_API_KEY` (para Claude AI)
- `TAVILY_API_KEY` (para pesquisa web)
- `DEEPGRAM_API_KEY` (para transcrição de áudio)
- `METRICOOL_ACCESS_TOKEN` (para agendamento)

## Passo 2: Executar Migrations no Supabase

1. Acesse o Supabase Dashboard → SQL Editor
2. Abra o arquivo `migrations/001_phase_0_schema_updates.sql`
3. Execute o SQL completo
4. Verifique que não há erros

**Verificações importantes:**
- RLS habilitado em todas as tabelas
- Novos campos adicionados (heygen_avatar_id, heygen_voice_id, etc.)
- Campos obsoletos removidos (opusclip_api_key, metricool_*)
- Bucket `videos-processed` criado

## Passo 3: Build e Start do Docker

```bash
# Build da imagem
docker-compose build

# Iniciar o container
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## Passo 4: Verificar Health Check

```bash
curl http://localhost:8000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "version": "0.4.0",
  "services": {
    "supabase": "connected",
    "ffmpeg": "available",
    "transcription": "using_deepgram" ou "available"
  }
}
```

## Passo 5: Testar Encryption Service

```bash
# Entrar no container
docker-compose exec backend python

# No Python shell:
from app.services.encryption import encryption_service

# Test encrypt/decrypt
encrypted = encryption_service.encrypt("test_api_key_123")
print(f"Encrypted: {encrypted}")

decrypted = encryption_service.decrypt(encrypted)
print(f"Decrypted: {decrypted}")

# Should print: test_api_key_123
```

## Passo 6: Testar Auth Middleware

```bash
# Obter um token JWT válido do Supabase Auth (via frontend ou Supabase Dashboard)
TOKEN="eyJhbGc..."

# Testar endpoint protegido (quando implementado)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/protected-endpoint
```

## Checklist de Verificação

Antes de considerar a FASE 0 completa, verificar:

- [ ] Docker build funciona sem erros
- [ ] FFmpeg disponível dentro do container (`docker-compose exec backend ffmpeg -version`)
- [ ] Whisper importável (`docker-compose exec backend python -c "import whisper"`) OU Deepgram configurado
- [ ] Todas as variáveis de ambiente carregam corretamente
- [ ] CORS permite requests do frontend
- [ ] RLS habilitado em todas as 5 tabelas (organizations, users, videos, posts, api_logs)
- [ ] Policies de RLS testadas (usuário A não vê dados de usuário B)
- [ ] Campos novos adicionados às tabelas
- [ ] Campos obsoletos removidos
- [ ] Bucket `videos-processed` criado com policies
- [ ] Auth middleware funcional (401 para token inválido)
- [ ] Middleware de plano funcional (403 para plano insuficiente)
- [ ] Health check retornando status correto
- [ ] Encryption service funcional (encrypt/decrypt roundtrip)
- [ ] Estrutura de pastas organizada

## Troubleshooting

### FFmpeg não encontrado
```bash
docker-compose exec backend ffmpeg -version
# Se falhar, rebuild: docker-compose build --no-cache
```

### Erro de conexão com Supabase
- Verificar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env
- Testar conexão: `curl https://YOUR_PROJECT.supabase.co/rest/v1/`

### Erro de ENCRYPTION_KEY
```bash
# Gerar nova chave
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Copiar para .env
```

### CORS errors no frontend
- Verificar ALLOWED_ORIGINS no .env inclui o domínio do frontend
- Formato: `http://localhost:5173,https://renum.vercel.app`

## Próximos Passos

Após completar todos os itens do checklist, você está pronto para:
- **FASE 1**: Implementar Módulo 2 (PostRápido) - Upload, transcrição, legendas
- **FASE 2**: Implementar Módulo 1 (ScriptAI) - Pesquisa e geração de scripts
- **FASE 3**: Implementar Módulo 3 (AvatarAI) - Integração com HeyGen
