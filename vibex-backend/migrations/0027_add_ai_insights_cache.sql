-- Migration: 0027_add_ai_insights_cache
-- Sprint94 E1: Canvas AI Insights — health score, optimization suggestions, isolated nodes
-- Stores AI-generated canvas health insights and optimization cache

CREATE TABLE IF NOT EXISTS ai_insights_cache (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    -- Health score 0-100 based on node count, edge count, isolated node ratio
    suggestions TEXT NOT NULL,
    -- JSON array of suggestion strings
    isolated_nodes TEXT NOT NULL,
    -- JSON array of isolated node IDs (degree = 0)
    created_at INTEGER NOT NULL
);

-- Index for fast lookup by canvas_id
CREATE INDEX IF NOT EXISTS idx_ai_insights_canvas_id ON ai_insights_cache(canvas_id);

-- Index for TTL cleanup (oldest first)
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights_cache(created_at);
