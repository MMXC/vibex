/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { queryOne, executeDB, Env } from '@/lib/db';
import { getAuthUserFromHono } from '@/lib/auth';

import { safeError } from '@/lib/log-sanitizer';

const projectId = new Hono<{ Bindings: Env }>();

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  deletedAt: string | null;
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
    safeError('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// PATCH /api/projects/:id/soft-delete - Soft delete (move to trash)
projectId.patch('/soft-delete', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const now = new Date().toISOString();

    await executeDB(
      env,
      'UPDATE Project SET deletedAt = ?, updatedAt = ? WHERE id = ?',
      [now, now, id]
    );

    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [id]
    );

    return c.json({ project });
  } catch (error) {
    safeError('Error soft-deleting project:', error);
    return c.json({ error: 'Failed to soft-delete project' }, 500);
  }
});

// PATCH /api/projects/:id/restore - Restore from trash
projectId.patch('/restore', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const now = new Date().toISOString();

    await executeDB(
      env,
      'UPDATE Project SET deletedAt = NULL, updatedAt = ? WHERE id = ?',
      [now, id]
    );

    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [id]
    );

    return c.json({ project });
  } catch (error) {
    safeError('Error restoring project:', error);
    return c.json({ error: 'Failed to restore project' }, 500);
  }
});

// DELETE /api/projects/:id/permanent - Permanently delete
projectId.delete('/permanent', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM Project WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    safeError('Error permanently deleting project:', error);
    return c.json({ error: 'Failed to permanently delete project' }, 500);
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
      values.push(id!);

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
    safeError('Error updating project:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// DELETE /api/projects/:id - Delete project (soft delete by default)
projectId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const permanent = c.req.query('permanent') === 'true';
    const env = c.env;

    if (permanent) {
      await executeDB(env, 'DELETE FROM Project WHERE id = ?', [id]);
    } else {
      const now = new Date().toISOString();
      await executeDB(
        env,
        'UPDATE Project SET deletedAt = ?, updatedAt = ? WHERE id = ?',
        [now, now, id]
      );
    }

    return c.json({ success: true });
  } catch (error) {
    safeError('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

export default projectId;