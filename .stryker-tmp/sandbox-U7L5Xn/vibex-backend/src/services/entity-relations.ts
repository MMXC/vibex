/**
 * Entity Relations Service
 * 
 * Provides business logic for managing relationships between domain entities.
 * Supports various relationship types like dependencies, associations, 
 * compositions, and inheritance.
 * 
 * @module services/entity-relations
 */
// @ts-nocheck


import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

// ==================== Types ====================

/**
 * Relationship types between entities
 */
export type RelationType = 
  | 'depends-on'
  | 'related-to'
  | 'parent-child'
  | 'implements'
  | 'associates'
  | 'contains'
  | 'uses';

/**
 * Entity relation representing a connection between two domain entities
 */
export interface EntityRelation {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: RelationType;
  description: string | null;
  properties: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntityRelationCreateInput {
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: RelationType;
  description?: string;
  properties?: Record<string, unknown> | string;
}

export interface EntityRelationUpdateInput {
  relationType?: RelationType;
  description?: string | null;
  properties?: Record<string, unknown> | string | null;
}

export interface EntityRelationFilters {
  projectId?: string;
  sourceEntityId?: string;
  targetEntityId?: string;
  relationType?: RelationType;
}

// ==================== Service Functions ====================

/**
 * List entity relations with optional filters
 */
export async function listEntityRelations(
  env: Env,
  filters: EntityRelationFilters = {}
): Promise<EntityRelation[]> {
  const { projectId, sourceEntityId, targetEntityId, relationType } = filters;

  let sql = 'SELECT * FROM EntityRelation';
  const conditions: string[] = [];
  const params: string[] = [];

  if (projectId) {
    conditions.push('projectId = ?');
    params.push(projectId);
  }

  if (sourceEntityId) {
    conditions.push('sourceEntityId = ?');
    params.push(sourceEntityId);
  }

  if (targetEntityId) {
    conditions.push('targetEntityId = ?');
    params.push(targetEntityId);
  }

  if (relationType) {
    conditions.push('relationType = ?');
    params.push(relationType);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY createdAt DESC';

  return queryDB<EntityRelation>(env, sql, params);
}

/**
 * Get all relations for a specific entity (both as source and target)
 */
export async function getEntityRelations(
  env: Env,
  entityId: string
): Promise<EntityRelation[]> {
  return queryDB<EntityRelation>(
    env,
    `SELECT * FROM EntityRelation 
     WHERE sourceEntityId = ? OR targetEntityId = ?
     ORDER BY createdAt DESC`,
    [entityId, entityId]
  );
}

/**
 * Get relations where entity is the source (outgoing relations)
 */
export async function getOutgoingRelations(
  env: Env,
  entityId: string
): Promise<EntityRelation[]> {
  return queryDB<EntityRelation>(
    env,
    'SELECT * FROM EntityRelation WHERE sourceEntityId = ? ORDER BY createdAt DESC',
    [entityId]
  );
}

/**
 * Get relations where entity is the target (incoming relations)
 */
export async function getIncomingRelations(
  env: Env,
  entityId: string
): Promise<EntityRelation[]> {
  return queryDB<EntityRelation>(
    env,
    'SELECT * FROM EntityRelation WHERE targetEntityId = ? ORDER BY createdAt DESC',
    [entityId]
  );
}

/**
 * Get a single entity relation by ID
 */
export async function getEntityRelationById(
  env: Env,
  id: string
): Promise<EntityRelation | null> {
  return queryOne<EntityRelation>(
    env,
    'SELECT * FROM EntityRelation WHERE id = ?',
    [id]
  );
}

/**
 * Check if a specific relation exists between two entities
 */
export async function relationExists(
  env: Env,
  sourceEntityId: string,
  targetEntityId: string,
  relationType?: RelationType
): Promise<boolean> {
  let sql = 'SELECT 1 FROM EntityRelation WHERE sourceEntityId = ? AND targetEntityId = ?';
  const params: string[] = [sourceEntityId, targetEntityId];

  if (relationType) {
    sql += ' AND relationType = ?';
    params.push(relationType);
  }

  const result = await queryOne(env, sql, params);
  return result !== null;
}

/**
 * Create a new entity relation
 */
export async function createEntityRelation(
  env: Env,
  input: EntityRelationCreateInput
): Promise<EntityRelation> {
  const { projectId, sourceEntityId, targetEntityId, relationType, description, properties } = input;

  // Prevent self-referencing relations
  if (sourceEntityId === targetEntityId) {
    throw new Error('Cannot create a relation from an entity to itself');
  }

  const relationId = generateId();
  const now = new Date().toISOString();

  // Handle properties - convert object to JSON string if needed
  const propertiesValue = properties
    ? typeof properties === 'string'
      ? properties
      : JSON.stringify(properties)
    : null;

  await executeDB(
    env,
    `INSERT INTO EntityRelation (id, projectId, sourceEntityId, targetEntityId, relationType, description, properties, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      relationId,
      projectId,
      sourceEntityId,
      targetEntityId,
      relationType,
      description || null,
      propertiesValue,
      now,
      now
    ]
  );

  const relation = await getEntityRelationById(env, relationId);
  
  if (!relation) {
    throw new Error('Failed to create entity relation');
  }

  return relation;
}

/**
 * Update an existing entity relation
 */
export async function updateEntityRelation(
  env: Env,
  id: string,
  input: EntityRelationUpdateInput
): Promise<EntityRelation | null> {
  const { relationType, description, properties } = input;

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (relationType !== undefined) {
    updates.push('relationType = ?');
    values.push(relationType);
  }

  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }

  if (properties !== undefined) {
    updates.push('properties = ?');
    const propertiesValue = properties
      ? typeof properties === 'string'
        ? properties
        : JSON.stringify(properties)
      : null;
    values.push(propertiesValue);
  }

  if (updates.length === 0) {
    return getEntityRelationById(env, id);
  }

  // Always update the updatedAt timestamp
  updates.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await executeDB(
    env,
    `UPDATE EntityRelation SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return getEntityRelationById(env, id);
}

/**
 * Delete an entity relation
 */
export async function deleteEntityRelation(
  env: Env,
  id: string
): Promise<boolean> {
  const result = await executeDB(
    env,
    'DELETE FROM EntityRelation WHERE id = ?',
    [id]
  );

  return result.changes > 0;
}

/**
 * Delete all relations for a specific entity
 */
export async function deleteEntityAllRelations(
  env: Env,
  entityId: string
): Promise<number> {
  const result = await executeDB(
    env,
    'DELETE FROM EntityRelation WHERE sourceEntityId = ? OR targetEntityId = ?',
    [entityId, entityId]
  );

  return result.changes;
}

/**
 * Delete all relations for a specific project
 */
export async function deleteProjectRelations(
  env: Env,
  projectId: string
): Promise<number> {
  const result = await executeDB(
    env,
    'DELETE FROM EntityRelation WHERE projectId = ?',
    [projectId]
  );

  return result.changes;
}

/**
 * Get relation count for an entity
 */
export async function countEntityRelations(
  env: Env,
  entityId: string
): Promise<number> {
  const result = await queryOne<{ count: number }>(
    env,
    'SELECT COUNT(*) as count FROM EntityRelation WHERE sourceEntityId = ? OR targetEntityId = ?',
    [entityId, entityId]
  );

  return result?.count || 0;
}

/**
 * Get relations count by project
 */
export async function countProjectRelations(
  env: Env,
  projectId: string
): Promise<number> {
  const result = await queryOne<{ count: number }>(
    env,
    'SELECT COUNT(*) as count FROM EntityRelation WHERE projectId = ?',
    [projectId]
  );

  return result?.count || 0;
}

/**
 * Get entities related to a specific entity by relation type
 */
export async function getRelatedEntitiesByType(
  env: Env,
  entityId: string,
  relationType: RelationType,
  direction: 'source' | 'target' | 'both' = 'both'
): Promise<EntityRelation[]> {
  let sql: string;
  const params: string[] = [entityId, relationType];

  switch (direction) {
    case 'source':
      sql = 'SELECT * FROM EntityRelation WHERE sourceEntityId = ? AND relationType = ? ORDER BY createdAt DESC';
      break;
    case 'target':
      sql = 'SELECT * FROM EntityRelation WHERE targetEntityId = ? AND relationType = ? ORDER BY createdAt DESC';
      break;
    case 'both':
    default:
      sql = 'SELECT * FROM EntityRelation WHERE (sourceEntityId = ? OR targetEntityId = ?) AND relationType = ? ORDER BY createdAt DESC';
      params.push(entityId);
      break;
  }

  return queryDB<EntityRelation>(env, sql, params);
}

/**
 * Parse properties field from entity relation
 * Returns parsed object or null
 */
export function parseRelationProperties(relation: EntityRelation): Record<string, unknown> | null {
  if (!relation.properties) {
    return null;
  }

  try {
    return JSON.parse(relation.properties);
  } catch {
    return null;
  }
}

/**
 * Validate relation type is valid
 */
export function isValidRelationType(type: string): type is RelationType {
  const validTypes: RelationType[] = [
    'depends-on',
    'related-to',
    'parent-child',
    'implements',
    'associates',
    'contains',
    'uses'
  ];
  return validTypes.includes(type as RelationType);
}
