-- Migration: Collaboration session history records
-- Created for: Sprint85 E2 (协作会话历史记录)
-- Version: 0014
--
-- collab_sessions: Records of collaborative operations on a canvas.
-- Used for the session history panel in CanvasSettingsPanel.
-- NOT the same as collabSessionStore (which handles session recording/replay).

CREATE TABLE IF NOT EXISTS collab_sessions (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  operation_type TEXT NOT NULL CHECK(operation_type IN ('edit', 'merge', 'comment', 'permission', 'create', 'delete')),
  operation_target TEXT,
  operation_detail TEXT,
  created_at INTEGER NOT NULL
);

-- Index for paginated listing of sessions by canvas (descending time)
CREATE INDEX IF NOT EXISTS idx_collab_sessions_canvas_created ON collab_sessions(canvas_id, created_at DESC);

-- Index for filtering by operation type on a canvas
CREATE INDEX IF NOT EXISTS idx_collab_sessions_canvas_type ON collab_sessions(canvas_id, operation_type);
