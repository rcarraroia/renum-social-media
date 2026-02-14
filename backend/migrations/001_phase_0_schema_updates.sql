-- FASE 0 - Schema Updates
-- Execute este arquivo no Supabase SQL Editor

-- ============================================
-- 1. ORGANIZATIONS TABLE - ADD NEW FIELDS
-- ============================================

-- Add HeyGen configuration fields
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS heygen_avatar_id TEXT,
ADD COLUMN IF NOT EXISTS heygen_voice_id TEXT,
ADD COLUMN IF NOT EXISTS connected_platforms JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 2. ORGANIZATIONS TABLE - REMOVE OBSOLETE FIELDS
-- ============================================

-- Remove OpusClip fields (replaced by FFmpeg)
ALTER TABLE organizations 
DROP COLUMN IF EXISTS opusclip_api_key;

-- Remove Metricool user-specific fields (now managed transparently)
ALTER TABLE organizations 
DROP COLUMN IF EXISTS metricool_user_token,
DROP COLUMN IF EXISTS metricool_user_id,
DROP COLUMN IF EXISTS metricool_blog_id;

-- ============================================
-- 3. VIDEOS TABLE - ADD NEW FIELDS
-- ============================================

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS recording_source TEXT CHECK (recording_source IN ('upload', 'teleprompter', 'heygen')),
ADD COLUMN IF NOT EXISTS subtitle_style JSONB,
ADD COLUMN IF NOT EXISTS transcription TEXT;

-- Add index for faster queries by recording_source
CREATE INDEX IF NOT EXISTS idx_videos_recording_source ON videos(recording_source);

-- ============================================
-- 4. POSTS TABLE - UPDATE PLATFORM CHECK
-- ============================================

-- Drop existing constraint if it exists
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_platform_check;

-- Add new constraint with all supported platforms
ALTER TABLE posts 
ADD CONSTRAINT posts_platform_check 
CHECK (platform IN ('linkedin', 'x', 'instagram', 'tiktok', 'facebook', 'youtube'));

-- ============================================
-- 5. ENABLE RLS ON ALL TABLES
-- ============================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES - ORGANIZATIONS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON organizations;

-- SELECT: Users can only see their own organization
CREATE POLICY "Users can view their own organization" 
ON organizations FOR SELECT 
USING (
    id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- UPDATE: Users can only update their own organization
CREATE POLICY "Users can update their own organization" 
ON organizations FOR UPDATE 
USING (
    id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- 7. CREATE RLS POLICIES - USERS
-- ============================================

DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- SELECT: Users can see other users in their organization
CREATE POLICY "Users can view users in their organization" 
ON users FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (id = auth.uid());

-- ============================================
-- 8. CREATE RLS POLICIES - VIDEOS
-- ============================================

DROP POLICY IF EXISTS "Users can view videos from their organization" ON videos;
DROP POLICY IF EXISTS "Users can insert videos to their organization" ON videos;
DROP POLICY IF EXISTS "Users can update videos from their organization" ON videos;
DROP POLICY IF EXISTS "Users can delete videos from their organization" ON videos;

-- SELECT
CREATE POLICY "Users can view videos from their organization" 
ON videos FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- INSERT
CREATE POLICY "Users can insert videos to their organization" 
ON videos FOR INSERT 
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- UPDATE
CREATE POLICY "Users can update videos from their organization" 
ON videos FOR UPDATE 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- DELETE
CREATE POLICY "Users can delete videos from their organization" 
ON videos FOR DELETE 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- 9. CREATE RLS POLICIES - POSTS
-- ============================================

DROP POLICY IF EXISTS "Users can view posts from their organization" ON posts;
DROP POLICY IF EXISTS "Users can insert posts to their organization" ON posts;
DROP POLICY IF EXISTS "Users can update posts from their organization" ON posts;
DROP POLICY IF EXISTS "Users can delete posts from their organization" ON posts;

-- SELECT
CREATE POLICY "Users can view posts from their organization" 
ON posts FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- INSERT
CREATE POLICY "Users can insert posts to their organization" 
ON posts FOR INSERT 
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- UPDATE
CREATE POLICY "Users can update posts from their organization" 
ON posts FOR UPDATE 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- DELETE
CREATE POLICY "Users can delete posts from their organization" 
ON posts FOR DELETE 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- 10. CREATE RLS POLICIES - API_LOGS
-- ============================================

DROP POLICY IF EXISTS "Users can view api_logs from their organization" ON api_logs;
DROP POLICY IF EXISTS "Service can insert api_logs" ON api_logs;

-- SELECT: Users can only see logs from their organization
CREATE POLICY "Users can view api_logs from their organization" 
ON api_logs FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- INSERT: Service role can insert logs (backend uses service_role_key)
CREATE POLICY "Service can insert api_logs" 
ON api_logs FOR INSERT 
WITH CHECK (true);

-- ============================================
-- 11. STORAGE BUCKETS
-- ============================================

-- Create videos-processed bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos-processed', 'videos-processed', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos-raw bucket
DROP POLICY IF EXISTS "Users can upload to their org folder in videos-raw" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from their org folder in videos-raw" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from their org folder in videos-raw" ON storage.objects;

CREATE POLICY "Users can upload to their org folder in videos-raw"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'videos-raw' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can read from their org folder in videos-raw"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'videos-raw' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete from their org folder in videos-raw"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'videos-raw' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

-- Storage policies for videos-processed bucket
DROP POLICY IF EXISTS "Users can upload to their org folder in videos-processed" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from their org folder in videos-processed" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from their org folder in videos-processed" ON storage.objects;

CREATE POLICY "Users can upload to their org folder in videos-processed"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'videos-processed' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can read from their org folder in videos-processed"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'videos-processed' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete from their org folder in videos-processed"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'videos-processed' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the migration was successful:

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'users', 'videos', 'posts', 'api_logs');

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('heygen_avatar_id', 'heygen_voice_id', 'connected_platforms');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'videos' 
AND column_name IN ('recording_source', 'subtitle_style', 'transcription');

-- Check obsolete columns are removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('opusclip_api_key', 'metricool_user_token', 'metricool_user_id', 'metricool_blog_id');
-- Should return 0 rows

-- Check storage buckets
SELECT * FROM storage.buckets WHERE id IN ('videos-raw', 'videos-processed');
