-- Migration: 0004_component.sql
-- Description: Create Component table for component library management

-- Create Component table
CREATE TABLE IF NOT EXISTS Component (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  props TEXT DEFAULT '{}',  -- JSON string for default props
  variants TEXT DEFAULT '[]', -- JSON array of variant objects
  style TEXT DEFAULT '{}',  -- JSON string for default style
  interactions TEXT DEFAULT '{}', -- JSON string for interactions
  replaceable INTEGER DEFAULT 0, -- boolean: can be replaced by alternatives
  alternatives TEXT DEFAULT '[]', -- JSON array of alternative component names
  projectId TEXT, -- optional project association for custom components
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_component_category ON Component(category);
CREATE INDEX IF NOT EXISTS idx_component_projectId ON Component(projectId);
CREATE INDEX IF NOT EXISTS idx_component_name ON Component(name);
