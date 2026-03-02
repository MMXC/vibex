import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

const prototypeVersions = new Hono<{ Bindings: Env }>();

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

// GET /api/prototype-versions - List versions by project
prototypeVersions.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const branchId = c.req.query('branchId');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const env = c.env;

    let sql = 'SELECT * FROM PrototypeVersion';
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (projectId) {
      conditions.push('projectId = ?');
      params.push(projectId);
    }

    if (branchId) {
      conditions.push('branchId = ?');
      params.push(branchId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY version DESC';

    // Add pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const versions = await queryDB<PrototypeVersionRow>(env, sql, params);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM PrototypeVersion';
    const countParams: string[] = [];
    if (projectId || branchId) {
      countSql += ' WHERE ';
      const countConditions: string[] = [];
      if (projectId) {
        countConditions.push('projectId = ?');
        countParams.push(projectId);
      }
      if (branchId) {
        countConditions.push('branchId = ?');
        countParams.push(branchId);
      }
      countSql += countConditions.join(' AND ');
    }
    const countResult = await queryOne<{ total: number }>(env, countSql, countParams);
    const total = countResult?.total || 0;

    return c.json({
      prototypeVersions: versions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + versions.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching prototype versions:', error);
    return c.json({ error: 'Failed to fetch prototype versions' }, 500);
  }
});

// POST /api/prototype-versions - Create a new version
prototypeVersions.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, branchId, name, description, content, snapshotId, createdBy, version } = body;

    if (!projectId || !content) {
      return c.json({ error: 'Missing required fields: projectId, content' }, 400);
    }

    const env = c.env;
    const versionId = generateId();
    const now = new Date().toISOString();

    // Get the next version number for this project (and branch if provided)
    let maxVersionSql = 'SELECT MAX(version) as maxVersion FROM PrototypeVersion WHERE projectId = ?';
    const maxVersionParams: string[] = [projectId];
    
    if (branchId) {
      maxVersionSql += ' AND branchId = ?';
      maxVersionParams.push(branchId);
    }

    const existingVersions = await queryDB<{ maxVersion: number }>(
      env,
      maxVersionSql,
      maxVersionParams
    );
    const nextVersion = (existingVersions[0]?.maxVersion || 0) + 1;

    await executeDB(
      env,
      'INSERT INTO PrototypeVersion (id, projectId, branchId, version, name, description, content, snapshotId, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        versionId,
        projectId,
        branchId || null,
        version || nextVersion,
        name || null,
        description || null,
        content,
        snapshotId || null,
        createdBy || null,
        now,
        now,
      ]
    );

    const versionRecord = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [versionId]
    );

    return c.json({ prototypeVersion: versionRecord }, 201);
  } catch (error) {
    console.error('Error creating prototype version:', error);
    return c.json({ error: 'Failed to create prototype version' }, 500);
  }
});

// GET /api/prototype-versions/latest - Get latest version for a project
prototypeVersions.get('/latest', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const branchId = c.req.query('branchId');
    const env = c.env;

    if (!projectId) {
      return c.json({ error: 'Missing required query parameter: projectId' }, 400);
    }

    let sql = 'SELECT * FROM PrototypeVersion WHERE projectId = ?';
    const params: string[] = [projectId];

    if (branchId) {
      sql += ' AND branchId = ?';
      params.push(branchId);
    }
    sql += ' ORDER BY version DESC LIMIT 1';

    const versionRecord = await queryOne<PrototypeVersionRow>(env, sql, params);

    if (!versionRecord) {
      return c.json({ error: 'No version found for this project' }, 404);
    }

    return c.json({ prototypeVersion: versionRecord });
  } catch (error) {
    console.error('Error fetching latest prototype version:', error);
    return c.json({ error: 'Failed to fetch latest prototype version' }, 500);
  }
});

// GET /api/prototype-versions/compare - Compare two versions
prototypeVersions.get('/compare', async (c) => {
  try {
    const version1Id = c.req.query('version1Id');
    const version2Id = c.req.query('version2Id');
    const env = c.env;

    if (!version1Id || !version2Id) {
      return c.json({ error: 'Missing required query parameters: version1Id, version2Id' }, 400);
    }

    const version1 = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [version1Id]
    );

    const version2 = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [version2Id]
    );

    if (!version1 || !version2) {
      return c.json({ error: 'One or both versions not found' }, 404);
    }

    return c.json({
      version1,
      version2,
      comparison: {
        versionDiff: version2.version - version1.version,
        sameContent: version1.content === version2.content,
      },
    });
  } catch (error) {
    console.error('Error comparing prototype versions:', error);
    return c.json({ error: 'Failed to compare prototype versions' }, 500);
  }
});

export default prototypeVersions;
