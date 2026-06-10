-- Migration: Canvas-level permissions and collaborators
-- Created for: Sprint85 E1 (画布级权限体系)
-- Version: 0013

-- canvas_permissions: Per-user permissions on a canvas
CREATE TABLE IF NOT EXISTS canvas_permissions (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(canvas_id, user_id)
);

-- Index for listing all collaborators on a canvas
CREATE INDEX IF NOT EXISTS idx_canvas_perm_canvas ON canvas_permissions(canvas_id);

-- Index for checking a user's permission on a canvas
CREATE INDEX IF NOT EXISTS idx_canvas_perm_user ON canvas_permissions(user_id);

-- canvas_collaborators: Additional metadata about collaborators
CREATE TABLE IF NOT EXISTS canvas_collaborators (
  id TEXT PRIMARY KEY,
  permission_id TEXT NOT NULL REFERENCES canvas_permissions(id) ON DELETE CASCADE,
  canvas_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  invited_by TEXT,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT
);

-- Index for listing collaborators on a canvas
CREATE INDEX IF NOT EXISTS idx_canvas_collabs_canvas ON canvas_collaborators(canvas_id);

-- Index for listing canvases a user collaborates on
CREATE INDEX IF NOT EXISTS idx_canvas_collabs_user ON canvas_collaborators(user_id);

-- canvas_share_links: Share links for canvas access
CREATE TABLE IF NOT EXISTS canvas_share_links (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer', 'editor')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_canvas_share_token ON canvas_share_links(token);
-- Index for listing shares on a canvas
CREATE INDEX IF NOT EXISTS idx_canvas_share_canvas ON canvas_share_links(canvas_id);
