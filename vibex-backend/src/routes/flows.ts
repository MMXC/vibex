import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

const flows = new Hono<{ Bindings: Env }>();

interface FlowRow {
  id: string;
  name: string | null;
  nodes: string;
  edges: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/flows - List flows by project
flows.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const env = c.env;

    let sql = 'SELECT * FROM FlowData';
    const params: string[] = [];

    if (projectId) {
      sql += ' WHERE projectId = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY createdAt DESC';

    const flowsList = await queryDB<FlowRow>(env, sql, params);

    return c.json({ flows: flowsList });
  } catch (error) {
    console.error('Error fetching flows:', error);
    return c.json({ error: 'Failed to fetch flows' }, 500);
  }
});

// POST /api/flows - Create a new flow
flows.post('/', async (c) => {
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

    const flow = await queryOne<FlowRow>(
      env,
      'SELECT * FROM FlowData WHERE id = ?',
      [flowId]
    );

    return c.json({ flow }, 201);
  } catch (error) {
    console.error('Error creating flow:', error);
    return c.json({ error: 'Failed to create flow' }, 500);
  }
});

export default flows;