import { Hono } from 'hono';
/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

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

// ============================================
// Collection Routes (prototype-versions)
// ============================================

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
    safeError('Error fetching prototype versions:', error);
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
    safeError('Error creating prototype version:', error);
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
    safeError('Error fetching latest prototype version:', error);
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

    // Generate detailed comparison
    const comparison = generateVersionComparison(version1, version2);

    return c.json({
      version1,
      version2,
      comparison,
    });
  } catch (error) {
    safeError('Error comparing prototype versions:', error);
    return c.json({ error: 'Failed to compare prototype versions' }, 500);
  }
});

// GET /api/prototype-versions/:id - Get version by ID
prototypeVersions.get('/:id', async (c) => {
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
    safeError('Error fetching prototype version:', error);
    return c.json({ error: 'Failed to fetch prototype version' }, 500);
  }
});

// PUT /api/prototype-versions/:id - Update version
prototypeVersions.put('/:id', async (c) => {
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
    safeError('Error updating prototype version:', error);
    return c.json({ error: 'Failed to update prototype version' }, 500);
  }
});

// DELETE /api/prototype-versions/:id - Delete version
prototypeVersions.delete('/:id', async (c) => {
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
    safeError('Error deleting prototype version:', error);
    return c.json({ error: 'Failed to delete prototype version' }, 500);
  }
});

// POST /api/prototype-versions/:id/rollback - Rollback to a specific version
// This updates the latest version's content to match the target version
prototypeVersions.post('/:id/rollback', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { createdBy } = body;
    const env = c.env;

    // Get the version to rollback to
    const targetVersion = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [id]
    );

    if (!targetVersion) {
      return c.json({ error: 'Prototype version not found' }, 404);
    }

    // Get the latest version for this project/branch
    let latestSql = 'SELECT * FROM PrototypeVersion WHERE projectId = ?';
    const latestParams: string[] = [targetVersion.projectId];

    if (targetVersion.branchId) {
      latestSql += ' AND branchId = ?';
      latestParams.push(targetVersion.branchId);
    }
    latestSql += ' ORDER BY version DESC LIMIT 1';

    const latestVersion = await queryOne<PrototypeVersionRow>(env, latestSql, latestParams);

    if (!latestVersion) {
      return c.json({ error: 'No latest version found' }, 404);
    }

    // If the target version is the same as the latest, just return it
    if (latestVersion.id === id) {
      return c.json({ 
        prototypeVersion: latestVersion,
        message: 'Already at this version'
      });
    }

    // Update the latest version's content to match the target version
    const now = new Date().toISOString();
    await executeDB(
      env,
      `UPDATE PrototypeVersion SET 
        content = ?, 
        name = ?, 
        description = ?,
        updatedAt = ? 
      WHERE id = ?`,
      [
        targetVersion.content,
        `Rolled back to v${targetVersion.version}`,
        targetVersion.description,
        now,
        latestVersion.id
      ]
    );

    const rolledBackVersion = await queryOne<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE id = ?',
      [latestVersion.id]
    );

    return c.json({ 
      prototypeVersion: rolledBackVersion,
      rollback: {
        fromVersion: latestVersion.version,
        toVersion: targetVersion.version,
        targetVersionId: id,
      }
    });
  } catch (error) {
    safeError('Error rolling back prototype version:', error);
    return c.json({ error: 'Failed to rollback prototype version' }, 500);
  }
});

// POST /api/prototype-versions/:id/restore - Restore to this version (creates a new version)
prototypeVersions.post('/:id/restore', async (c) => {
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
    safeError('Error restoring prototype version:', error);
    return c.json({ error: 'Failed to restore prototype version' }, 500);
  }
});

// POST /api/prototype-versions/:id/duplicate - Duplicate a version as a new version
prototypeVersions.post('/:id/duplicate', async (c) => {
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
    safeError('Error duplicating prototype version:', error);
    return c.json({ error: 'Failed to duplicate prototype version' }, 500);
  }
});

// ============================================
// Helper Functions
// ============================================

/**
 * Generate detailed comparison between two versions
 */
function generateVersionComparison(v1: PrototypeVersionRow, v2: PrototypeVersionRow) {
  const comparison: {
    versionDiff: number;
    sameContent: boolean;
    contentLengthDiff: number;
    contentChanges: {
      type: 'added' | 'removed' | 'modified';
      section?: string;
      description: string;
    }[];
    metadataChanges: {
      field: string;
      oldValue: string | number | null;
      newValue: string | number | null;
    }[];
  } = {
    versionDiff: v2.version - v1.version,
    sameContent: v1.content === v2.content,
    contentLengthDiff: (v2.content?.length || 0) - (v1.content?.length || 0),
    contentChanges: [],
    metadataChanges: [],
  };

  // Check metadata changes
  if (v1.name !== v2.name) {
    comparison.metadataChanges.push({
      field: 'name',
      oldValue: v1.name,
      newValue: v2.name,
    });
  }
  if (v1.description !== v2.description) {
    comparison.metadataChanges.push({
      field: 'description',
      oldValue: v1.description,
      newValue: v2.description,
    });
  }

  // Basic content change detection (JSON content)
  if (v1.content !== v2.content) {
    try {
      const content1 = JSON.parse(v1.content || '{}');
      const content2 = JSON.parse(v2.content || '{}');
      
      // Check for added/removed/modified sections
      const allKeys = new Set([...Object.keys(content1), ...Object.keys(content2)]);
      
      for (const key of allKeys) {
        if (!(key in content1)) {
          comparison.contentChanges.push({
            type: 'added',
            section: key,
            description: `Section "${key}" was added`,
          });
        } else if (!(key in content2)) {
          comparison.contentChanges.push({
            type: 'removed',
            section: key,
            description: `Section "${key}" was removed`,
          });
        } else if (JSON.stringify(content1[key]) !== JSON.stringify(content2[key])) {
          comparison.contentChanges.push({
            type: 'modified',
            section: key,
            description: `Section "${key}" was modified`,
          });
        }
      }
    } catch {
      // If not valid JSON, just note that content changed
      comparison.contentChanges.push({
        type: 'modified',
        description: 'Content was modified (non-JSON or complex JSON)',
      });
    }
  }

  return comparison;
}

export default prototypeVersions;
