-- 0026_canvas_macros.sql
-- S92-E1: Canvas Workflow Automation
-- Macro recording, playback, and batch execution

CREATE TABLE IF NOT EXISTS canvas_macros (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  steps_json TEXT NOT NULL,
  -- steps_json format: Array<{
  --   type: 'create-node' | 'update-node' | 'delete-node' | 'move-node' | 'add-edge' | 'remove-edge',
  --   timestamp: number,
  --   data: Record<string, unknown>
  -- }>
  share_token TEXT,
  -- share_token: optional token for sharing without auth
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  step_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_canvas_macros_user_id ON canvas_macros(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_macros_share_token ON canvas_macros(share_token);
CREATE INDEX IF NOT EXISTS idx_canvas_macros_created_at ON canvas_macros(created_at DESC);
