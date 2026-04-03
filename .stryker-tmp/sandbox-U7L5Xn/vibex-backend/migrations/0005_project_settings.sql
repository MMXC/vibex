-- Migration: Add ProjectSettings table
-- Created for: vibex-ai-prototype-enhance/S7-03

-- Create ProjectSettings table for storing project configurations and user preferences
CREATE TABLE IF NOT EXISTS ProjectSettings (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  userId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_project_settings_project ON ProjectSettings(projectId);
CREATE INDEX IF NOT EXISTS idx_project_settings_user ON ProjectSettings(userId);
CREATE INDEX IF NOT EXISTS idx_project_settings_key ON ProjectSettings(key);
CREATE INDEX IF NOT EXISTS idx_project_settings_project_user ON ProjectSettings(projectId, userId);

-- Unique constraint: one setting per key per project per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_settings_unique ON ProjectSettings(projectId, key, userId);
