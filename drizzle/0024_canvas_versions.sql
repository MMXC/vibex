-- Sprint93 E1: Canvas Version History
-- Stores point-in-time snapshots of canvas state (nodes + edges + metadata)
-- for history browsing and one-click restore.
CREATE TABLE IF NOT EXISTS canvas_versions (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  snapshot_data TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (canvas_id) REFERENCES canvases(id)
);
CREATE INDEX IF NOT EXISTS idx_canvas_versions ON canvas_versions(canvas_id, version_number DESC);
