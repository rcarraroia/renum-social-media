-- Add HeyGen-specific fields to videos table
-- These fields track HeyGen video generation status and metadata

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS heygen_video_id TEXT,
ADD COLUMN IF NOT EXISTS heygen_job_status TEXT CHECK (heygen_job_status IN ('processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS heygen_error_message TEXT;

-- Add index for faster queries on HeyGen video ID
CREATE INDEX IF NOT EXISTS idx_videos_heygen_video_id ON videos(heygen_video_id);

-- Add index for faster queries on HeyGen job status
CREATE INDEX IF NOT EXISTS idx_videos_heygen_status ON videos(heygen_job_status);

-- Add comment for documentation
COMMENT ON COLUMN videos.heygen_video_id IS 'HeyGen API video ID for tracking generation';
COMMENT ON COLUMN videos.heygen_job_status IS 'Status of HeyGen video generation: processing, completed, failed';
COMMENT ON COLUMN videos.heygen_error_message IS 'Error message if HeyGen generation failed';
