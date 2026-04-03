-- Migration 007: Final Configuration and Seed Data
-- Created for Supabase migration in vibex-phase2-core-20260316

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS for audit_logs (admin only view)
CREATE POLICY "Admins can view all audit logs" 
    ON audit_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.preferences->>'role' = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" 
    ON audit_logs FOR INSERT 
    WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborations_updated_at 
    BEFORE UPDATE ON collaborations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for project summary
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.created_at,
    p.updated_at,
    u.email as owner_email,
    COUNT(DISTINCT bc.id) as bounded_contexts_count,
    COUNT(DISTINCT dm.id) as domain_models_count,
    COUNT(DISTINCT f.id) as flows_count,
    COUNT(DISTINCT pg.id) as pages_count
FROM projects p
JOIN auth_users u ON u.id = p.owner_id
LEFT JOIN bounded_contexts bc ON bc.project_id = p.id
LEFT JOIN domain_models dm ON dm.project_id = p.id
LEFT JOIN flows f ON f.project_id = p.id
LEFT JOIN pages pg ON pg.project_id = p.id
GROUP BY p.id, p.name, p.status, p.created_at, p.updated_at, u.email;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON project_summary TO anon, authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE audit_logs IS 'Audit trail for all database changes';
COMMENT ON VIEW project_summary IS 'Aggregated project statistics';
