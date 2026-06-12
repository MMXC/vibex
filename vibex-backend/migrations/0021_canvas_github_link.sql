-- Sprint89 E4: GitHub Integration Deep Link
-- D1 migration 0021 — add github_pr_url field to canvas table

ALTER TABLE canvas ADD COLUMN github_pr_url TEXT DEFAULT NULL;

-- Index for fast lookup by github_pr_url
CREATE INDEX IF NOT EXISTS idx_canvas_github_pr ON canvas(github_pr_url);
