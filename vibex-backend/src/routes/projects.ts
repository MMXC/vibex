import { Hono } from 'hono';
/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { withValidation, ValidatedContext } from '@/lib/api-validation';
import { createProjectSchema, updateProjectSchema } from '@/schemas/project';

import { safeError } from '@/lib/log-sanitizer';

const projects = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  status: string;
  version: number;
  isTemplate: boolean;
  parentDraftId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/projects - List active projects OR get project snapshot
projects.get('/', async (c) => {
  try {
    const userId = c.req.query('userId');
    const include = c.req.query('include');
    const projectId = c.req.query('id');
    const version = c.req.query('version');
    const env = c.env;

    // Snapshot mode: GET /api/projects?id=&include=snapshot
    if (include === 'snapshot' && projectId) {
      const { getProjectSnapshot } = await import('./project-snapshot');
      const result = await getProjectSnapshot(env, projectId, version ? parseInt(version) : undefined);
      if (!result.success) {
        const status = result.code === 'NOT_FOUND' ? 404 : result.code === 'FORBIDDEN' ? 403 : 500;
        return c.json({ success: false, error: result.error, code: result.code }, status);
      }
      return c.json({ success: true, data: result.data });
    }

    // List mode: GET /api/projects or GET /api/projects?userId=
    let sql = 'SELECT * FROM Project WHERE deletedAt IS NULL';
    const params: string[] = [];

    if (userId) {
      sql += ' AND userId = ?';
      params.push(userId);
    }
    sql += ' ORDER BY createdAt DESC';

    const projectsList = await queryDB<ProjectRow>(env, sql, params);

    return c.json({ projects: projectsList });
  } catch (error) {
    safeError('Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// GET /api/projects/trash - Get soft-deleted projects (recycle bin)
projects.get('/trash', async (c) => {
  try {
    const userId = c.req.query('userId');
    const env = c.env;

    let sql = 'SELECT * FROM Project WHERE deletedAt IS NOT NULL';
    const params: string[] = [];

    if (userId) {
      sql += ' AND userId = ?';
      params.push(userId);
    }
    sql += ' ORDER BY deletedAt DESC';

    const projectsList = await queryDB<ProjectRow>(env, sql, params);

    return c.json({ projects: projectsList });
  } catch (error) {
    safeError('Error fetching trash:', error);
    return c.json({ error: 'Failed to fetch trash' }, 500);
  }
});

// POST /api/projects - Create a new project with initial StepState
projects.post('/',
  withValidation({ body: createProjectSchema }, async (c: ValidatedContext) => {
    try {
      const { name, description, userId } = c.validatedData.body as { name: string; description?: string; userId: string };
      const env = c.env;
      const projectId = generateId();
      const stepStateId = generateId();
      const now = new Date().toISOString();

      // Check D1 availability
      if (!env?.DB) {
        return c.json({ error: 'Database unavailable' }, 503);
      }

      // Insert Project with default status 'draft' and version 1
      await executeDB(
        env,
        `INSERT INTO Project (id, name, description, userId, status, version, isTemplate, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, 'draft', 1, false, ?, ?)`,
        [projectId, name, description || null, userId, now, now]
      );

      // Create initial StepState row for the project
      await executeDB(
        env,
        `INSERT INTO StepState (id, projectId, currentStep, version, step1Data, step2Data, step3Data, lastModifiedBy, createdAt, updatedAt)
         VALUES (?, ?, 1, 1, NULL, NULL, NULL, ?, ?, ?)`,
        [stepStateId, projectId, userId, now, now]
      );

      const project = await queryOne<ProjectRow>(
        env,
        'SELECT * FROM Project WHERE id = ?',
        [projectId]
      );

      return c.json({ project }, 201);
    } catch (error) {
      safeError('Error creating project:', error);
      return c.json({ error: 'Failed to create project' }, 500);
    }
  })
);

// PUT /api/projects/:id - Update project with optimistic locking
projects.put('/:id',
  withValidation({ body: updateProjectSchema }, async (c: ValidatedContext) => {
    try {
      const projectId = c.req.param('id');
      const { name, description, status, version } = c.validatedData.body as {
        name?: string;
        description?: string;
        status?: 'draft' | 'active' | 'converted' | 'archived';
        version?: number;
      };
      const env = c.env;

      // Check D1 availability
      if (!env?.DB) {
        return c.json({ error: 'Database unavailable' }, 503);
      }

      // Optimistic locking: check version matches
      const existing = await queryOne<ProjectRow>(
        env,
        'SELECT * FROM Project WHERE id = ? AND deletedAt IS NULL',
        [projectId]
      );

      if (!existing) {
        return c.json({ error: 'Project not found' }, 404);
      }

      if (version !== undefined && existing.version !== version) {
        return c.json({ 
          error: 'Version conflict - project has been modified',
          code: 'VERSION_CONFLICT',
          currentVersion: existing.version 
        }, 409);
      }

      // Build dynamic update query
      const updates: string[] = [];
      const params: unknown[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      if (updates.length === 0) {
        return c.json({ error: 'No fields to update' }, 400);
      }

      // Increment version on update
      updates.push('version = version + 1');
      updates.push('updatedAt = ?');

      const now = new Date().toISOString();
      params.push(now);
      params.push(projectId);

      await executeDB(
        env,
        `UPDATE Project SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const updated = await queryOne<ProjectRow>(
        env,
        'SELECT * FROM Project WHERE id = ?',
        [projectId]
      );

      return c.json({ project: updated });
    } catch (error) {
      safeError('Error updating project:', error);
      return c.json({ error: 'Failed to update project' }, 500);
    }
  })
);

// DELETE /api/projects/:id - Soft delete (move to trash)
projects.delete('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const env = c.env;

    // Check D1 availability
    if (!env?.DB) {
      return c.json({ error: 'Database unavailable' }, 503);
    }

    // Check project exists
    const existing = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ? AND deletedAt IS NULL',
      [projectId]
    );

    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Soft delete: set deletedAt timestamp
    const now = new Date().toISOString();
    await executeDB(
      env,
      'UPDATE Project SET deletedAt = ?, updatedAt = ? WHERE id = ?',
      [now, now, projectId]
    );

    return c.json({ success: true, message: 'Project moved to trash' });
  } catch (error) {
    safeError('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

export default projects;