-- Migration 003: Domain Models, Properties, and Methods
-- Created for Supabase migration in vibex-phase2-core-20260316

-- Create domain_models table
CREATE TABLE IF NOT EXISTS domain_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    bounded_context_id UUID REFERENCES bounded_contexts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'entity',
    properties JSONB DEFAULT '[]',
    methods JSONB DEFAULT '[]',
    relationships JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create domain_properties table
CREATE TABLE IF NOT EXISTS domain_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_model_id UUID REFERENCES domain_models(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create domain_methods table
CREATE TABLE IF NOT EXISTS domain_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_model_id UUID REFERENCES domain_models(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    return_type VARCHAR(100),
    parameters JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_domain_models_project_id ON domain_models(project_id);
CREATE INDEX idx_domain_models_bounded_context_id ON domain_models(bounded_context_id);
CREATE INDEX idx_domain_properties_model_id ON domain_properties(domain_model_id);
CREATE INDEX idx_domain_methods_model_id ON domain_methods(domain_model_id);

-- Enable RLS
ALTER TABLE domain_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for domain_models
CREATE POLICY "Project members can view domain models" 
    ON domain_models FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = domain_models.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can insert domain models" 
    ON domain_models FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = domain_models.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can update domain models" 
    ON domain_models FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = domain_models.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can delete domain models" 
    ON domain_models FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = domain_models.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- RLS Policies for domain_properties (inherited from domain_models)
CREATE POLICY "Project members can view domain properties" 
    ON domain_properties FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM domain_models dm
            JOIN projects p ON p.id = dm.project_id
            WHERE dm.id = domain_properties.domain_model_id
            AND p.owner_id = auth.uid()
        )
    );

-- RLS Policies for domain_methods (inherited from domain_models)
CREATE POLICY "Project members can view domain methods" 
    ON domain_methods FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM domain_models dm
            JOIN projects p ON p.id = dm.project_id
            WHERE dm.id = domain_methods.domain_model_id
            AND p.owner_id = auth.uid()
        )
    );

COMMENT ON TABLE domain_models IS 'DDD domain models within bounded contexts';
COMMENT ON TABLE domain_properties IS 'Properties of domain models';
COMMENT ON TABLE domain_methods IS 'Methods of domain models';
