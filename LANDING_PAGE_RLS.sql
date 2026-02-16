-- ============================================
-- RLS (Row Level Security) para Tabela Leads
-- Landing Page - Captura de Leads
-- Data: 16/02/2026
-- ============================================

-- 1. Habilitar RLS na tabela leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 2. Permitir INSERT público (qualquer um pode criar lead)
CREATE POLICY "Permitir inserção pública de leads"
ON leads FOR INSERT
TO anon
WITH CHECK (true);

-- 3. Permitir SELECT apenas para usuários autenticados
CREATE POLICY "Apenas autenticados podem ver leads"
ON leads FOR SELECT
TO authenticated
USING (true);

-- 4. Permitir UPDATE/DELETE apenas para service_role (admin)
-- (Não precisa criar política - bloqueado por padrão)

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'leads';
-- Resultado esperado: rowsecurity = true

-- Listar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leads';

-- ============================================
-- TESTES
-- ============================================

-- Teste 1: INSERT público (deve funcionar)
-- Execute como anon (sem autenticação)
INSERT INTO leads (
    activity,
    app_name,
    price,
    price_with_commission,
    name,
    email,
    whatsapp
) VALUES (
    'consultora',
    'SocialFlow',
    '$49',
    '$49',
    'Teste Lead',
    'teste@example.com',
    '+5511999999999'
);
-- Resultado esperado: ✅ Sucesso

-- Teste 2: SELECT público (deve falhar)
-- Execute como anon (sem autenticação)
SELECT * FROM leads;
-- Resultado esperado: ❌ Erro: "new row violates row-level security policy"

-- Teste 3: SELECT autenticado (deve funcionar)
-- Execute como authenticated (com login)
SELECT * FROM leads;
-- Resultado esperado: ✅ Sucesso (mostra todos os leads)

-- Teste 4: UPDATE público (deve falhar)
-- Execute como anon (sem autenticação)
UPDATE leads SET name = 'Hacker' WHERE email = 'teste@example.com';
-- Resultado esperado: ❌ Erro: "new row violates row-level security policy"

-- Teste 5: DELETE público (deve falhar)
-- Execute como anon (sem autenticação)
DELETE FROM leads WHERE email = 'teste@example.com';
-- Resultado esperado: ❌ Erro: "new row violates row-level security policy"

-- ============================================
-- LIMPEZA (se necessário)
-- ============================================

-- Remover políticas (se precisar recriar)
-- DROP POLICY IF EXISTS "Permitir inserção pública de leads" ON leads;
-- DROP POLICY IF EXISTS "Apenas autenticados podem ver leads" ON leads;

-- Desabilitar RLS (NÃO RECOMENDADO)
-- ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. RLS protege os dados mesmo com ANON_KEY exposta
-- 2. Apenas INSERT é permitido publicamente
-- 3. SELECT requer autenticação (dashboard admin)
-- 4. UPDATE/DELETE bloqueados para todos (exceto service_role)
-- 5. Esta configuração é SEGURA para landing page pública

-- ============================================
-- MONITORAMENTO
-- ============================================

-- Ver últimos leads inseridos
SELECT 
    id,
    activity,
    app_name,
    name,
    email,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- Contar leads por dia
SELECT 
    DATE(created_at) as data,
    COUNT(*) as total
FROM leads
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- Leads duplicados (mesmo email)
SELECT 
    email,
    COUNT(*) as total
FROM leads
GROUP BY email
HAVING COUNT(*) > 1;
