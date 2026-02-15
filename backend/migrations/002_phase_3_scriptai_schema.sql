-- FASE 3 - Módulo 1 ScriptAI - Schema Updates
-- Execute este arquivo no Supabase SQL Editor

-- ============================================
-- 1. VIDEOS TABLE - ADD 'script' TO recording_source
-- ============================================

-- Drop existing constraint
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_recording_source_check;

-- Add new constraint with 'script' option
ALTER TABLE videos
ADD CONSTRAINT videos_recording_source_check 
CHECK (recording_source IN ('upload', 'teleprompter', 'heygen', 'script'));

-- ============================================
-- 2. VIDEOS TABLE - ADD script AND metadata FIELDS
-- ============================================

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS script TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 3. API_LOGS TABLE - UPDATE SCHEMA (SIMPLIFIED)
-- ============================================

-- Drop existing constraint if exists
ALTER TABLE api_logs DROP CONSTRAINT IF EXISTS api_logs_module_check;

-- Add module column if not exists
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS module TEXT;

-- Add constraint for module values
ALTER TABLE api_logs
ADD CONSTRAINT api_logs_module_check 
CHECK (module IN ('1', '2', '3'));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check recording_source values
SELECT column_name, pg_get_expr(adbin, adrelid) AS constraint
FROM pg_attrdef
WHERE tablename = 'videos' AND columnname = 'recording_source';

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'videos' 
AND column_name IN ('script', 'metadata');

-- Check api_logs schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'api_logs' 
AND column_name IN ('module', 'endpoint', 'status_code');