/**
 * Domain Entity Service
 * 
 * Provides business logic for domain entity operations.
 * Domain entities represent the core business objects in a project,
 * typically derived from requirements analysis.
 * 
 * @module services/domain-entities
 */
// @ts-nocheck


import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

// ==================== Types ====================

export interface DomainEntity {
  id: string;
  projectId: string;
  name: string;
  type: string;
  description: string | null;
  properties: string | null;
  requirementId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainEntityCreateInput {
  projectId: string;
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, unknown> | string;
  requirementId?: string;
}

export interface DomainEntityUpdateInput {
  name?: string;
  type?: string;
  description?: string | null;
  properties?: Record<string, unknown> | string | null;
  requirementId?: string | null;
}

export interface DomainEntityFilters {
  projectId?: string;
  requirementId?: string;
}

// ==================== Service Functions ====================

/**
 * List domain entities with optional filters
 */
export async function listDomainEntities(
  env: Env,
  filters: DomainEntityFilters = {}
): Promise<DomainEntity[]> {
  const { projectId, requirementId } = filters;

  let sql = 'SELECT * FROM DomainEntity';
  const params: string[] = [];

  if (projectId && requirementId) {
    sql += ' WHERE projectId = ? AND requirementId = ?';
    params.push(projectId, requirementId);
  } else if (projectId) {
    sql += ' WHERE projectId = ?';
    params.push(projectId);
  } else if (requirementId) {
    sql += ' WHERE requirementId = ?';
    params.push(requirementId);
  }

  sql += ' ORDER BY createdAt DESC';

  return queryDB<DomainEntity>(env, sql, params);
}

/**
 * Get a single domain entity by ID
 */
export async function getDomainEntityById(
  env: Env,
  id: string
): Promise<DomainEntity | null> {
  return queryOne<DomainEntity>(
    env,
    'SELECT * FROM DomainEntity WHERE id = ?',
    [id]
  );
}

/**
 * Create a new domain entity
 */
export async function createDomainEntity(
  env: Env,
  input: DomainEntityCreateInput
): Promise<DomainEntity> {
  const { projectId, name, type, description, properties, requirementId } = input;

  const entityId = generateId();
  const now = new Date().toISOString();

  // Handle properties - convert object to JSON string if needed
  const propertiesValue = properties
    ? typeof properties === 'string'
      ? properties
      : JSON.stringify(properties)
    : null;

  await executeDB(
    env,
    `INSERT INTO DomainEntity (id, projectId, name, type, description, properties, requirementId, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entityId,
      projectId,
      name,
      type,
      description || null,
      propertiesValue,
      requirementId || null,
      now,
      now
    ]
  );

  const entity = await getDomainEntityById(env, entityId);
  
  if (!entity) {
    throw new Error('Failed to create domain entity');
  }

  return entity;
}

/**
 * Update an existing domain entity
 */
export async function updateDomainEntity(
  env: Env,
  id: string,
  input: DomainEntityUpdateInput
): Promise<DomainEntity | null> {
  const { name, type, description, properties, requirementId } = input;

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }

  if (type !== undefined) {
    updates.push('type = ?');
    values.push(type);
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

  if (requirementId !== undefined) {
    updates.push('requirementId = ?');
    values.push(requirementId);
  }

  if (updates.length === 0) {
    return getDomainEntityById(env, id);
  }

  // Always update the updatedAt timestamp
  updates.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await executeDB(
    env,
    `UPDATE DomainEntity SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return getDomainEntityById(env, id);
}

/**
 * Delete a domain entity
 */
export async function deleteDomainEntity(
  env: Env,
  id: string
): Promise<boolean> {
  const result = await executeDB(
    env,
    'DELETE FROM DomainEntity WHERE id = ?',
    [id]
  );

  return result.changes > 0;
}

/**
 * Check if a domain entity exists
 */
export async function domainEntityExists(
  env: Env,
  id: string
): Promise<boolean> {
  const entity = await getDomainEntityById(env, id);
  return entity !== null;
}

/**
 * Get domain entities count by project
 */
export async function countDomainEntitiesByProject(
  env: Env,
  projectId: string
): Promise<number> {
  const result = await queryOne<{ count: number }>(
    env,
    'SELECT COUNT(*) as count FROM DomainEntity WHERE projectId = ?',
    [projectId]
  );

  return result?.count || 0;
}

/**
 * Parse properties field from domain entity
 * Returns parsed object or null
 */
export function parseEntityProperties(entity: DomainEntity): Record<string, unknown> | null {
  if (!entity.properties) {
    return null;
  }

  try {
    return JSON.parse(entity.properties);
  } catch {
    return null;
  }
}
