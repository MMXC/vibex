import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

const pages = new Hono<{ Bindings: Env }>();

interface PageRow {
  id: string;
  name: string;
  content: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/pages - List pages by project
pages.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const env = c.env;

    let sql = 'SELECT * FROM Page';
    const params: string[] = [];

    if (projectId) {
      sql += ' WHERE projectId = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY createdAt DESC';

    const pagesList = await queryDB<PageRow>(env, sql, params);

    return c.json({ pages: pagesList });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return c.json({ error: 'Failed to fetch pages' }, 500);
  }
});

// POST /api/pages - Create a new page
pages.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, content, projectId } = body;

    if (!name || !projectId) {
      return c.json({ error: 'Missing required fields: name, projectId' }, 400);
    }

    const env = c.env;
    const pageId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO Page (id, name, content, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [pageId, name, content || null, projectId, now, now]
    );

    const page = await queryOne<PageRow>(
      env,
      'SELECT * FROM Page WHERE id = ?',
      [pageId]
    );

    return c.json({ page }, 201);
  } catch (error) {
    console.error('Error creating page:', error);
    return c.json({ error: 'Failed to create page' }, 500);
  }
});

export default pages;