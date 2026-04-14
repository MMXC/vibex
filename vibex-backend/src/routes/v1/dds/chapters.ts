/**
 * DDS Canvas Chapters API - v1 REST Routes
 * GET /api/v1/dds/chapters?projectId=xxx — list chapters for a project
 * POST /api/v1/dds/chapters?projectId=xxx&type=requirement — create a chapter
 */

import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { ERROR_CODES } from '@/lib/api-error';
import { safeError } from '@/lib/log-sanitizer';

const chapters = new Hono<{ Bindings: Env }>();

interface ChapterRow {
  id: string;
  project_id: string;
  type: string;
  created_at: string;
  updated_at: string;
}

// GET /chapters?projectId=xxx — list all chapters for a project
chapters.get('/', async (c) => {
  try {
    const env = c.env;
    const projectId = c.req.query('projectId');

    if (!projectId) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'projectId is required' } },
        422
      );
    }

    const rows = await queryDB<ChapterRow>(
      env,
      'SELECT * FROM dds_chapters WHERE project_id = ? ORDER BY created_at ASC',
      [projectId]
    );

    const data = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return c.json({ success: true, data });
  } catch (err) {
    safeError('[dds-chapters] GET list error:', err);
    return c.json(
      { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to fetch chapters' } },
      500
    );
  }
});

// POST /chapters?projectId=xxx&type=requirement — create a chapter
chapters.post('/', async (c) => {
  try {
    const env = c.env;
    const projectId = c.req.query('projectId');
    const type = c.req.query('type');

    if (!projectId || !type) {
      return c.json(
        {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'projectId and type are required' },
        },
        422
      );
    }

    const validTypes = ['requirement', 'context', 'flow'];
    if (!validTypes.includes(type)) {
      return c.json(
        {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'type must be one of: requirement, context, flow' },
        },
        422
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      `INSERT INTO dds_chapters (id, project_id, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [id, projectId, type, now, now]
    );

    const created = await queryOne<ChapterRow>(env, 'SELECT * FROM dds_chapters WHERE id = ?', [id]);

    if (!created) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to create chapter' } },
        500
      );
    }

    return c.json(
      {
        success: true,
        data: {
          id: created.id,
          projectId: created.project_id,
          type: created.type,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        },
      },
      201
    );
  } catch (err) {
    safeError('[dds-chapters] POST error:', err);
    return c.json(
      { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to create chapter' } },
      500
    );
  }
});

export default chapters;
