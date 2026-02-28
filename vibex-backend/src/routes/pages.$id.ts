import { Hono } from 'hono';
import { queryOne, executeDB, Env } from '@/lib/db';

const pageId = new Hono<{ Bindings: Env }>();

interface PageRow {
  id: string;
  name: string;
  content: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/pages/:id - Get page by ID
pageId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const page = await queryOne<PageRow>(
      env,
      'SELECT * FROM Page WHERE id = ?',
      [id]
    );

    if (!page) {
      return c.json({ error: 'Page not found' }, 404);
    }

    return c.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    return c.json({ error: 'Failed to fetch page' }, 500);
  }
});

// PUT /api/pages/:id - Update page
pageId.put('/', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, content } = body;
    const env = c.env;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id);

      await executeDB(
        env,
        `UPDATE Page SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const page = await queryOne<PageRow>(
      env,
      'SELECT * FROM Page WHERE id = ?',
      [id]
    );

    return c.json({ page });
  } catch (error) {
    console.error('Error updating page:', error);
    return c.json({ error: 'Failed to update page' }, 500);
  }
});

// DELETE /api/pages/:id - Delete page
pageId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM Page WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return c.json({ error: 'Failed to delete page' }, 500);
  }
});

export default pageId;