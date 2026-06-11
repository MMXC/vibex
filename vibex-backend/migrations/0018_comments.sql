-- Sprint86 E1: Canvas Comments API
-- D1 migration 0018 — comments table for collaboration comments

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  node_id TEXT,
  parent_id TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT DEFAULT '[]',
  is_resolved INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_canvas ON comments(canvas_id);
CREATE INDEX IF NOT EXISTS idx_comments_node ON comments(node_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at);

-- comment_reactions table for emoji reactions on comments
CREATE TABLE IF NOT EXISTS comment_reactions (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON comment_reactions(user_id);
