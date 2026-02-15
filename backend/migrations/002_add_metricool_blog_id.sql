-- Migration: Add metricool_blog_id to organizations table
-- Date: 2026-02-14
-- Description: Adds metricool_blog_id field to store the Metricool brand ID for each organization

-- Add metricool_blog_id column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS metricool_blog_id INTEGER;

-- Add comment to explain the field
COMMENT ON COLUMN organizations.metricool_blog_id IS 'Metricool brand ID (blogId) for this organization';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_metricool_blog_id 
ON organizations(metricool_blog_id) 
WHERE metricool_blog_id IS NOT NULL;
