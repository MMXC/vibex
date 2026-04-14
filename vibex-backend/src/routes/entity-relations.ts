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

const entityRelations = new Hono<{ Bindings: Env }>();

interface EntityRelationRow {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  description: string | null;
  createdAt: string;
}

// GET /api/entity-relations - List all entity relations (optionally filter by fromEntityId or toEntityId)
entityRelations.get('/', async (c) => {
  try {
    const fromEntityId = c.req.query('fromEntityId');
    const toEntityId = c.req.query('toEntityId');
    const env = c.env;

    let sql = 'SELECT * FROM EntityRelation';
    const params: string[] = [];

    if (fromEntityId && toEntityId) {
      sql += ' WHERE fromEntityId = ? AND toEntityId = ?';
      params.push(fromEntityId, toEntityId);
    } else if (fromEntityId) {
      sql += ' WHERE fromEntityId = ?';
      params.push(fromEntityId);
    } else if (toEntityId) {
      sql += ' WHERE toEntityId = ?';
      params.push(toEntityId);
    }
    sql += ' ORDER BY createdAt DESC';

    const relations = await queryDB<EntityRelationRow>(env, sql, params);

    return c.json({ entityRelations: relations });
  } catch (error) {
    safeError('Error fetching entity relations:', error);
    return         c.json(apiError('Failed to fetch entity relations', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// POST /api/entity-relations - Create a new entity relation
entityRelations.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { fromEntityId, toEntityId, relationType, description } = body;

    if (!fromEntityId || !toEntityId || !relationType) {
      return         c.json(apiError('Missing required fields: fromEntityId, toEntityId, relationType', ERROR_CODES.BAD_REQUEST), 400);
    }

    const env = c.env;
    const relationId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO EntityRelation (id, fromEntityId, toEntityId, relationType, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [relationId, fromEntityId, toEntityId, relationType, description || null, now]
    );

    const relation = await queryOne<EntityRelationRow>(
      env,
      'SELECT * FROM EntityRelation WHERE id = ?',
      [relationId]
    );

    return c.json({ entityRelation: relation }, 201);
  } catch (error) {
    safeError('Error creating entity relation:', error);
    return         c.json(apiError('Failed to create entity relation', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default entityRelations;
