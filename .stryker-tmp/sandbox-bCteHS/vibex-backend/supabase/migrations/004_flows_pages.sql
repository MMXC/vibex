-- Migration 004: Flows and Pages
-- Created for Supabase migration in vibex-phase2-core-20260316

-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    steps JSONB DEFAULT '[]',
    mermaid_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    route VARCHAR(500),
    content JSONB DEFAULT '{}',
    components JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_flows_project_id ON flows(project_id);
CREATE INDEX idx_pages_project_id ON pages(project_id);
CREATE INDEX idx_pages_route ON pages(route);

-- Enable RLS
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flows
CREATE POLICY "Project members can view flows" 
    ON flows FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = flows.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can insert flows" 
    ON flows FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = flows.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can update flows" 
    ON flows FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = flows.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can delete flows" 
    ON flows FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = flows.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- RLS Policies for pages
CREATE POLICY "Project members can view pages" 
    ON pages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = pages.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can insert pages" 
    ON pages FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = pages.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can update pages" 
    ON pages FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = pages.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can delete pages" 
    ON pages FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = pages.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

COMMENT ON TABLE flows IS 'Flow definitions using Mermaid syntax';
COMMENT ON TABLE pages IS 'Page/component definitions for the project';
