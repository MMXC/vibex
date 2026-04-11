/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { queryOne, executeDB, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const requirementId = new Hono<{ Bindings: Env }>();

interface RequirementRow {
  id: string;
  projectId: string;
  rawInput: string;
  parsedData: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/requirements/:id - Get requirement by ID
requirementId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [id]
    );

    if (!requirement) {
      return c.json({ error: 'Requirement not found' }, 404);
    }

    return c.json({ requirement });
  } catch (error) {
    safeError('Error fetching requirement:', error);
    return c.json({ error: 'Failed to fetch requirement' }, 500);
  }
});

// PUT /api/requirements/:id - Update requirement
requirementId.put('/', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { rawInput, parsedData, status, priority } = body;
    const env = c.env;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (rawInput !== undefined) {
      updates.push('rawInput = ?');
      values.push(rawInput);
    }
    if (parsedData !== undefined) {
      updates.push('parsedData = ?');
      values.push(parsedData);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id!);

      await executeDB(
        env,
        `UPDATE Requirement SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [id]
    );

    return c.json({ requirement });
  } catch (error) {
    safeError('Error updating requirement:', error);
    return c.json({ error: 'Failed to update requirement' }, 500);
  }
});

// DELETE /api/requirements/:id - Delete requirement
requirementId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM Requirement WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    safeError('Error deleting requirement:', error);
    return c.json({ error: 'Failed to delete requirement' }, 500);
  }
});

export default requirementId;
