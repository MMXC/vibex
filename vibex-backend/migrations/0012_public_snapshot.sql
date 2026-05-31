-- Migration: Add PublicSnapshot table for public shareable canvas snapshots
-- Created for: Sprint45 E5 (canvas snapshot sharing)
-- Version: 0012

-- PublicSnapshot — stores shareable public canvas snapshots
-- Anyone with the ID can view (no auth required for GET)
CREATE TABLE IF NOT EXISTS PublicSnapshot (
  id TEXT PRIMARY KEY,
  canvasJSON TEXT NOT NULL,  -- JSON: full canvas state from serializeThreeTrees()
  projectName TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdBy TEXT              -- user ID (nullable for anonymous), used for 10-snapshot limit
);

-- Index for user query (count per user)
CREATE INDEX IF NOT EXISTS idx_public_snapshot_createdBy ON PublicSnapshot(createdBy);

-- Index for ordering by creation time
CREATE INDEX IF NOT EXISTS idx_public_snapshot_created ON PublicSnapshot(createdAt DESC);
