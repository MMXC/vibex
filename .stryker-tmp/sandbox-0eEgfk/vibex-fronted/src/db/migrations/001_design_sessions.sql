-- Database Schema for VibeX Interaction Redesign
-- New tables for design sessions and DDD modeling

-- =====================================================
-- Table: design_sessions
-- 存储设计会话，每个设计流程一个会话
-- =====================================================
CREATE TABLE IF NOT EXISTS design_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    
    -- Session State
    current_step VARCHAR(50) NOT NULL DEFAULT 'clarification',
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    -- in_progress, completed, archived
    
    -- Input Data
    requirement_text TEXT,
    clarification_history JSONB DEFAULT '[]',
    
    -- Output Data
    bounded_contexts JSONB DEFAULT '[]',
    domain_models JSONB DEFAULT '[]',
    business_flows JSONB DEFAULT '[]',
    ui_pages JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_step CHECK (current_step IN (
        'clarification', 'bounded-context', 'domain-model', 'business-flow', 'ui-generation'
    ))
);

-- Index for user queries
CREATE INDEX idx_design_sessions_user ON design_sessions(user_id);
CREATE INDEX idx_design_sessions_project ON design_sessions(project_id);
CREATE INDEX idx_design_sessions_status ON design_sessions(status);

-- =====================================================
-- Table: clarification_logs
-- 存储需求澄清对话日志
-- =====================================================
CREATE TABLE IF NOT EXISTS clarification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
    
    -- Message Content
    role VARCHAR(20) NOT NULL,  -- user, assistant
    content TEXT NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Extracted Requirements
    extracted_requirements JSONB DEFAULT '{}',
    is_accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Index for session queries
CREATE INDEX idx_clarification_logs_session ON clarification_logs(session_id);
CREATE INDEX idx_clarification_logs_created ON clarification_logs(created_at);

-- =====================================================
-- Table: domain_entities
-- 存储领域模型实体
-- =====================================================
CREATE TABLE IF NOT EXISTS domain_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
    bounded_context_id UUID,
    
    -- Entity Definition
    entity_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- aggregate, entity, value_object, domain_event
    description TEXT,
    
    -- Attributes
    attributes JSONB DEFAULT '[]',
    relationships JSONB DEFAULT '[]',
    
    -- Mermaid Code
    mermaid_code TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_domain_entities_session ON domain_entities(session_id);
CREATE INDEX idx_domain_entities_context ON domain_entities(bounded_context_id);

-- =====================================================
-- Table: business_flows
-- 存储业务流程
-- =====================================================
CREATE TABLE IF NOT EXISTS business_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
    
    -- Flow Definition
    flow_name VARCHAR(100) NOT NULL,
    flow_type VARCHAR(50),  -- user_flow, system_flow, process_flow
    description TEXT,
    
    -- Flow Data
    steps JSONB DEFAULT '[]',
    conditions JSONB DEFAULT '[]',
    
    -- Mermaid Code
    mermaid_code TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_business_flows_session ON business_flows(session_id);

-- =====================================================
-- Table: ui_pages
-- 存储生成的UI页面
-- =====================================================
CREATE TABLE IF NOT EXISTS ui_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES business_flows(id),
    
    -- Page Definition
    page_name VARCHAR(100) NOT NULL,
    page_type VARCHAR(50),  -- list, detail, form, dashboard, etc.
    description TEXT,
    
    -- Component Schema
    components JSONB DEFAULT '[]',
    layout JSONB DEFAULT '{}',
    styles JSONB DEFAULT '{}',
    
    -- Generated Code
    react_code TEXT,
    html_code TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Index
CREATE INDEX idx_ui_pages_session ON ui_pages(session_id);
CREATE INDEX idx_ui_pages_flow ON ui_pages(flow_id);

-- =====================================================
-- Rollback Script
-- =====================================================
/*
-- To rollback these changes:
DROP TABLE IF EXISTS ui_pages CASCADE;
DROP TABLE IF EXISTS business_flows CASCADE;
DROP TABLE IF EXISTS domain_entities CASCADE;
DROP TABLE IF EXISTS clarification_logs CASCADE;
DROP TABLE IF EXISTS design_sessions CASCADE;
*/
