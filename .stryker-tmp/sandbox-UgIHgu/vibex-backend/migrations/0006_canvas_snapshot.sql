-- Migration: Add CanvasSnapshot table for versioned canvas storage
-- Created for: canvas-json-persistence/E2
-- Version: 0006

-- CanvasSnapshot — stores versioned snapshots of canvas state (contexts, flows, components)
CREATE TABLE IF NOT EXISTS CanvasSnapshot (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT,
  description TEXT,
  data TEXT NOT NULL,  -- JSON: full canvas state { contexts, flows, components, ui? }
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdBy TEXT,
  isAutoSave INTEGER NOT NULL DEFAULT 0  -- 1 = auto-save (debounce), 0 = manual snapshot
);

-- Unique constraint: one snapshot per project per version
CREATE UNIQUE INDEX IF NOT EXISTS idx_canvas_snapshot_unique ON CanvasSnapshot(projectId, version);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_canvas_snapshot_project ON CanvasSnapshot(projectId);
CREATE INDEX IF NOT EXISTS idx_canvas_snapshot_version ON CanvasSnapshot(version);
CREATE INDEX IF NOT EXISTS idx_canvas_snapshot_created ON CanvasSnapshot(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_snapshot_auto ON CanvasSnapshot(projectId, isAutoSave);
