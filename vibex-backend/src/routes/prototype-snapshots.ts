import { Hono } from 'hono';
/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const prototypeSnapshots = new Hono<{ Bindings: Env }>();

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

// GET /api/prototype-snapshots - List snapshots by project
prototypeSnapshots.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const env = c.env;

    let sql = 'SELECT * FROM PrototypeSnapshot';
    const params: string[] = [];

    if (projectId) {
      sql += ' WHERE projectId = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY createdAt DESC';

    const snapshots = await queryDB<PrototypeSnapshotRow>(env, sql, params);

    return c.json({ prototypeSnapshots: snapshots });
  } catch (error) {
    safeError('Error fetching prototype snapshots:', error);
    return c.json({ error: 'Failed to fetch prototype snapshots' }, 500);
  }
});

// POST /api/prototype-snapshots - Create a new snapshot
prototypeSnapshots.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, name, description, content, version } = body;

    if (!projectId || !content) {
      return c.json({ error: 'Missing required fields: projectId, content' }, 400);
    }

    const env = c.env;
    const snapshotId = generateId();
    const now = new Date().toISOString();

    // Get the next version number for this project
    const existingSnapshots = await queryDB<{ maxVersion: number }>(
      env,
      'SELECT MAX(version) as maxVersion FROM PrototypeSnapshot WHERE projectId = ?',
      [projectId]
    );
    const nextVersion = (existingSnapshots[0]?.maxVersion || 0) + 1;

    await executeDB(
      env,
      'INSERT INTO PrototypeSnapshot (id, projectId, version, name, description, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [snapshotId, projectId, version || nextVersion, name || null, description || null, content, now, now]
    );

    const snapshot = await queryOne<PrototypeSnapshotRow>(
      env,
      'SELECT * FROM PrototypeSnapshot WHERE id = ?',
      [snapshotId]
    );

    return c.json({ prototypeSnapshot: snapshot }, 201);
  } catch (error) {
    safeError('Error creating prototype snapshot:', error);
    return c.json({ error: 'Failed to create prototype snapshot' }, 500);
  }
});

export default prototypeSnapshots;
