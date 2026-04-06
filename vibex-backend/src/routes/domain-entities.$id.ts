import { Hono } from 'hono';
import { queryOne, executeDB, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const domainEntityId = new Hono<{ Bindings: Env }>();

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

// GET /api/domain-entities/:id - Get domain entity by ID
domainEntityId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const entity = await queryOne<DomainEntityRow>(
      env,
      'SELECT * FROM DomainEntity WHERE id = ?',
      [id]
    );

    if (!entity) {
      return c.json({ error: 'Domain entity not found' }, 404);
    }

    return c.json({ domainEntity: entity });
  } catch (error) {
    safeError('Error fetching domain entity:', error);
    return c.json({ error: 'Failed to fetch domain entity' }, 500);
  }
});

// PUT /api/domain-entities/:id - Update domain entity
domainEntityId.put('/', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, type, description, properties, requirementId } = body;
    const env = c.env;

    const now = new Date().toISOString();
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
      values.push(properties);
    }
    if (requirementId !== undefined) {
      updates.push('requirementId = ?');
      values.push(requirementId ?? null);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id as string);

      await executeDB(
        env,
        `UPDATE DomainEntity SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const entity = await queryOne<DomainEntityRow>(
      env,
      'SELECT * FROM DomainEntity WHERE id = ?',
      [id]
    );

    return c.json({ domainEntity: entity });
  } catch (error) {
    safeError('Error updating domain entity:', error);
    return c.json({ error: 'Failed to update domain entity' }, 500);
  }
});

// DELETE /api/domain-entities/:id - Delete domain entity
domainEntityId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM DomainEntity WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    safeError('Error deleting domain entity:', error);
    return c.json({ error: 'Failed to delete domain entity' }, 500);
  }
});

export default domainEntityId;
