-- S90-E4: Canvas Annotation Layer — D1 migration 0023 — annotations table
-- Sprint90 Epic 4: 画布自由批注层
-- Distinguishes from node-bound comments: annotations are free-floating marks at canvas coordinates (x, y),
-- rendered via CSS transform that inherits canvas pan/zoom.

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  content TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  type TEXT NOT NULL DEFAULT 'point',
  author_id TEXT NOT NULL,
  author_name TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_annotations_canvas ON annotations(canvas_id);
CREATE INDEX IF NOT EXISTS idx_annotations_author ON annotations(author_id);
CREATE INDEX IF NOT EXISTS idx_annotations_status ON annotations(status);
CREATE INDEX IF NOT EXISTS idx_annotations_created ON annotations(created_at);