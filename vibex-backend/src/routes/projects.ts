import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

const projects = new Hono<{ Bindings: Env }>();

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/projects - List all projects (or filter by userId)
projects.get('/', async (c) => {
  try {
    const userId = c.req.query('userId');
    const env = c.env;

    let sql = 'SELECT * FROM Project';
    const params: string[] = [];

    if (userId) {
      sql += ' WHERE userId = ?';
      params.push(userId);
    }
    sql += ' ORDER BY createdAt DESC';

    const projectsList = await queryDB<ProjectRow>(env, sql, params);

    return c.json({ projects: projectsList });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// POST /api/projects - Create a new project
projects.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, userId } = body;

    if (!name || !userId) {
      return c.json({ error: 'Missing required fields: name, userId' }, 400);
    }

    const env = c.env;
    const projectId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO Project (id, name, description, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [projectId, name, description || null, userId, now, now]
    );

    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    return c.json({ project }, 201);
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

export default projects;