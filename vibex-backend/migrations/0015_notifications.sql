-- Migration: System-wide notification center
-- Created for: Sprint85 E3 (通知中心面板)
-- Version: 0015

-- notifications: System-wide notification store (backed by D1)
-- Supports: mention, reply, collaborator_join, system, info, template_update, comment_reply types
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('mention', 'reply', 'collaborator_join', 'system', 'info', 'template_update', 'comment_reply')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  node_id TEXT,
  canvas_id TEXT,
  template_id TEXT,
  author_id TEXT,
  thumbnail TEXT,
  comment_id TEXT,
  reply_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(id)
);

-- Index for listing a user's notifications (most recent first)
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notifications(user_id, created_at DESC);

-- Index for unread count query
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = 0;

-- Index for querying by canvas (for @mention and comment notifications)
CREATE INDEX IF NOT EXISTS idx_notif_canvas ON notifications(canvas_id) WHERE canvas_id IS NOT NULL;

-- Index for querying by type
CREATE INDEX IF NOT EXISTS idx_notif_user_type ON notifications(user_id, type, created_at DESC);
