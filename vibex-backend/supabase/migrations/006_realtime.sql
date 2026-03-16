-- Migration 006: Realtime Configuration
-- Created for Supabase migration in vibex-phase2-core-20260316

-- Enable realtime extension
CREATE EXTENSION IF NOT EXISTS pg_publish;

-- Create publication for realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Enable realtime on specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE domain_models;
ALTER PUBLICATION supabase_realtime ADD TABLE bounded_contexts;
ALTER PUBLICATION supabase_realtime ADD TABLE flows;
ALTER PUBLICATION supabase_realtime ADD TABLE pages;
ALTER PUBLICATION supabase_realtime ADD TABLE collaborations;
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_participants;

-- Create realtime presence tracking table
CREATE TABLE IF NOT EXISTS collaboration_presence (
    collaboration_id UUID REFERENCES collaborations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    presence_data JSONB DEFAULT '{}',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (collaboration_id, user_id)
);

-- Create index for presence queries
CREATE INDEX idx_presence_collaboration ON collaboration_presence(collaboration_id);
CREATE INDEX idx_presence_user ON collaboration_presence(user_id);
CREATE INDEX idx_presence_last_seen ON collaboration_presence(last_seen);

-- Enable RLS
ALTER TABLE collaboration_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_presence
CREATE POLICY "Project members can view presence" 
    ON collaboration_presence FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM collaborations c
            JOIN projects p ON p.id = c.project_id
            WHERE c.id = collaboration_presence.collaboration_id
            AND p.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own presence" 
    ON collaboration_presence FOR ALL 
    USING (auth.uid() = user_id);

-- Create trigger for presence updates
CREATE OR REPLACE FUNCTION update_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = NOW();
    RETURN NEW;
END;
;

CREATE$$ LANGUAGE plpgsql TRIGGER update_presence_ts
    BEFORE UPDATE ON collaboration_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_presence_timestamp();

-- Enable realtime on collaboration_presence
ALTER TABLE collaboration_presence REPLICA IDENTITY FULL;

COMMENT ON TABLE collaboration_presence IS 'Real-time presence tracking for collaboration sessions';
COMMENT ON PUBLICATION supabase_realtime IS 'Supabase Realtime publication for real-time updates';
