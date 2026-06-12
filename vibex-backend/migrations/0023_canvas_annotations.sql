-- Migration: Canvas Annotation Layer — annotations table
-- Created for: Sprint90 E4 (Canvas Annotation Layer)
-- Version: 0023

-- Canvas Annotation Layer: independent overlay on canvas for design review
CREATE TABLE IF NOT EXISTS annotations (
  id          TEXT PRIMARY KEY,
  canvas_id   TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  x           REAL NOT NULL DEFAULT 0,
  y           REAL NOT NULL DEFAULT 0,
  width       REAL,
  height      REAL,
  type        TEXT NOT NULL DEFAULT 'text',   -- 'text' | 'arrow'
  author_id   TEXT NOT NULL,
  author_name TEXT,
  color       TEXT NOT NULL DEFAULT '#6366F1',
  status      TEXT NOT NULL DEFAULT 'active', -- 'active' | 'resolved'
  end_x       REAL,                            -- for arrow annotations
  end_y       REAL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_annotations_canvas ON annotations(canvas_id, status);
CREATE INDEX IF NOT EXISTS idx_annotations_author ON annotations(author_id);
