import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

const projects = new Hono<{ Bindings: Env }>();

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/projects - List active projects OR get project snapshot
projects.get('/', async (c) => {
  try {
    const userId = c.req.query('userId');
    const include = c.req.query('include');
    const projectId = c.req.query('id');
    const version = c.req.query('version');
    const env = c.env;

    // Snapshot mode: GET /api/projects?id=&include=snapshot
    if (include === 'snapshot' && projectId) {
      const { getProjectSnapshot } = await import('./project-snapshot');
      const result = await getProjectSnapshot(env, projectId, version ? parseInt(version) : undefined);
      if (!result.success) {
        const status = result.code === 'NOT_FOUND' ? 404 : result.code === 'FORBIDDEN' ? 403 : 500;
        return c.json({ success: false, error: result.error, code: result.code }, status);
      }
      return c.json({ success: true, data: result.data });
    }

    // List mode: GET /api/projects or GET /api/projects?userId=
    let sql = 'SELECT * FROM Project WHERE deletedAt IS NULL';
    const params: string[] = [];

    if (userId) {
      sql += ' AND userId = ?';
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

// GET /api/projects/trash - Get soft-deleted projects (recycle bin)
projects.get('/trash', async (c) => {
  try {
    const userId = c.req.query('userId');
    const env = c.env;

    let sql = 'SELECT * FROM Project WHERE deletedAt IS NOT NULL';
    const params: string[] = [];

    if (userId) {
      sql += ' AND userId = ?';
      params.push(userId);
    }
    sql += ' ORDER BY deletedAt DESC';

    const projectsList = await queryDB<ProjectRow>(env, sql, params);

    return c.json({ projects: projectsList });
  } catch (error) {
    console.error('Error fetching trash:', error);
    return c.json({ error: 'Failed to fetch trash' }, 500);
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