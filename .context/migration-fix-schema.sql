-- =====================================================
-- MIGRATION: Fix Schema Differences
-- Date: 2026-02-13
-- Description: Add missing columns, indexes, and constraints
-- =====================================================

-- Start transaction - ensures all-or-nothing execution
BEGIN;

-- =====================================================
-- 1. ADD MISSING COLUMNS
-- =====================================================

-- 1.1 Organizations: Add HeyGen credits tracking
ALTER TABLE organizations 
ADD COLUMN heygen_credits_used INTEGER DEFAULT 0,
ADD COLUMN heygen_credits_total INTEGER DEFAULT 0;

-- 1.2 Posts: Add analytics and metadata columns
ALTER TABLE posts 
ADD COLUMN hashtags TEXT[],
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN views INTEGER DEFAULT 0,
ADD COLUMN likes INTEGER DEFAULT 0,
ADD COLUMN comments INTEGER DEFAULT 0,
ADD COLUMN shares INTEGER DEFAULT 0,
ADD COLUMN engagement_rate DECIMAL(5,2) DEFAULT 0.0;

-- 1.3 Videos: Add metadata and audience columns
ALTER TABLE videos 
ADD COLUMN metadata JSONB,
ADD COLUMN audience TEXT;

-- =====================================================
-- 2. UPDATE CHECK CONSTRAINTS
-- =====================================================

-- 2.1 Posts: Update platform constraint to include linkedin and x
ALTER TABLE posts 
DROP CONSTRAINT posts_platform_check;

ALTER TABLE posts 
ADD CONSTRAINT posts_platform_check 
CHECK (platform = ANY (ARRAY['instagram'::text, 'tiktok'::text, 'facebook'::text, 'youtube'::text, 'linkedin'::text, 'x'::text]));

-- =====================================================
-- 3. ADD MISSING INDEXES
-- =====================================================

-- 3.1 Videos: Index for module_type filtering
CREATE INDEX idx_videos_module_type ON videos(module_type);

-- 3.2 Posts: Index for platform filtering  
CREATE INDEX idx_posts_platform ON posts(platform);

-- 3.3 Posts: Index for published_at ordering
CREATE INDEX idx_posts_published_at ON posts(published_at);

-- 3.4 Organizations: Index for plan filtering
CREATE INDEX idx_organizations_plan ON organizations(plan);

-- =====================================================
-- 4. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON COLUMN organizations.heygen_credits_used IS 'Number of HeyGen credits used this month';
COMMENT ON COLUMN organizations.heygen_credits_total IS 'Total HeyGen credits available per month';
COMMENT ON COLUMN posts.hashtags IS 'Array of hashtags for the post';
COMMENT ON COLUMN posts.published_at IS 'Actual publication timestamp';
COMMENT ON COLUMN posts.views IS 'Number of views/impressions';
COMMENT ON COLUMN posts.likes IS 'Number of likes/reactions';
COMMENT ON COLUMN posts.comments IS 'Number of comments';
COMMENT ON COLUMN posts.shares IS 'Number of shares/reposts';
COMMENT ON COLUMN posts.engagement_rate IS 'Engagement rate percentage (0-100)';
COMMENT ON COLUMN videos.metadata IS 'Additional video metadata (JSON)';
COMMENT ON COLUMN videos.audience IS 'Target audience description';

-- =====================================================
-- 5. UPDATE EXISTING DATA (OPTIONAL)
-- =====================================================

-- 5.1 Set default HeyGen credits based on plan
UPDATE organizations 
SET heygen_credits_total = CASE 
    WHEN plan = 'pro' THEN 30
    WHEN plan = 'starter' THEN 10  
    ELSE 3
END
WHERE heygen_credits_total = 0;

-- 5.2 Initialize engagement_rate for existing posts
UPDATE posts 
SET engagement_rate = 0.0 
WHERE engagement_rate IS NULL;

-- =====================================================
-- 6. VERIFY MIGRATION
-- =====================================================

-- Check that all new columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name IN (
    'heygen_credits_used', 
    'heygen_credits_total',
    'hashtags',
    'published_at', 
    'views', 
    'likes', 
    'comments', 
    'shares', 
    'engagement_rate',
    'metadata',
    'audience'
)
ORDER BY table_name, column_name;

-- Check that all new indexes exist
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN (
    'idx_videos_module_type',
    'idx_posts_platform', 
    'idx_posts_published_at',
    'idx_organizations_plan'
)
ORDER BY tablename, indexname;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Commit transaction - make all changes permanent
COMMIT;

-- If any error occurs above, PostgreSQL will automatically ROLLBACK
-- ensuring the database remains in a consistent state