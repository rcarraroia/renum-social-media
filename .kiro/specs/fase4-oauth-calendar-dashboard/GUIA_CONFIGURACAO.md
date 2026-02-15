# Guia de Configuração - Fase 4

## Pré-requisitos

- Node.js 18+ instalado
- Python 3.9+ instalado
- Conta Supabase configurada
- (Opcional) Conta Metricool Advanced ($45/mês)
- (Opcional) Conta HeyGen

## Configuração do Backend

### 1. Instalar Dependências

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `backend/.env`:

```bash
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key

# Metricool (opcional)
METRICOOL_ACCESS_TOKEN=seu-token-metricool

# HeyGen (opcional - pode ser configurado por organização via UI)
HEYGEN_API_KEY=seu-api-key-heygen

# Configurações opcionais
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Aplicar Migrations

```bash
cd backend
# Executar migrations do Supabase
# (instruções específicas dependem da configuração do projeto)
```

### 4. Iniciar Backend

```bash
cd backend
uvicorn app.main:app --reload
```

O backend estará disponível em `http://localhost:8000`

Documentação Swagger: `http://localhost:8000/docs`

## Configuração do Frontend

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `frontend/.env.local`:

```bash
# API Backend
VITE_API_URL=http://localhost:8000

# Supabase (apenas para autenticação)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=seu-anon-key
```

### 3. Iniciar Frontend

```bash
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## Configuração de Integrações

### HeyGen (Opcional)

1. Criar conta em https://heygen.com
2. Obter API Key em Settings → API
3. Obter Avatar ID e Voice ID
4. Configurar no RENUM:
   - Ir para Settings → Integrações → HeyGen
   - Inserir API Key, Avatar ID e Voice ID
   - Clicar em "Testar Conexão"
   - Clicar em "Salvar Configuração"

### Metricool (Opcional)

1. Criar conta Metricool Advanced em https://metricool.com
2. Obter Access Token em Settings → API
3. Configurar no backend (.env):
   ```bash
   METRICOOL_ACCESS_TOKEN=seu-token
   ```
4. Reiniciar backend

### Redes Sociais

Para conectar redes sociais (Instagram, TikTok, LinkedIn, Facebook, X, YouTube):

1. Ir para Settings → Integrações → Redes Sociais Conectadas
2. Clicar em "Conectar" na plataforma desejada
3. Autorizar o acesso na janela OAuth que abre
4. Aguardar confirmação de conexão

**Nota**: A conexão de redes sociais depende do Metricool estar configurado.

## Verificação da Instalação

### 1. Verificar Backend

```bash
curl http://localhost:8000/health
```

Resposta esperada:
```json
{
  "status": "ok"
}
```

### 2. Verificar Swagger

Acessar `http://localhost:8000/docs` e verificar que todos os endpoints estão listados:
- Dashboard
- ScriptAI
- PostRápido
- AvatarAI
- Calendar
- Integrations (HeyGen, Metricool, Social Accounts)

### 3. Verificar Frontend

1. Acessar `http://localhost:5173`
2. Fazer login
3. Verificar que Dashboard carrega sem erros
4. Abrir DevTools → Network tab
5. Verificar que requisições vão para `http://localhost:8000/api/*`

## Troubleshooting

### Backend não inicia

**Erro**: `ModuleNotFoundError: No module named 'fastapi'`
**Solução**: Instalar dependências com `pip install -r requirements.txt`

**Erro**: `SUPABASE_URL not found`
**Solução**: Criar arquivo `.env` no diretório `backend/` com as variáveis necessárias

### Frontend não conecta ao Backend

**Erro**: `Network Error` ou `Failed to fetch`
**Solução**: 
1. Verificar que backend está rodando em `http://localhost:8000`
2. Verificar que `VITE_API_URL` está configurada corretamente em `.env.local`
3. Verificar CORS no backend

### Sessão expira rapidamente

**Causa**: JWT do Supabase tem tempo de expiração curto
**Solução**: Configurar refresh token no Supabase ou aumentar tempo de expiração

### OAuth não funciona

**Causa**: Redirect URI não configurado no Metricool
**Solução**: 
1. Verificar logs do backend
2. Configurar redirect URI correto no Metricool
3. Verificar que `METRICOOL_ACCESS_TOKEN` está configurado

## Estrutura de Logs

O backend registra logs estruturados em formato JSON:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "request_id": "abc-123",
  "organization_id": "org-456",
  "module": "scriptai",
  "endpoint": "/api/scriptai/generate",
  "status_code": 200,
  "message": "Script generated successfully"
}
```

Para visualizar logs:
```bash
cd backend
tail -f logs/app.log
```

## Próximos Passos

Após configuração completa:

1. Executar checklist de validação (ver `CHECKLIST_VALIDACAO.md`)
2. Testar todos os fluxos principais
3. Configurar ambiente de produção
4. Deploy

## Suporte

Para problemas ou dúvidas:
1. Verificar logs do backend
2. Verificar console do browser (DevTools)
3. Consultar documentação Swagger em `/docs`
4. Verificar este guia de troubleshooting
