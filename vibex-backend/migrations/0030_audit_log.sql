-- Migration: 0030_audit_log
-- Sprint94 E3: Canvas Audit Log
-- Tracks all canvas operations: create/update/delete/share/permission changes

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for filtering by canvas
CREATE INDEX IF NOT EXISTS idx_audit_log_canvas
ON audit_log(canvas_id, created_at DESC);

-- Index for filtering by user
CREATE INDEX IF NOT EXISTS idx_audit_log_user
ON audit_log(user_id, created_at DESC);

-- Index for filtering by action type
CREATE INDEX IF NOT EXISTS idx_audit_log_action
ON audit_log(action, created_at DESC);

-- Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
ON audit_log(created_at DESC);
