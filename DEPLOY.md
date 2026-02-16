# 🚀 Guia de Deploy

## Frontend (Vercel) - Landing Page

### Pré-requisitos
- Conta no Vercel (https://vercel.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)

### Passo a Passo

#### 1. Preparar o Repositório
```bash
# Adicionar arquivos ao Git
git add .
git commit -m "feat: preparar deploy da landing page"
git push origin main
```

#### 2. Deploy no Vercel

**Opção A: Via Dashboard**
1. Acesse https://vercel.com/new
2. Importe seu repositório
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

**Opção B: Via CLI**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

#### 3. Configurar Variáveis de Ambiente

No dashboard do Vercel, vá em:
- Settings → Environment Variables

**Variáveis OBRIGATÓRIAS:**
```
VITE_SUPABASE_URL=https://zbsbfhmsgrlohxdxihaw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_uqML_JBZAc6sOa21oU74QQ_oJ-x96Ic
```

**Variáveis OPCIONAIS (para quando o backend estiver pronto):**
```
VITE_API_URL=https://seu-backend-na-vps.com
```

⚠️ **IMPORTANTE**: 
- Use as mesmas credenciais do Supabase que estão no seu `.env` local
- NÃO exponha a `SERVICE_ROLE` key no frontend (apenas backend)
- Por enquanto, o formulário de leads pode não funcionar sem o backend

#### 4. Configurar Domínio Customizado (Opcional)

1. Vá em Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

### 🎯 O que será deployado

✅ Landing Page (`/posts-flows`)
✅ Formulário de captura de leads (5 passos)
✅ Seções de benefícios e diferenciais
✅ Countdown para lançamento (06/03/2026)

### ❌ O que NÃO será deployado

- Backend (FastAPI)
- Arquivos de desenvolvimento (.kiro, .agent, etc)
- Documentação interna (AGENTS.md, AI_RULES.md, etc)

### 📝 Notas Importantes

1. **Formulário de Leads**: Por enquanto, o formulário tentará enviar para `/api/leads`. Você pode:
   - Configurar um backend temporário
   - Usar um serviço como Formspree/Netlify Forms
   - Aguardar o deploy do backend completo

2. **Data de Lançamento**: Configurada para 06/03/2026

3. **Rota da Landing**: Acesse via `seu-dominio.vercel.app/posts-flows`

### 🔄 Atualizações Automáticas

Após o primeiro deploy, toda vez que você fizer push para a branch `main`, o Vercel fará deploy automático!

---

## Backend (Easypanel) - Para depois

O deploy do backend será feito posteriormente no Easypanel/VPS.
Data prevista: 06/03/2026
