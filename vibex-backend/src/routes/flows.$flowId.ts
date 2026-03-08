import { Hono } from 'hono';
import { queryOne, executeDB, Env } from '@/lib/db';

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
      return c.json({ error: 'Flow not found' }, 404);
    }

    return c.json({ flow });
  } catch (error) {
    console.error('Error fetching flow:', error);
    return c.json({ error: 'Failed to fetch flow' }, 500);
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
    console.error('Error updating flow:', error);
    return c.json({ error: 'Failed to update flow' }, 500);
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
    console.error('Error deleting flow:', error);
    return c.json({ error: 'Failed to delete flow' }, 500);
  }
});

export default flowId;