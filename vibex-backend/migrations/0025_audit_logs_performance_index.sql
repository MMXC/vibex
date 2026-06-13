-- S95-E1: Canvas Analytics Dashboard
-- Performance index for analytics queries on audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_canvas_created
ON audit_logs(canvas_id, created_at);
