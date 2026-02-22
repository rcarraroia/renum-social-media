# Design: Refatoração Integração HeyGen com Wizard

## Overview

Refatoração para melhorar UX da integração HeyGen: remover do onboarding principal, criar wizard de 2 passos no módulo AvatarAI, voz como atributo do avatar, API Key manual para MVP, clone criado na plataforma HeyGen.

## Arquitetura

Frontend: Onboarding (3 passos) → Module3/AvatarAI → HeyGenSetupWizard (2 passos) + HeyGenCloneGuide (modal)
Backend: POST /validate-key, PUT /heygen, GET /avatars, GET /voices → HeyGenService → HeyGen API
Database: organizations table (heygen_api_key, heygen_access_token, heygen_avatar_id, heygen_voice_id)

## Componentes Principais

### 1. Onboarding.tsx (Modificado)
- Remove Passo 3 (Avatar AI)
- Mantém 3 passos: Perfil → Conectar Redes → Pronto
- Ajusta onboarding_step no banco (valores 1-3)

### 2. Module3.tsx (Modificado)
- Remove banner amarelo atual
- Quando HeyGen não configurado: exibe wizard (substitui tela inteira)
- Quando configurado: exibe módulo normal
- Header: miniatura avatar + créditos + botão "Trocar avatar"

### 3. HeyGenSetupWizard.tsx (Novo - 2 passos)

**Passo 1 - Conectar API Key:**
- Campo API Key (type=password) com toggle mostrar/ocultar
- Link "Criar conta grátis no HeyGen" (heygen.com)
- Botão "Conectar" → POST /validate-key (valida, não salva)
- Estados: idle → loading → sucesso/erro
- Validação: chama HeyGen API para verificar validade
- Feedback visual: spinner no botão, mensagem de erro/sucesso
- Não salva no banco (apenas valida)

**Passo 2 - Escolher Avatar e Voz:**
- Grid de avatares (GET /avatars)
- Clones do usuário no topo (badge "Meu Clone")
- Avatares públicos abaixo
- Card especial "Criar meu clone" → abre modal HeyGenCloneGuide
- Ao selecionar avatar: exibe dropdown de vozes compatíveis
- Preview de voz (play button)
- Botão "Salvar" → PUT /heygen (salva api_key, avatar_id, voice_id)
- Desabilita "Salvar" até avatar + voz selecionados

**Estados do Wizard:**
```typescript
interface WizardState {
  currentStep: 1 | 2;
  apiKey: string; // temporário, não persiste
  isValidating: boolean;
  validationError: string | null;
  selectedAvatar: Avatar | null;
  selectedVoice: Voice | null;
  isSaving: boolean;
  saveError: string | null;
}
```

### 4. HeyGenCloneGuide.tsx (Novo - Modal)

**Estrutura:**
- Modal Dialog (shadcn/ui)
- Título: "Criar Meu Clone Digital"
- Instruções passo-a-passo:
  1. Grave vídeo de 2-5 minutos
  2. Boa iluminação, fundo neutro
  3. Fale claramente, olhe para câmera
  4. Acesse HeyGen Studio
  5. Upload do vídeo
  6. Aguarde processamento (15-30 min)
  7. Clone aparecerá na lista de avatares

**Ações:**
- Botão "Ir para HeyGen Studio" (abre studio.heygen.com/instant-avatar)
- Botão "Atualizar lista de avatares" (recarrega GET /avatars)
- Botão "Fechar" (fecha modal, volta ao Passo 2)

**Comportamento:**
- Não bloqueia wizard (usuário pode continuar com avatar padrão)
- Ao fechar, mantém estado do Passo 2
- Ao clicar "Atualizar lista", recarrega avatares e fecha modal


## Backend: Endpoints

### POST /api/integrations/heygen/validate-key

**Propósito:** Validar API Key HeyGen sem salvar no banco de dados.

**Request:**
```typescript
{
  api_key: string;
}
```

**Response (Sucesso - 200):**
```typescript
{
  valid: true,
  credits_remaining: number,
  plan: string
}
```

**Lógica:**
1. Recebe API Key no body
2. Chama HeyGenService.test_credentials(api_key)
3. HeyGenService faz GET /v1/user.info na API HeyGen
4. Se sucesso: retorna valid=true + dados do usuário
5. Se falha: retorna valid=false + mensagem de erro
6. **IMPORTANTE:** Não salva API Key no banco de dados

**Timeout:** 3 segundos máximo

---

### PUT /api/integrations/heygen

**Propósito:** Salvar configuração completa HeyGen (API Key + Avatar + Voz).

**Request:**
```typescript
{
  api_key: string;
  avatar_id: string;
  voice_id: string;
}
```

**Lógica:**
1. Valida que api_key, avatar_id e voice_id estão presentes
2. Valida que avatar_id existe na API HeyGen
3. Valida que voice_id existe na API HeyGen
4. Salva na tabela organizations (transação atômica)
5. Retorna sucesso

**Segurança:** Valida que usuário é owner da organização

---

### GET /api/integrations/heygen/avatars

**Propósito:** Listar avatares disponíveis (públicos + clones do usuário).

**Response:**
```typescript
{
  avatars: Array<{
    avatar_id: string;
    avatar_name: string;
    preview_image_url: string;
    is_clone: boolean;
    gender: "male" | "female";
    compatible_voices: string[];
  }>
}
```

**Cache:** 5 minutos
**Timeout:** 2 segundos máximo

---

### GET /api/integrations/heygen/voices

**Propósito:** Listar vozes disponíveis.

**Query Parameters:**
```typescript
{
  avatar_id?: string; // Filtrar vozes compatíveis
}
```

**Response:**
```typescript
{
  voices: Array<{
    voice_id: string;
    voice_name: string;
    language: string;
    gender: "male" | "female";
    preview_audio_url: string;
  }>
}
```

**Cache:** 5 minutos
**Timeout:** 2 segundos máximo


## Database Schema

### Schema Atual (Validado via SQL)

**Tabela:** `organizations`

**Colunas HeyGen Existentes:**

| Coluna | Tipo | Nullable | Status | Descrição |
|--------|------|----------|--------|-----------|
| `heygen_api_key` | TEXT | YES | ✅ Existe | API Key manual (MVP atual) |
| `heygen_avatar_id` | TEXT | YES | ✅ Existe | ID do avatar selecionado |
| `heygen_voice_id` | TEXT | YES | ✅ Existe | ID da voz selecionada |

**Fonte:** 
- `heygen_api_key`: `supabase/schema.sql` (linha 21)
- `heygen_avatar_id`, `heygen_voice_id`: `backend/migrations/001_phase_0_schema_updates.sql` (linhas 10-11)

### Nova Migration Necessária

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_add_heygen_access_token.sql`

```sql
-- Adicionar coluna heygen_access_token para preparação OAuth futuro
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS heygen_access_token TEXT;

-- Comentário explicativo
COMMENT ON COLUMN organizations.heygen_access_token IS 
'OAuth access token para HeyGen API. NULL no MVP (usa heygen_api_key manual).';

-- Índice para performance em queries que filtram por configuração HeyGen
CREATE INDEX IF NOT EXISTS idx_organizations_heygen_configured 
ON organizations(id) 
WHERE heygen_api_key IS NOT NULL OR heygen_access_token IS NOT NULL;
```

**Justificativa:**
- `heygen_access_token`: Preparação para OAuth futuro (será NULL no MVP)
- Índice parcial: Otimiza queries que verificam se HeyGen está configurado
- Não remove `heygen_api_key`: Mantém compatibilidade com implementação atual

### Políticas RLS (Row Level Security)

**Necessárias para proteger dados sensíveis:**

```sql
-- Apenas membros da organização podem ler configurações HeyGen
CREATE POLICY "organization_members_read_heygen_config"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Apenas owner da organização pode modificar configurações HeyGen
CREATE POLICY "organization_owner_update_heygen_config"
ON organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'owner'
  )
);
```

**Validação de Segurança:**
- API Keys nunca são expostas em logs
- Apenas owner pode modificar configurações
- Transmissão apenas via HTTPS
- RLS garante isolamento entre organizações



## Modelos de Dados

### Interfaces TypeScript (Frontend)

```typescript
// src/types/heygen.ts

interface HeyGenCredentials {
  api_key: string;
  avatar_id: string;
  voice_id: string;
}

interface HeyGenApiKeyOnly {
  api_key: string;
}

interface ValidationResponse {
  valid: boolean;
  credits_remaining: number;
  plan: string;
}

interface Avatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url: string;
  is_clone: boolean;
  gender: "male" | "female";
  compatible_voices: string[];
}

interface Voice {
  voice_id: string;
  voice_name: string;
  language: string;
  gender: "male" | "female";
  preview_audio_url: string;
}

interface WizardState {
  currentStep: 1 | 2;
  apiKey: string;
  isValidating: boolean;
  validationError: string | null;
  selectedAvatar: Avatar | null;
  selectedVoice: Voice | null;
  isSaving: boolean;
  saveError: string | null;
}
```

### Modelos Pydantic (Backend)

```python
# backend/app/models/heygen.py

from pydantic import BaseModel, Field

class HeyGenApiKeyOnly(BaseModel):
    """Modelo para validação de API Key (não salva no banco)"""
    api_key: str = Field(..., min_length=10, description="HeyGen API Key")

class HeyGenCredentials(BaseModel):
    """Modelo para salvar configuração completa HeyGen"""
    api_key: str = Field(..., min_length=10)
    avatar_id: str = Field(..., min_length=1)
    voice_id: str = Field(..., min_length=1)

class ValidationResponse(BaseModel):
    """Resposta da validação de API Key"""
    valid: bool
    credits_remaining: int
    plan: str
```

## Fluxos de Usuário

### Fluxo 1: Novo Usuário (Onboarding Simplificado)

1. Usuário cria conta → Onboarding Passo 1 (Perfil)
2. Passo 2 (Conectar Redes) - pode pular
3. Passo 3 (Pronto) - finaliza onboarding
4. Redireciona para Dashboard
5. HeyGen NÃO é configurado no onboarding
6. Usuário Pro pode configurar depois via Module3

**Validações:**
- onboarding_step salvo como 1, 2 ou 3
- Nenhuma referência a HeyGen durante onboarding
- Campos heygen_* permanecem NULL

### Fluxo 2: Usuário Pro Configura HeyGen (Wizard Completo)

1. Usuário Pro acessa /module-3/avatar-ai
2. Module3 detecta heygen_api_key = NULL
3. Exibe HeyGenSetupWizard (substitui tela inteira)
4. **Passo 1 - API Key:**
   - Usuário digita API Key
   - Clica "Conectar"
   - POST /validate-key → HeyGen API
   - Se válido: avança para Passo 2
   - Se inválido: exibe erro, permanece no Passo 1
5. **Passo 2 - Avatar + Voz:**
   - Carrega avatares (GET /avatars)
   - Carrega vozes (GET /voices)
   - Usuário seleciona avatar
   - Usuário seleciona voz compatível
   - Clica "Salvar"
   - PUT /heygen → salva no banco
6. Wizard fecha → Module3 recarrega → exibe módulo normal

**Validações:**
- API Key validada antes de avançar
- Avatar e voz selecionados antes de salvar
- Dados salvos atomicamente no banco

### Fluxo 3: Usuário Troca Avatar

1. Usuário está no Module3 (HeyGen configurado)
2. Header exibe: avatar atual + créditos + botão "Trocar avatar"
3. Clica "Trocar avatar"
4. Abre HeyGenSetupWizard no Passo 2 (pula Passo 1)
5. Avatar e voz atuais pré-selecionados
6. Usuário escolhe novo avatar + voz
7. Clica "Salvar"
8. PUT /heygen → atualiza avatar_id e voice_id
9. Wizard fecha → Module3 atualiza header

**Validações:**
- heygen_api_key mantida (não muda)
- Apenas avatar_id e voice_id atualizados
- Transação atômica

### Fluxo 4: Criar Clone Digital

1. Usuário está no wizard Passo 2
2. Clica card "Quer usar seu próprio rosto?"
3. Abre modal HeyGenCloneGuide
4. Lê instruções passo-a-passo
5. Clica "Ir para HeyGen" → abre studio.heygen.com em nova aba
6. **Na plataforma HeyGen:**
   - Cria Instant Avatar ou Studio Avatar
   - Faz upload de vídeo
   - Aguarda processamento (15-30 min)
7. Volta ao RENUM
8. Clica "Atualizar lista" no modal
9. GET /avatars → clone aparece na seção "Seus Clones"
10. Fecha modal → seleciona clone → escolhe voz → salva

**Validações:**
- Modal não bloqueia wizard (pode fechar e continuar)
- Clone criado na plataforma HeyGen (não no RENUM)
- Atualizar lista recarrega avatares sem fechar wizard

## Estados e Transições

### Máquina de Estados do Wizard

```
[Idle - Passo 1]
    ↓ (usuário digita API Key)
[Validating]
    ↓ (POST /validate-key)
    ├─ Sucesso → [Success - Passo 1] → [Idle - Passo 2]
    └─ Erro → [Error - Passo 1] → [Idle - Passo 1]

[Idle - Passo 2]
    ↓ (usuário seleciona avatar)
[Avatar Selected]
    ↓ (usuário seleciona voz)
[Avatar + Voice Selected]
    ↓ (clica "Salvar")
[Saving]
    ↓ (PUT /heygen)
    ├─ Sucesso → [Success - Saved] → [Wizard Closed]
    └─ Erro → [Error - Passo 2] → [Avatar + Voice Selected]
```

### Transições Válidas

| Estado Atual | Ação | Próximo Estado | Validação |
|--------------|------|----------------|-----------|
| Idle - Passo 1 | Digitar API Key | Idle - Passo 1 | - |
| Idle - Passo 1 | Clicar "Conectar" | Validating | API Key não vazia |
| Validating | API válida | Success - Passo 1 | HeyGen API retorna 200 |
| Validating | API inválida | Error - Passo 1 | HeyGen API retorna 4xx/5xx |
| Success - Passo 1 | Auto-avança | Idle - Passo 2 | - |
| Idle - Passo 2 | Selecionar avatar | Avatar Selected | - |
| Avatar Selected | Selecionar voz | Avatar + Voice Selected | Voz compatível com avatar |
| Avatar + Voice Selected | Clicar "Salvar" | Saving | Avatar e voz não nulos |
| Saving | Salvo com sucesso | Success - Saved | Banco retorna sucesso |
| Saving | Erro ao salvar | Error - Passo 2 | Banco retorna erro |
| Success - Saved | Auto-fecha | Wizard Closed | - |

## UI/UX Design

### Layout do Wizard (Mobile-First)

**Estrutura:**
- Container centralizado (max-width: 600px desktop, 100% mobile)
- Stepper no topo (1/2, 2/2)
- Conteúdo do passo (formulário ou grid)
- Botões de ação no rodapé (fixo mobile, relativo desktop)

**Passo 1 - API Key:**
```
┌─────────────────────────────────┐
│  [1] Conectar API Key  [2]      │ ← Stepper
├─────────────────────────────────┤
│                                 │
│  Digite sua API Key HeyGen:     │
│  ┌───────────────────────┐ 👁️  │ ← Input + Toggle
│  │ ••••••••••••••••••••  │     │
│  └───────────────────────┘     │
│                                 │
│  Não tem conta?                 │
│  [Criar conta grátis →]         │ ← Link externo
│                                 │
├─────────────────────────────────┤
│           [Conectar →]          │ ← Botão primário
└─────────────────────────────────┘
```

**Passo 2 - Avatar + Voz:**
```
┌─────────────────────────────────┐
│  [1]  [2] Escolher Avatar       │ ← Stepper
├─────────────────────────────────┤
│  ┌─ Seus Clones ──────────────┐ │
│  │ [Avatar 1] [Avatar 2]      │ │ ← Grid clones
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Avatares Públicos ────────┐ │
│  │ [Avatar A] [Avatar B]      │ │ ← Grid públicos
│  │ [Avatar C] [Avatar D]      │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Criar Meu Clone ──────────┐ │
│  │ Quer usar seu próprio      │ │ ← Card especial
│  │ rosto? [Saiba como →]      │ │
│  └────────────────────────────┘ │
│                                 │
│  Voz: [Dropdown PT-BR ▼] 🔊    │ ← Seletor voz
│                                 │
├─────────────────────────────────┤
│  [← Voltar]      [Salvar →]    │ ← Botões
└─────────────────────────────────┘
```

### Componentes UI Reutilizados (shadcn/ui)

- **Button** (src/components/ui/button.tsx)
  - Variantes: default, outline, ghost
  - Tamanhos: sm, md, lg
  - Estados: loading, disabled

- **Input** (src/components/ui/input.tsx)
  - Type: text, password
  - Estados: focus, error, disabled

- **Dialog** (src/components/ui/dialog.tsx)
  - Modal HeyGenCloneGuide
  - Overlay + close button

- **Card** (src/components/ui/card.tsx)
  - Cards de avatares
  - Card "Criar clone"

- **Select** (src/components/ui/select.tsx)
  - Dropdown de vozes

### Cores e Tipografia (Design System Existente)

**Cores:**
- Primária: `bg-primary` (botões principais)
- Secundária: `bg-secondary` (cards, backgrounds)
- Erro: `text-destructive` (mensagens de erro)
- Sucesso: `text-green-600` (validação bem-sucedida)
- Texto: `text-foreground` (texto principal)
- Muted: `text-muted-foreground` (labels, hints)

**Tipografia:**
- Título: `text-2xl font-bold`
- Subtítulo: `text-lg font-semibold`
- Corpo: `text-base`
- Label: `text-sm font-medium`
- Hint: `text-xs text-muted-foreground`

**Espaçamentos:**
- Container: `p-6` (desktop), `p-4` (mobile)
- Entre seções: `space-y-6`
- Entre elementos: `space-y-4`
- Grid gap: `gap-4`

### Acessibilidade (WCAG 2.1 AA)

**Contraste:**
- Texto sobre fundo: mínimo 4.5:1
- Botões: mínimo 3:1
- Estados de foco: visível e contrastante

**Navegação por Teclado:**
- Tab: navega entre campos/botões
- Enter: ativa botão focado
- ESC: fecha modal
- Setas: navega em dropdown

**Screen Readers:**
- Labels em todos os inputs: `<label htmlFor="api-key">`
- ARIA labels em botões de ícone: `aria-label="Mostrar senha"`
- ARIA live regions para mensagens: `aria-live="polite"`
- Roles apropriados: `role="dialog"`, `role="alert"`

## Riscos e Mitigações

### Risco 1: Usuários Existentes com onboarding_step=3 ou 4

**Descrição:** Usuários que já completaram onboarding com 4 passos terão onboarding_step=3 ou 4, mas novo sistema espera apenas 1-3.

**Impacto:** Médio - pode causar confusão na UI ou erros de validação.

**Mitigação:**
1. Migration de dados: `UPDATE users SET onboarding_step = 3 WHERE onboarding_step >= 3`
2. Lógica no frontend: `const normalizedStep = Math.min(onboarding_step, 3)`
3. Validação no backend: aceitar valores 1-4 mas tratar 4 como 3

**Alternativa:** Adicionar campo `onboarding_version` para diferenciar fluxos antigos/novos.

---

### Risco 2: HeyGen API Rate Limit no Passo 2

**Descrição:** Carregar avatares + vozes simultaneamente pode exceder rate limit da API HeyGen (especialmente se múltiplos usuários acessam ao mesmo tempo).

**Impacto:** Alto - wizard fica inutilizável se API bloquear requisições.

**Mitigação:**
1. Cache de 5 minutos para GET /avatars e GET /voices
2. Implementar retry com exponential backoff (3 tentativas)
3. Fallback: exibir avatares/vozes do cache mesmo se expirado
4. Mensagem ao usuário: "Muitas requisições, tente novamente em X segundos"

**Alternativa:** Pagination de avatares (carregar 20 por vez) para reduzir payload.

---

### Risco 3: Clone Não Aparece Imediatamente Após Criação

**Descrição:** Processamento de clone no HeyGen pode levar 15-30 minutos (Instant) ou até 24h (Studio). Usuário pode clicar "Atualizar lista" e não ver o clone.

**Impacto:** Baixo - não bloqueia funcionalidade, mas pode frustrar usuário.

**Mitigação:**
1. Mensagem no modal: "Processamento pode levar até 30 minutos"
2. Botão "Atualizar lista" com feedback: "Atualizando..." → "Nenhum clone novo encontrado"
3. Sugestão: "Continue com avatar padrão e volte depois"
4. Polling automático a cada 30s (opcional, desabilitar após 5 min)

**Alternativa:** Webhook do HeyGen para notificar quando clone estiver pronto (requer OAuth).

---

### Risco 4: Usuário Perde API Key Durante Wizard

**Descrição:** Se usuário fechar navegador ou recarregar página no Passo 2, perde API Key validada (não está salva no banco).

**Impacto:** Médio - usuário precisa re-validar API Key.

**Mitigação:**
1. Salvar API Key no `localStorage` temporariamente durante wizard
2. Limpar `localStorage` após salvar com sucesso ou fechar wizard
3. Aviso ao tentar fechar: "Tem certeza? Progresso será perdido"
4. Permitir voltar ao Passo 1 para re-validar

**Alternativa:** Salvar API Key no banco após validação (Passo 1) e apenas atualizar avatar/voz no Passo 2.

## Dependências e Arquivos Afetados

### Dependências Externas

**Frontend:**
- React 18+ (já instalado)
- TypeScript 4.9+ (já instalado)
- TailwindCSS (já instalado)
- shadcn/ui components (já instalado)
- lucide-react (ícones - já instalado)

**Backend:**
- Python 3.11+ (já instalado)
- FastAPI (já instalado)
- Pydantic (já instalado)
- httpx (para chamadas HeyGen API - verificar se instalado)

**External APIs:**
- HeyGen API v2 (https://api.heygen.com/v2)
- Supabase (já configurado)

### Arquivos Modificados

**Frontend:**
1. `src/pages/Onboarding.tsx`
   - Remover Passo 3 (Avatar AI)
   - Ajustar stepper para 3 passos
   - Remover estados HeyGen

2. `src/pages/Module3.tsx`
   - Adicionar lógica de detecção de config HeyGen
   - Renderizar wizard ou módulo normal
   - Adicionar header com avatar + créditos + botão "Trocar"

3. `src/types/database.types.ts` (se necessário)
   - Adicionar tipo `heygen_access_token` em Organization

**Backend:**
4. `backend/app/api/routes/integrations.py`
   - Adicionar endpoint POST /heygen/validate-key

5. `backend/app/models/heygen.py`
   - Adicionar modelo HeyGenApiKeyOnly

6. `backend/app/services/heygen_service.py` (se necessário)
   - Adicionar método `test_credentials(api_key)`

**Database:**
7. `supabase/migrations/YYYYMMDDHHMMSS_add_heygen_access_token.sql`
   - Nova migration

### Arquivos Novos

**Frontend:**
1. `src/components/heygen/HeyGenSetupWizard.tsx`
   - Componente principal do wizard (2 passos)

2. `src/components/heygen/HeyGenCloneGuide.tsx`
   - Modal com instruções de clone

3. `src/types/heygen.ts` (opcional)
   - Interfaces TypeScript centralizadas

**Backend:**
- Nenhum arquivo novo (apenas modificações)

### Arquivos Removidos

- Nenhum (manter compatibilidade com código existente)

## Critérios de Aceitação Técnicos

### Checklist de Validação

**Onboarding:**
- [ ] Passo 3 (Avatar AI) removido do componente
- [ ] Stepper exibe 3 passos (Perfil, Redes, Pronto)
- [ ] onboarding_step salva valores 1, 2 ou 3
- [ ] Nenhuma referência a HeyGen no código do onboarding
- [ ] Redirecionamento para dashboard após Passo 3

**Module3:**
- [ ] Detecta se heygen_api_key é NULL
- [ ] Sem config: renderiza HeyGenSetupWizard (tela inteira)
- [ ] Com config: renderiza módulo normal
- [ ] Header exibe: miniatura avatar + créditos + botão "Trocar"
- [ ] Banner amarelo removido
- [ ] Botão "Trocar" abre wizard no Passo 2

**HeyGenSetupWizard - Passo 1:**
- [ ] Campo API Key type="password"
- [ ] Toggle show/hide funciona (ícone Eye/EyeOff)
- [ ] Link "Criar conta" abre heygen.com em nova aba
- [ ] Botão "Conectar" chama POST /validate-key
- [ ] Loading state durante validação (spinner no botão)
- [ ] Sucesso: exibe créditos + plano + avança para Passo 2
- [ ] Erro: exibe mensagem clara + permanece no Passo 1
- [ ] API Key não é salva no banco durante validação

**HeyGenSetupWizard - Passo 2:**
- [ ] Carrega avatares via GET /avatars
- [ ] Carrega vozes via GET /voices
- [ ] Seção "Seus Clones" no topo (badge "⭐ Seu Clone")
- [ ] Seção "Avatares Públicos" abaixo
- [ ] Card "Criar clone" abre modal HeyGenCloneGuide
- [ ] Selecionar avatar expande seletor de voz
- [ ] Dropdown vozes filtrado por PT-BR
- [ ] Botão preview voz (🔊) funciona
- [ ] Botão "Salvar" desabilitado até avatar + voz selecionados
- [ ] Botão "Salvar" chama PUT /heygen
- [ ] Wizard fecha após salvar com sucesso

**HeyGenCloneGuide:**
- [ ] Modal abre ao clicar card "Criar clone"
- [ ] Exibe instruções passo-a-passo (7 passos)
- [ ] Botão "Ir para HeyGen" abre studio.heygen.com em nova aba
- [ ] Botão "Atualizar lista" recarrega GET /avatars
- [ ] Botão "Fechar" (X) fecha modal e volta ao Passo 2
- [ ] ESC fecha modal
- [ ] Modal não bloqueia wizard (pode fechar e continuar)

**Backend - POST /validate-key:**
- [ ] Endpoint criado em /api/integrations/heygen/validate-key
- [ ] Aceita HeyGenApiKeyOnly no body
- [ ] Chama HeyGenService.test_credentials()
- [ ] Retorna {valid, credits_remaining, plan}
- [ ] Não salva API Key no banco
- [ ] Timeout de 3 segundos
- [ ] Erros mapeados: 400 (inválida), 403 (suspensa), 500 (HeyGen down)

**Database:**
- [ ] Migration cria coluna heygen_access_token TEXT nullable
- [ ] Comentário documenta uso futuro (OAuth)
- [ ] Índice parcial criado para performance
- [ ] Políticas RLS aplicadas (read para membros, update para owner)
- [ ] Migration roda sem erros

**Performance:**
- [ ] Validação de API Key < 3 segundos
- [ ] Carregamento de avatares < 2 segundos
- [ ] Carregamento de vozes < 2 segundos
- [ ] Salvamento de config < 1 segundo
- [ ] Cache de avatares/vozes por 5 minutos

**Acessibilidade:**
- [ ] Contraste mínimo WCAG 2.1 AA em todos os elementos
- [ ] Navegação completa via teclado (Tab, Enter, ESC)
- [ ] Labels em todos os inputs
- [ ] ARIA labels em botões de ícone
- [ ] Focus indicators visíveis
- [ ] Modal acessível via teclado

**Segurança:**
- [ ] API Keys nunca expostas em logs
- [ ] API Keys nunca retornadas em respostas de API
- [ ] Transmissão apenas via HTTPS
- [ ] RLS protege dados HeyGen
- [ ] Apenas owner pode modificar configurações

### Testes Necessários

**Unitários:**
- [ ] HeyGenSetupWizard - estados e transições
- [ ] HeyGenCloneGuide - abertura/fechamento
- [ ] POST /validate-key - sucesso e erros
- [ ] PUT /heygen - validações e salvamento

**Integração:**
- [ ] Onboarding completo (3 passos)
- [ ] Wizard completo (Passo 1 → Passo 2 → Salvar)
- [ ] Trocar avatar (reabre wizard no Passo 2)
- [ ] Criar clone (modal + atualizar lista)

**End-to-End:**
- [ ] Fluxo completo: Onboarding → Module3 → Wizard → Configurado
- [ ] Fluxo trocar avatar: Module3 → Trocar → Novo avatar
- [ ] Fluxo criar clone: Wizard → Modal → HeyGen → Atualizar → Selecionar

**Performance:**
- [ ] Load testing: 100 usuários simultâneos no wizard
- [ ] Cache: verificar que avatares/vozes não são recarregados em 5 min
- [ ] Timeout: validação não excede 3 segundos
