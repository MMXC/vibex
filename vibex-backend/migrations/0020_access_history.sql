-- Migration: 0020_access_history
-- Created for: Sprint89 E1 (Canvas Analytics Dashboard)
-- Version: 0020

-- Canvas Access History: Tracks user access events per canvas
-- Used to display "recent collaborators" on canvas cards (max 5 per canvas)
CREATE TABLE IF NOT EXISTS canvas_access_history (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  avatar_url TEXT,
  accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(id)
);

-- Index for listing recent accessors per canvas (ordered by time DESC)
CREATE INDEX IF NOT EXISTS idx_canvas_access_history_canvas
ON canvas_access_history(canvas_id, accessed_at DESC);

-- Index for a user's access activity
CREATE INDEX IF NOT EXISTS idx_canvas_access_history_user
ON canvas_access_history(user_id, accessed_at DESC);

-- Deduplication: keep only the latest entry per (canvas_id, user_id)
-- Note: SQLite/D1 doesn't enforce partial uniqueness, so the application layer
-- (route.ts) handles upsert logic: delete existing + insert new on each access.
