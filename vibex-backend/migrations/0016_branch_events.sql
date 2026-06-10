-- Migration: Branch merge and rollback event audit trail
-- Created for: Sprint85 E4 (分支合并预览与回滚)
-- Version: 0016

-- Branch events: Audit log for branch merge operations
-- Records who merged which branch to which target and when (for collaboration audit trail)
CREATE TABLE IF NOT EXISTS branch_events (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  source_branch TEXT NOT NULL,
  target_branch TEXT NOT NULL,
  user_id TEXT NOT NULL,
  snapshot_count INTEGER NOT NULL DEFAULT 0,
  merged_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(id)
);

-- Index for listing merge events on a canvas
CREATE INDEX IF NOT EXISTS idx_branch_events_canvas ON branch_events(canvas_id, merged_at DESC);

-- Index for querying a user's merge activity
CREATE INDEX IF NOT EXISTS idx_branch_events_user ON branch_events(user_id, merged_at DESC);

-- Rollback events: Audit log for version rollback operations
-- Records who rolled back to which snapshot and when
CREATE TABLE IF NOT EXISTS rollback_events (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  snapshot_name TEXT,
  user_id TEXT NOT NULL,
  rolled_back_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(id)
);

-- Index for listing rollback events on a canvas
CREATE INDEX IF NOT EXISTS idx_rollback_events_canvas ON rollback_events(canvas_id, rolled_back_at DESC);

-- Index for querying a user's rollback activity
CREATE INDEX IF NOT EXISTS idx_rollback_events_user ON rollback_events(user_id, rolled_back_at DESC);
