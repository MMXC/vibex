-- 0031_canvas_node_locks.sql
-- S95-E3: Node Edit Locking
-- Stores node-level edit locks with TTL (60s auto-expire)
CREATE TABLE IF NOT EXISTS canvas_node_locks (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  avatar TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_canvas_node_locks_canvas_node
  ON canvas_node_locks(canvas_id, node_id);
CREATE INDEX IF NOT EXISTS idx_canvas_node_locks_expires
  ON canvas_node_locks(expires_at);
