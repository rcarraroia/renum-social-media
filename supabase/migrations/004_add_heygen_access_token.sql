-- ================================================
-- Migration: Adicionar heygen_access_token para OAuth
-- Data: 2026-02-21
-- ================================================

-- Adicionar coluna heygen_access_token para preparação OAuth futuro
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS heygen_access_token TEXT;

-- Comentário explicativo
COMMENT ON COLUMN organizations.heygen_access_token IS 
'OAuth access token para HeyGen API. NULL no MVP (usa heygen_api_key manual).';

-- Comentário documentando obsolescência de heygen_api_key_encrypted
COMMENT ON COLUMN organizations.heygen_api_key_encrypted IS 
'OBSOLETO: API key criptografada (manter por compatibilidade). Usar heygen_api_key (TEXT) para MVP ou heygen_access_token (OAuth futuro).';

-- Índice para performance em queries que filtram por configuração HeyGen
CREATE INDEX IF NOT EXISTS idx_organizations_heygen_configured 
ON organizations(id) 
WHERE heygen_api_key IS NOT NULL OR heygen_access_token IS NOT NULL;
