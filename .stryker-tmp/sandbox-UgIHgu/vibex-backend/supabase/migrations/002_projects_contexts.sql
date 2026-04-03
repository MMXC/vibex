-- Migration 002: Projects and Bounded Contexts
-- Created for Supabase migration in vibex-phase2-core-20260316

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requirement_text TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bounded_contexts table
CREATE TABLE IF NOT EXISTS bounded_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entities JSONB DEFAULT '[]',
    relationships JSONB DEFAULT '[]',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_bounded_contexts_project_id ON bounded_contexts(project_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounded_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Owners can view their own projects" 
    ON projects FOR SELECT 
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own projects" 
    ON projects FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own projects" 
    ON projects FOR UPDATE 
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own projects" 
    ON projects FOR DELETE 
    USING (auth.uid() = owner_id);

-- RLS Policies for bounded_contexts
CREATE POLICY "Project members can view bounded contexts" 
    ON bounded_contexts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = bounded_contexts.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can insert bounded contexts" 
    ON bounded_contexts FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = bounded_contexts.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can update bounded contexts" 
    ON bounded_contexts FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = bounded_contexts.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can delete bounded contexts" 
    ON bounded_contexts FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = bounded_contexts.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

COMMENT ON TABLE projects IS 'Projects owned by users';
COMMENT ON TABLE bounded_contexts IS 'DDD bounded contexts within a project';
