-- DomainEntity table for storing domain model entities
-- Used for AI-powered requirement analysis and entity extraction

CREATE TABLE IF NOT EXISTS DomainEntity (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  properties TEXT,
  requirementId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE,
  FOREIGN KEY (requirementId) REFERENCES Requirement(id) ON DELETE SET NULL
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_domain_entity_projectId ON DomainEntity(projectId);
CREATE INDEX IF NOT EXISTS idx_domain_entity_requirementId ON DomainEntity(requirementId);
