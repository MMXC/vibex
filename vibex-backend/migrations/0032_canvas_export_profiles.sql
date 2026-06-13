-- 0032_canvas_export_profiles.sql
-- S95-E4: Export Profile Templates
-- Stores named export configuration presets per canvas + user

CREATE TABLE IF NOT EXISTS canvas_export_profiles (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  -- format: 'react' | 'svg' | 'md' | 'json'
  format TEXT NOT NULL DEFAULT 'react',
  -- scale: percentage (25, 50, 75, 100, 150, 200)
  scale INTEGER NOT NULL DEFAULT 100,
  -- include nodes in export
  include_nodes INTEGER NOT NULL DEFAULT 1,
  -- include edges in export
  include_edges INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_canvas_export_profiles_canvas_id ON canvas_export_profiles(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_export_profiles_user_id ON canvas_export_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_export_profiles_canvas_user ON canvas_export_profiles(canvas_id, user_id);
