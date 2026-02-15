-- Migration: 004_fase4_calendar_dashboard.sql
-- Descrição: Adiciona campos necessários para sistema de calendário e dashboard
-- Data: 2024
-- Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6

-- Esta migration é idempotente - pode ser executada múltiplas vezes sem erro

-- ===== ADICIONAR COLUNAS NA TABELA POSTS =====

-- Adicionar coluna metricool_post_id para sincronização com Metricool
-- Validates: Requirement 9.1
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS metricool_post_id VARCHAR(255);

-- Adicionar coluna thumbnail_url para armazenar URL da thumbnail do vídeo
-- Validates: Requirement 9.2
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Adicionar coluna cancelled_at para registrar timestamp de cancelamento
-- Validates: Requirement 9.3
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;


-- ===== CRIAR ÍNDICES PARA PERFORMANCE =====

-- Índice composto para consultas de posts por organização e data de agendamento
-- Usado em: GET /api/calendar/posts com filtros de data
-- Validates: Requirement 9.4
CREATE INDEX IF NOT EXISTS idx_posts_org_scheduled 
ON posts(organization_id, scheduled_at);

-- Índice para busca rápida por metricool_post_id
-- Usado em: Sincronização com Metricool API
-- Validates: Requirement 9.5
CREATE INDEX IF NOT EXISTS idx_posts_metricool 
ON posts(metricool_post_id) 
WHERE metricool_post_id IS NOT NULL;


-- ===== ADICIONAR COMENTÁRIOS NAS COLUNAS =====

-- Documentar propósito de cada coluna adicionada
-- Validates: Requirement 9.6
COMMENT ON COLUMN posts.metricool_post_id IS 
'ID do post no Metricool para sincronização. Usado para atualizar/cancelar posts via API do Metricool.';

COMMENT ON COLUMN posts.thumbnail_url IS 
'URL da thumbnail do vídeo. Deve começar com https://. Usado para exibição no calendário.';

COMMENT ON COLUMN posts.cancelled_at IS 
'Timestamp de cancelamento do post. NULL se post não foi cancelado. Quando preenchido, status deve ser "cancelled".';


-- ===== VALIDAÇÕES E CONSTRAINTS =====

-- Adicionar constraint para garantir que thumbnail_url começa com https:// se não for NULL
ALTER TABLE posts 
ADD CONSTRAINT IF NOT EXISTS chk_posts_thumbnail_url_https 
CHECK (thumbnail_url IS NULL OR thumbnail_url LIKE 'https://%');

-- Adicionar constraint para garantir que cancelled_at só é preenchido quando status = 'cancelled'
ALTER TABLE posts 
ADD CONSTRAINT IF NOT EXISTS chk_posts_cancelled_at_status 
CHECK (
    (cancelled_at IS NULL AND status != 'cancelled') OR 
    (cancelled_at IS NOT NULL AND status = 'cancelled')
);


-- ===== VERIFICAÇÃO DE IDEMPOTÊNCIA =====

-- Esta migration pode ser executada múltiplas vezes sem erro devido ao uso de:
-- - ADD COLUMN IF NOT EXISTS
-- - CREATE INDEX IF NOT EXISTS
-- - ADD CONSTRAINT IF NOT EXISTS
-- 
-- Validates: Requirement 9.6 (idempotência)

-- Para testar idempotência, execute este script 2x:
-- psql -U postgres -d renum_db -f backend/migrations/004_fase4_calendar_dashboard.sql
-- psql -U postgres -d renum_db -f backend/migrations/004_fase4_calendar_dashboard.sql
-- 
-- Ambas execuções devem completar sem erro.
