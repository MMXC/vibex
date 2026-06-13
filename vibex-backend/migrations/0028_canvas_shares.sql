-- Migration: 0028_canvas_shares
-- Sprint94 E2: Advanced Canvas Sharing
-- Extends canvas_share_links with password protection and advanced sharing metadata

-- Add columns to existing canvas_share_links table (alter if columns don't exist)
-- Using separate ALTER TABLE statements for compatibility
ALTER TABLE canvas_share_links ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE canvas_share_links ADD COLUMN IF NOT EXISTS allow_comments INTEGER NOT NULL DEFAULT 1;

ALTER TABLE canvas_share_links ADD COLUMN IF NOT EXISTS allow_download INTEGER NOT NULL DEFAULT 0;

ALTER TABLE canvas_share_links ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Metadata JSON for additional share options (embed settings, custom title, etc.)
ALTER TABLE canvas_share_links ADD COLUMN IF NOT EXISTS metadata TEXT;
