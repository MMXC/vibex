-- Migration: Template publish and rating system
-- Created for: Sprint85 E5 (模板发布与评分系统)
-- Version: 0017

-- templates: Published project templates store
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  thumbnail TEXT,
  canvas_id TEXT,
  content_json TEXT NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  avg_rating REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(id)
);

-- Index for listing templates (most recent first)
CREATE INDEX IF NOT EXISTS idx_templates_published ON templates(published_at DESC);

-- Index for author's templates
CREATE INDEX IF NOT EXISTS idx_templates_author ON templates(author_id, published_at DESC);

-- Index for usage-based sorting
CREATE INDEX IF NOT EXISTS idx_templates_usage ON templates(usage_count DESC);

-- Index for rating-based sorting
CREATE INDEX IF NOT EXISTS idx_templates_rating ON templates(avg_rating DESC);

-- template_ratings: User ratings and comments for templates
CREATE TABLE IF NOT EXISTS template_ratings (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(id)
);

-- Index for listing ratings on a template
CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON template_ratings(template_id, created_at DESC);

-- Index for checking if user already rated
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_ratings_user_template ON template_ratings(user_id, template_id);
