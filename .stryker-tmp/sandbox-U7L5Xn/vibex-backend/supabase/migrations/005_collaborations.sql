-- Migration 005: Collaborations
-- Created for Supabase migration in vibex-phase2-core-20260316

-- Create collaborations table
CREATE TABLE IF NOT EXISTS collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'realtime',
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaboration_participants table
CREATE TABLE IF NOT EXISTS collaboration_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaboration_id UUID REFERENCES collaborations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_online BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX idx_collaborations_project_id ON collaborations(project_id);
CREATE INDEX idx_collaboration_participants_collab_id ON collaboration_participants(collaboration_id);
CREATE INDEX idx_collaboration_participants_user_id ON collaboration_participants(user_id);
CREATE INDEX idx_collaboration_participants_online ON collaboration_participants(collaboration_id, is_online) WHERE is_online = true;

-- Enable RLS
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaborations
CREATE POLICY "Project members can view collaborations" 
    ON collaborations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = collaborations.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can insert collaborations" 
    ON collaborations FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = collaborations.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can update collaborations" 
    ON collaborations FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = collaborations.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can delete collaborations" 
    ON collaborations FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = collaborations.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- RLS Policies for collaboration_participants
CREATE POLICY "Participants can view collaboration participants" 
    ON collaboration_participants FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM collaborations c
            JOIN projects p ON p.id = c.project_id
            WHERE c.id = collaboration_participants.collaboration_id
            AND p.owner_id = auth.uid()
        )
    );

CREATE POLICY "Auth users can insert their participation" 
    ON collaboration_participants FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can update their own participation" 
    ON collaboration_participants FOR UPDATE 
    USING (auth.uid() = user_id);

COMMENT ON TABLE collaborations IS 'Real-time collaboration sessions';
COMMENT ON TABLE collaboration_participants IS 'Participants in collaboration sessions';
