/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { queryOne, executeDB, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const prototypeSnapshotId = new Hono<{ Bindings: Env }>();

interface PrototypeSnapshotRow {
  id: string;
  projectId: string;
  version: number;
  name: string | null;
  description: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/prototype-snapshots/:id - Get snapshot by ID
prototypeSnapshotId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const snapshot = await queryOne<PrototypeSnapshotRow>(
      env,
      'SELECT * FROM PrototypeSnapshot WHERE id = ?',
      [id]
    );

    if (!snapshot) {
      return c.json({ error: 'Prototype snapshot not found' }, 404);
    }

    return c.json({ prototypeSnapshot: snapshot });
  } catch (error) {
    safeError('Error fetching prototype snapshot:', error);
    return c.json({ error: 'Failed to fetch prototype snapshot' }, 500);
  }
});

// PUT /api/prototype-snapshots/:id - Update snapshot
prototypeSnapshotId.put('/', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, description, content, version } = body;
    const env = c.env;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (version !== undefined) {
      updates.push('version = ?');
      values.push(version);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id as string);

      await executeDB(
        env,
        `UPDATE PrototypeSnapshot SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const snapshot = await queryOne<PrototypeSnapshotRow>(
      env,
      'SELECT * FROM PrototypeSnapshot WHERE id = ?',
      [id]
    );

    return c.json({ prototypeSnapshot: snapshot });
  } catch (error) {
    safeError('Error updating prototype snapshot:', error);
    return c.json({ error: 'Failed to update prototype snapshot' }, 500);
  }
});

// DELETE /api/prototype-snapshots/:id - Delete snapshot
prototypeSnapshotId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM PrototypeSnapshot WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    safeError('Error deleting prototype snapshot:', error);
    return c.json({ error: 'Failed to delete prototype snapshot' }, 500);
  }
});

export default prototypeSnapshotId;
