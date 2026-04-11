/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { queryOne, executeDB, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const branchId = new Hono<{ Bindings: Env }>();

interface BranchRow {
  id: string;
  name: string | null;
  description: string | null;
  parentId: string | null;
  rootMessageId: string | null;
  metadata: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/branches/:id - Get branch by ID
branchId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const branch = await queryOne<BranchRow>(
      env,
      'SELECT * FROM BranchData WHERE id = ?',
      [id]
    );

    if (!branch) {
      return c.json({ error: 'Branch not found' }, 404);
    }

    return c.json({ branch });
  } catch (error) {
    safeError('Error fetching branch:', error);
    return c.json({ error: 'Failed to fetch branch' }, 500);
  }
});

// PUT /api/branches/:id - Update branch
branchId.put('/', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, description, parentId, rootMessageId, metadata } = body;
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
    if (parentId !== undefined) {
      updates.push('parentId = ?');
      values.push(parentId);
    }
    if (rootMessageId !== undefined) {
      updates.push('rootMessageId = ?');
      values.push(rootMessageId);
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(metadata);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id!);

      await executeDB(
        env,
        `UPDATE BranchData SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const branch = await queryOne<BranchRow>(
      env,
      'SELECT * FROM BranchData WHERE id = ?',
      [id]
    );

    return c.json({ branch });
  } catch (error) {
    safeError('Error updating branch:', error);
    return c.json({ error: 'Failed to update branch' }, 500);
  }
});

// DELETE /api/branches/:id - Delete branch
branchId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM BranchData WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    safeError('Error deleting branch:', error);
    return c.json({ error: 'Failed to delete branch' }, 500);
  }
});

export default branchId;
