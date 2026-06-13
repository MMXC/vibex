-- Migration: 0029_canvas_webhooks
-- Sprint94 E2: Advanced Canvas Sharing
-- Webhook configuration for canvas events (share created, share accessed, etc.)

CREATE TABLE IF NOT EXISTS canvas_webhooks (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL,
    url TEXT NOT NULL,
    -- HTTPS webhook URL
    secret TEXT,
    -- HMAC secret for payload signing
    events TEXT NOT NULL,
    -- JSON array of event types: ['share.created','share.accessed','share.expired','canvas.updated']
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for listing webhooks on a canvas
CREATE INDEX IF NOT EXISTS idx_canvas_webhooks_canvas ON canvas_webhooks(canvas_id);

-- Index for listing webhooks by creator
CREATE INDEX IF NOT EXISTS idx_canvas_webhooks_creator ON canvas_webhooks(created_by);

-- Index for event-type lookup (for fan-out)
CREATE INDEX IF NOT EXISTS idx_canvas_webhooks_active ON canvas_webhooks(is_active);
