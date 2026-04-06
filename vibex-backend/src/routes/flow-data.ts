import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const flowData = new Hono<{ Bindings: Env }>();

interface FlowDataRow {
  id: string;
  name: string | null;
  nodes: string;
  edges: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/flow-data - List all flow data or filter by projectId
flowData.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const id = c.req.query('id');
    const env = c.env;

    // If id is provided, return single flow
    if (id) {
      const flow = await queryOne<FlowDataRow>(
        env,
        'SELECT * FROM FlowData WHERE id = ?',
        [id]
      );

      if (!flow) {
        return c.json({ error: 'Flow data not found' }, 404);
      }

      return c.json({ flowData: flow });
    }

    // List flows
    let sql = 'SELECT * FROM FlowData';
    const params: string[] = [];

    if (projectId) {
      sql += ' WHERE projectId = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY createdAt DESC';

    const flowsList = await queryDB<FlowDataRow>(env, sql, params);

    return c.json({ flowDataList: flowsList });
  } catch (error) {
    safeError('Error fetching flow data:', error);
    return c.json({ error: 'Failed to fetch flow data' }, 500);
  }
});

// POST /api/flow-data - Create new flow data
flowData.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, nodes, edges, projectId } = body;

    if (!projectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400);
    }

    const env = c.env;
    const flowId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO FlowData (id, name, nodes, edges, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [flowId, name || null, nodes || '[]', edges || '[]', projectId, now, now]
    );

    const flow = await queryOne<FlowDataRow>(
      env,
      'SELECT * FROM FlowData WHERE id = ?',
      [flowId]
    );

    return c.json({ flowData: flow }, 201);
  } catch (error) {
    safeError('Error creating flow data:', error);
    return c.json({ error: 'Failed to create flow data' }, 500);
  }
});

// GET /api/flow-data/:id - Get flow data by ID
flowData.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const flow = await queryOne<FlowDataRow>(
      env,
      'SELECT * FROM FlowData WHERE id = ?',
      [id]
    );

    if (!flow) {
      return c.json({ error: 'Flow data not found' }, 404);
    }

    return c.json({ flowData: flow });
  } catch (error) {
    safeError('Error fetching flow data:', error);
    return c.json({ error: 'Failed to fetch flow data' }, 500);
  }
});

// PUT /api/flow-data/:id - Update flow data
flowData.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, nodes, edges } = body;
    const env = c.env;

    // Check if flow exists
    const existing = await queryOne<FlowDataRow>(
      env,
      'SELECT * FROM FlowData WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ error: 'Flow data not found' }, 404);
    }

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
      values.push(id);

      await executeDB(
        env,
        `UPDATE FlowData SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const flow = await queryOne<FlowDataRow>(
      env,
      'SELECT * FROM FlowData WHERE id = ?',
      [id]
    );

    return c.json({ flowData: flow });
  } catch (error) {
    safeError('Error updating flow data:', error);
    return c.json({ error: 'Failed to update flow data' }, 500);
  }
});

// DELETE /api/flow-data/:id - Delete flow data
flowData.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    // Check if flow exists
    const existing = await queryOne<FlowDataRow>(
      env,
      'SELECT * FROM FlowData WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ error: 'Flow data not found' }, 404);
    }

    await executeDB(env, 'DELETE FROM FlowData WHERE id = ?', [id]);

    return c.json({ success: true, message: 'Flow data deleted successfully' });
  } catch (error) {
    safeError('Error deleting flow data:', error);
    return c.json({ error: 'Failed to delete flow data' }, 500);
  }
});

export default flowData;
