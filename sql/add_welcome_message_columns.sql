-- Add display_name and visit_count columns to settings table
-- Run this in Supabase SQL Editor

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN settings.display_name IS 'User display name shown in dashboard greeting';
COMMENT ON COLUMN settings.visit_count IS 'Number of dashboard visits for welcome message logic';
