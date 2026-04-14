/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { queryOne, executeDB, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const flowId = new Hono<{ Bindings: Env }>();

interface FlowRow {
  id: string;
  name: string | null;
  nodes: string;
  edges: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/flows/:flowId - Get flow by ID
flowId.get('/', async (c) => {
  try {
    const id = c.req.param('flowId');
    const env = c.env;

    const flow = await queryOne<FlowRow>(
      env,
      'SELECT * FROM FlowData WHERE id = ?',
      [id]
    );

    if (!flow) {
      return         c.json(apiError('Flow not found', ERROR_CODES.FLOW_NOT_FOUND), 404);
    }

    return c.json({ flow });
  } catch (error) {
    safeError('Error fetching flow:', error);
    return         c.json(apiError('Failed to fetch flow', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// PUT /api/flows/:flowId - Update flow
flowId.put('/', async (c) => {
  try {
    const id = c.req.param('flowId');
    const body = await c.req.json();
    const { name, nodes, edges } = body;
    const env = c.env;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (nodes !== undefined) {
      updates.push('nodes = ?');
      values.push(nodes);
    }
    if (edges !== undefined) {
      updates.push('edges = ?');
      values.push(edges);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id!);

      await executeDB(
        env,
        `UPDATE FlowData SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const flow = await queryOne<FlowRow>(
      env,
      'SELECT * FROM FlowData WHERE id = ?',
      [id]
    );

    return c.json({ flow });
  } catch (error) {
    safeError('Error updating flow:', error);
    return         c.json(apiError('Failed to update flow', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// DELETE /api/flows/:flowId - Delete flow
flowId.delete('/', async (c) => {
  try {
    const id = c.req.param('flowId');
    const env = c.env;

    await executeDB(env, 'DELETE FROM FlowData WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    safeError('Error deleting flow:', error);
    return         c.json(apiError('Failed to delete flow', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default flowId;