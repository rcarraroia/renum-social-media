-- ================================================
-- Migration: Remover OpusClip e Adicionar Onboarding
-- Data: 2026-02-19
-- ================================================

-- Remover coluna opusclip_api_key (nunca foi utilizada)
ALTER TABLE organizations DROP COLUMN IF EXISTS opusclip_api_key;

-- Adicionar coluna onboarding_completed para controlar onboarding
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Comentários
COMMENT ON COLUMN organizations.onboarding_completed IS 'Indica se a organização completou o processo de onboarding';
