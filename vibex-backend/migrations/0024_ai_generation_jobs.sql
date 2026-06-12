-- Migration: 0024_ai_generation_jobs
-- Sprint91 E1: AI Template Generation
-- Stores AI generation job queue and results

CREATE TABLE IF NOT EXISTS ai_generation_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    -- status: 'pending' | 'processing' | 'completed' | 'failed'
    result_json TEXT,
    -- Serialized canvas/UI schema JSON when completed
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Index for user's job history
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_id ON ai_generation_jobs(user_id);

-- Index for status polling
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_generation_jobs(status);
