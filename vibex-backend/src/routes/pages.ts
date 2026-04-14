/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const pages = new Hono<{ Bindings: Env }>();

interface PageRow {
  id: string;
  name: string;
  content: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/pages - List pages by project
pages.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const env = c.env;

    let sql = 'SELECT * FROM Page';
    const params: string[] = [];

    if (projectId) {
      sql += ' WHERE projectId = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY createdAt DESC';

    const pagesList = await queryDB<PageRow>(env, sql, params);

    return c.json({ pages: pagesList });
  } catch (error) {
    safeError('Error fetching pages:', error);
    return         c.json(apiError('Failed to fetch pages', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// POST /api/pages - Create a new page
pages.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, content, projectId } = body;

    if (!name || !projectId) {
      return         c.json(apiError('Missing required fields: name, projectId', ERROR_CODES.BAD_REQUEST), 400);
    }

    const env = c.env;
    const pageId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO Page (id, name, content, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [pageId, name, content || null, projectId, now, now]
    );

    const page = await queryOne<PageRow>(
      env,
      'SELECT * FROM Page WHERE id = ?',
      [pageId]
    );

    return c.json({ page }, 201);
  } catch (error) {
    safeError('Error creating page:', error);
    return         c.json(apiError('Failed to create page', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default pages;