/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const branches = new Hono<{ Bindings: Env }>();

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

// GET /api/branches - List branches by project
branches.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const parentId = c.req.query('parentId');
    const env = c.env;

    let sql = 'SELECT * FROM BranchData';
    const params: string[] = [];
    const conditions: string[] = [];

    if (projectId) {
      conditions.push('projectId = ?');
      params.push(projectId);
    }

    if (parentId) {
      conditions.push('parentId = ?');
      params.push(parentId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY createdAt DESC';

    const branchesList = await queryDB<BranchRow>(env, sql, params);

    return c.json({ branches: branchesList });
  } catch (error) {
    safeError('Error fetching branches:', error);
    return c.json({ error: 'Failed to fetch branches' }, 500);
  }
});

// POST /api/branches - Create a new branch
branches.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, parentId, rootMessageId, metadata, projectId } = body;

    if (!projectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400);
    }

    const env = c.env;
    const branchId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO BranchData (id, name, description, parentId, rootMessageId, metadata, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        branchId,
        name || null,
        description || null,
        parentId || null,
        rootMessageId || null,
        metadata || '{}',
        projectId,
        now,
        now,
      ]
    );

    const branch = await queryOne<BranchRow>(
      env,
      'SELECT * FROM BranchData WHERE id = ?',
      [branchId]
    );

    return c.json({ branch }, 201);
  } catch (error) {
    safeError('Error creating branch:', error);
    return c.json({ error: 'Failed to create branch' }, 500);
  }
});

export default branches;
