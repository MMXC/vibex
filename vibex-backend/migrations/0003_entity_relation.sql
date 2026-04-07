-- EntityRelation table for storing relationships between domain entities
-- Supports various relationship types like dependencies, associations, etc.

CREATE TABLE IF NOT EXISTS EntityRelation (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  sourceEntityId TEXT NOT NULL,
  targetEntityId TEXT NOT NULL,
  relationType TEXT NOT NULL CHECK (relationType IN (
    'depends-on',
    'related-to',
    'parent-child',
    'implements',
    'associates',
    'contains',
    'uses'
  )),
  description TEXT,
  properties TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE,
  FOREIGN KEY (sourceEntityId) REFERENCES DomainEntity(id) ON DELETE CASCADE,
  FOREIGN KEY (targetEntityId) REFERENCES DomainEntity(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_entity_relation_projectId ON EntityRelation(projectId);
CREATE INDEX IF NOT EXISTS idx_entity_relation_sourceEntityId ON EntityRelation(sourceEntityId);
CREATE INDEX IF NOT EXISTS idx_entity_relation_targetEntityId ON EntityRelation(targetEntityId);
CREATE INDEX IF NOT EXISTS idx_entity_relation_type ON EntityRelation(relationType);

-- Composite index for finding relations between two entities
CREATE INDEX IF NOT EXISTS idx_entity_relation_source_target ON EntityRelation(sourceEntityId, targetEntityId);
