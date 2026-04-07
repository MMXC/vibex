import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const requirements = new Hono<{ Bindings: Env }>();

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

// GET /api/requirements - List all requirements (optionally filter by projectId)
requirements.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const env = c.env;

    let sql = 'SELECT * FROM Requirement';
    const params: string[] = [];

    if (projectId) {
      sql += ' WHERE projectId = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY createdAt DESC';

    const requirementsList = await queryDB<RequirementRow>(env, sql, params);

    return c.json({ requirements: requirementsList });
  } catch (error) {
    safeError('Error fetching requirements:', error);
    return c.json({ error: 'Failed to fetch requirements' }, 500);
  }
});

// POST /api/requirements - Create a new requirement
requirements.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, rawInput, parsedData, status, priority } = body;

    if (!projectId || !rawInput) {
      return c.json({ error: 'Missing required fields: projectId, rawInput' }, 400);
    }

    const env = c.env;
    const requirementId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO Requirement (id, projectId, rawInput, parsedData, status, priority, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [requirementId, projectId, rawInput, parsedData || null, status || 'draft', priority || 'medium', now, now]
    );

    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    return c.json({ requirement }, 201);
  } catch (error) {
    safeError('Error creating requirement:', error);
    return c.json({ error: 'Failed to create requirement' }, 500);
  }
});

export default requirements;
