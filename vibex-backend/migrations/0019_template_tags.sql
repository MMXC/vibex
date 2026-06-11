-- Migration: Template Tags Management
-- Created for: Sprint88 E3 (模板市场增强)
-- Version: 0019

-- template_tags: Global tag registry for template marketplace
CREATE TABLE IF NOT EXISTS template_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  category TEXT DEFAULT 'general',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for listing tags by name
CREATE INDEX IF NOT EXISTS idx_template_tags_name ON template_tags(name);
