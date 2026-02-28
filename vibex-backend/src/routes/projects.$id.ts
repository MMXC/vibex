import { Hono } from 'hono';
import { queryOne, executeDB, Env } from '@/lib/db';
import { getAuthUserFromHono } from '@/lib/auth';

const projectId = new Hono<{ Bindings: Env }>();

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/projects/:id - Get project by ID
projectId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [id]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// PUT /api/projects/:id - Update project
projectId.put('/', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, description } = body;
    const env = c.env;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id);

      await executeDB(
        env,
        `UPDATE Project SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [id]
    );

    return c.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// DELETE /api/projects/:id - Delete project
projectId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM Project WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

export default projectId;