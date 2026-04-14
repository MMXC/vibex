/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { TYPES_PACKAGE_VERSION } from '@vibex/types'; // E3: @vibex/types reference

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const domainEntities = new Hono<{ Bindings: Env }>();

interface DomainEntityRow {
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

// GET /api/domain-entities - List all domain entities (optionally filter by projectId or requirementId)
domainEntities.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const requirementId = c.req.query('requirementId');
    const env = c.env;

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

    const entities = await queryDB<DomainEntityRow>(env, sql, params);

    return c.json({ domainEntities: entities });
  } catch (error) {
    safeError('Error fetching domain entities:', error);
    return         c.json(apiError('Failed to fetch domain entities', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// POST /api/domain-entities - Create a new domain entity
domainEntities.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, name, type, description, properties, requirementId } = body;

    if (!projectId || !name || !type) {
      return         c.json(apiError('Missing required fields: projectId, name, type', ERROR_CODES.BAD_REQUEST), 400);
    }

    const env = c.env;
    const entityId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO DomainEntity (id, projectId, name, type, description, properties, requirementId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [entityId, projectId, name, type, description || null, properties || null, requirementId || null, now, now]
    );

    const entity = await queryOne<DomainEntityRow>(
      env,
      'SELECT * FROM DomainEntity WHERE id = ?',
      [entityId]
    );

    return c.json({ domainEntity: entity }, 201);
  } catch (error) {
    safeError('Error creating domain entity:', error);
    return         c.json(apiError('Failed to create domain entity', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default domainEntities;
