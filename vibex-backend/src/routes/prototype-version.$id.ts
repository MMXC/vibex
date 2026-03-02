import { Hono } from 'hono';
import { queryOne, executeDB, generateId, Env } from '@/lib/db';

const prototypeVersionId = new Hono<{ Bindings: Env }>();

interface PrototypeVersionRow {
  id: string;
  projectId: string;
  branchId: string | null;
  version: number;
  name: string | null;
  description: string | null;
  content: string;
  snapshotId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/prototype-versions/:id - Get version by ID
prototypeVersionId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const versionRecord = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [id]
    );

    if (!versionRecord) {
      return c.json({ error: 'Prototype version not found' }, 404);
    }

    return c.json({ prototypeVersion: versionRecord });
  } catch (error) {
    console.error('Error fetching prototype version:', error);
    return c.json({ error: 'Failed to fetch prototype version' }, 500);
  }
});

// PUT /api/prototype-versions/:id - Update version
prototypeVersionId.put('/', async (c) => {
  try {
    const id = c.req.param('id') as string;
    const body = await c.req.json();
    const { name, description, content, version } = body as { name?: string; description?: string; content?: string; version?: number };
    const env = c.env;

    // Check if version exists
    const existing = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ error: 'Prototype version not found' }, 404);
    }

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
      values.push(id);

      await executeDB(
        env,
        `UPDATE PrototypeVersion SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const versionRecord = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [id]
    );

    return c.json({ prototypeVersion: versionRecord });
  } catch (error) {
    console.error('Error updating prototype version:', error);
    return c.json({ error: 'Failed to update prototype version' }, 500);
  }
});

// DELETE /api/prototype-versions/:id - Delete version
prototypeVersionId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    // Check if version exists
    const existing = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ error: 'Prototype version not found' }, 404);
    }

    await executeDB(env, 'DELETE FROM PrototypeVersion WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting prototype version:', error);
    return c.json({ error: 'Failed to delete prototype version' }, 500);
  }
});

// POST /api/prototype-versions/:id/restore - Restore to this version (creates a new version)
prototypeVersionId.post('/restore', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, createdBy } = body;
    const env = c.env;

    // Get the version to restore
    const existing = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ error: 'Prototype version not found' }, 404);
    }

    // Get the next version number
    const nextVersionResult = await queryOne<{ maxVersion: number }>(
      env,
      'SELECT MAX(version) as maxVersion FROM PrototypeVersion WHERE projectId = ?',
      [existing.projectId]
    );
    const nextVersion = (nextVersionResult?.maxVersion || 0) + 1;

    // Create a new version with the restored content
    const newVersionId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO PrototypeVersion (id, projectId, branchId, version, name, description, content, snapshotId, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newVersionId,
        existing.projectId,
        existing.branchId,
        nextVersion,
        name || `Restored from v${existing.version}`,
        existing.description,
        existing.content,
        existing.snapshotId,
        createdBy || null,
        now,
        now,
      ]
    );

    const restoredVersion = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [newVersionId]
    );

    return c.json({ prototypeVersion: restoredVersion }, 201);
  } catch (error) {
    console.error('Error restoring prototype version:', error);
    return c.json({ error: 'Failed to restore prototype version' }, 500);
  }
});

// POST /api/prototype-versions/:id/duplicate - Duplicate a version as a new version
prototypeVersionId.post('/duplicate', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, description, createdBy } = body;
    const env = c.env;

    // Get the version to duplicate
    const existing = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ error: 'Prototype version not found' }, 404);
    }

    // Get the next version number
    const nextVersionResult = await queryOne<{ maxVersion: number }>(
      env,
      'SELECT MAX(version) as maxVersion FROM PrototypeVersion WHERE projectId = ?',
      [existing.projectId]
    );
    const nextVersion = (nextVersionResult?.maxVersion || 0) + 1;

    // Create a new version with the same content
    const newVersionId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO PrototypeVersion (id, projectId, branchId, version, name, description, content, snapshotId, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newVersionId,
        existing.projectId,
        existing.branchId,
        nextVersion,
        name || `${existing.name} (copy)` || `Copy of v${existing.version}`,
        description ?? existing.description,
        existing.content,
        existing.snapshotId,
        createdBy || null,
        now,
        now,
      ]
    );

    const duplicatedVersion = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [newVersionId]
    );

    return c.json({ prototypeVersion: duplicatedVersion }, 201);
  } catch (error) {
    console.error('Error duplicating prototype version:', error);
    return c.json({ error: 'Failed to duplicate prototype version' }, 500);
  }
});

export default prototypeVersionId;
