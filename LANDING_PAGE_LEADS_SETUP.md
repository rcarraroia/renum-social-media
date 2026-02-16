# 📋 Setup de Captura de Leads - Landing Page

## 🎯 Contexto e Decisão

**Data**: 16/02/2026  
**Decisão**: Implementar captura de leads direto no Supabase (frontend → Supabase)  
**Motivo**: Landing page precisa capturar leads ANTES do backend estar pronto (06/03/2026)

## 🤔 Opções Avaliadas

### Opção 1: Serverless Function no Vercel
**Prós**: Mais seguro, validações no backend, controle total  
**Contras**: Mais complexo, código duplicado quando backend estiver pronto

### Opção 2: Direto no Supabase ✅ ESCOLHIDA
**Prós**: 
- Implementação imediata (5 minutos)
- Menos código para manter
- Supabase RLS protege os dados
- Temporário até backend estar pronto
- Não duplica código

**Contras**:
- ANON_KEY exposta no frontend (mitigado com RLS)
- Validações apenas no frontend

## 📊 Estrutura da Tabela

```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity TEXT NOT NULL,
    app_name TEXT NOT NULL,
    price TEXT NOT NULL,
    price_with_commission TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    whatsapp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Campos do Formulário (5 Passos):

1. **Step 1 - Atividade**: consultora, politico, profissional_liberal, educador, fitness, criador, empreendedor, estudante, geral
2. **Step 2 - Nome do App**: SocialFlow, SmartGenius, inFluency
3. **Step 3 - Preço**: $29, $49, $99
4. **Step 4 - Preço com Comissão**: $29, $49, $99
5. **Step 5 - Contato**: nome, email, whatsapp

## 🔐 Segurança (RLS - Row Level Security)

### Políticas Aplicadas:

```sql
-- Permitir INSERT público (captura de leads)
CREATE POLICY "Permitir inserção pública de leads"
ON leads FOR INSERT
TO anon
WITH CHECK (true);

-- Bloquear SELECT público (apenas admin pode ver)
CREATE POLICY "Apenas autenticados podem ver leads"
ON leads FOR SELECT
TO authenticated
USING (true);

-- Bloquear UPDATE/DELETE público
-- (sem políticas = bloqueado por padrão)
```

### Por que é seguro?

1. **INSERT público**: Qualquer um pode criar lead (objetivo da landing page)
2. **SELECT bloqueado**: Apenas usuários autenticados veem os leads
3. **UPDATE/DELETE bloqueado**: Ninguém pode modificar/deletar
4. **ANON_KEY**: Só permite operações permitidas pelo RLS

## 🚀 Implementação

### 1. Executar SQL no Supabase

Acesse: https://supabase.com/dashboard/project/zbsbfhmsgrlohxdxihaw/editor

Execute o arquivo: `backend/migrations/005_posts_flows_leads.sql`

### 2. Configurar RLS

Execute o arquivo: `.kiro/docs/LANDING_PAGE_RLS.sql`

### 3. Código Frontend

O formulário em `src/pages/PostsFlowsLanding.tsx` foi atualizado para:
- Usar `supabase.from('leads').insert()`
- Remover chamada para `/api/leads`
- Manter todas validações do frontend

## 📅 Migração Futura (06/03/2026)

Quando o backend estiver pronto:

1. **Remover** código de inserção direta no Supabase
2. **Restaurar** chamada para `/api/leads`
3. **Manter** políticas RLS (backend também usará)
4. **Migrar** lógica de validação para backend

### Checklist de Migração:

- [ ] Backend deployado e funcionando
- [ ] Endpoint `/api/leads` testado
- [ ] Atualizar `PostsFlowsLanding.tsx` para usar API
- [ ] Testar formulário end-to-end
- [ ] Remover código temporário do Supabase
- [ ] Documentar mudança

## 🔍 Monitoramento

### Ver Leads Capturados:

```sql
-- No Supabase SQL Editor
SELECT 
    id,
    activity,
    app_name,
    price,
    price_with_commission,
    name,
    email,
    whatsapp,
    created_at
FROM leads
ORDER BY created_at DESC;
```

### Estatísticas:

```sql
-- Total de leads
SELECT COUNT(*) as total FROM leads;

-- Leads por atividade
SELECT activity, COUNT(*) as total 
FROM leads 
GROUP BY activity 
ORDER BY total DESC;

-- Leads por nome do app
SELECT app_name, COUNT(*) as total 
FROM leads 
GROUP BY app_name 
ORDER BY total DESC;

-- Leads por faixa de preço
SELECT price, COUNT(*) as total 
FROM leads 
GROUP BY price 
ORDER BY total DESC;
```

## ⚠️ Importante

- Esta é uma solução **TEMPORÁRIA** até 06/03/2026
- Os dados estão **SEGUROS** com RLS do Supabase
- Quando backend estiver pronto, **MIGRAR** para API
- **NÃO DELETAR** este documento - é histórico importante

## 📞 Contato

Se tiver dúvidas sobre esta implementação, consulte:
- Migration: `backend/migrations/005_posts_flows_leads.sql`
- RLS: `.kiro/docs/LANDING_PAGE_RLS.sql`
- Código: `src/pages/PostsFlowsLanding.tsx`

---

**Última atualização**: 16/02/2026  
**Status**: ✅ Implementado e funcionando  
**Próxima revisão**: 06/03/2026 (quando backend estiver pronto)
