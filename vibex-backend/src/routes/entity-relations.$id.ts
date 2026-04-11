/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { queryOne, executeDB, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const entityRelationId = new Hono<{ Bindings: Env }>();

interface EntityRelationRow {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  description: string | null;
  createdAt: string;
}

// GET /api/entity-relations/:id - Get entity relation by ID
entityRelationId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const relation = await queryOne<EntityRelationRow>(
      env,
      'SELECT * FROM EntityRelation WHERE id = ?',
      [id]
    );

    if (!relation) {
      return c.json({ error: 'Entity relation not found' }, 404);
    }

    return c.json({ entityRelation: relation });
  } catch (error) {
    safeError('Error fetching entity relation:', error);
    return c.json({ error: 'Failed to fetch entity relation' }, 500);
  }
});

// PUT /api/entity-relations/:id - Update entity relation
entityRelationId.put('/', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { fromEntityId, toEntityId, relationType, description } = body;
    const env = c.env;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (fromEntityId !== undefined) {
      updates.push('fromEntityId = ?');
      values.push(fromEntityId);
    }
    if (toEntityId !== undefined) {
      updates.push('toEntityId = ?');
      values.push(toEntityId);
    }
    if (relationType !== undefined) {
      updates.push('relationType = ?');
      values.push(relationType);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length > 0) {
      values.push(id as string);

      await executeDB(
        env,
        `UPDATE EntityRelation SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const relation = await queryOne<EntityRelationRow>(
      env,
      'SELECT * FROM EntityRelation WHERE id = ?',
      [id]
    );

    return c.json({ entityRelation: relation });
  } catch (error) {
    safeError('Error updating entity relation:', error);
    return c.json({ error: 'Failed to update entity relation' }, 500);
  }
});

// DELETE /api/entity-relations/:id - Delete entity relation
entityRelationId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM EntityRelation WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    safeError('Error deleting entity relation:', error);
    return c.json({ error: 'Failed to delete entity relation' }, 500);
  }
});

export default entityRelationId;
