-- Migration: Template Sharing — public gallery, share tokens
-- Created for: Sprint90 E3 (Template Sharing)
-- Version: 0022

-- Add is_public flag to templates
ALTER TABLE templates ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;

-- Add share_token for public URL sharing (random 32-char hex string)
ALTER TABLE templates ADD COLUMN share_token TEXT;

-- Index for listing public templates
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public, published_at DESC);

-- Index for share_token lookup
CREATE INDEX IF NOT EXISTS idx_templates_share_token ON templates(share_token);

-- template_ratings table already exists in migration 0017
-- (id, template_id, user_id, rating, comment, created_at)
-- No changes needed — ratings are already handled
