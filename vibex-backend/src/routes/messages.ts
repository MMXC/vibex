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

const messages = new Hono<{ Bindings: Env }>();

interface MessageRow {
  id: string;
  role: string;
  content: string;
  projectId: string;
  createdAt: string;
}

// GET /api/messages - List messages by project (projectId required)
messages.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    
    if (!projectId) {
      return         c.json(apiError('projectId is required', ERROR_CODES.BAD_REQUEST), 400);
    }

    const env = c.env;
    const messagesList = await queryDB<MessageRow>(
      env,
      'SELECT * FROM Message WHERE projectId = ? ORDER BY createdAt ASC',
      [projectId]
    );

    return c.json({ messages: messagesList });
  } catch (error) {
    safeError('Error fetching messages:', error);
    return         c.json(apiError('Failed to fetch messages', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// POST /api/messages - Create a new message
messages.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { role, content, projectId } = body;

    if (!role || !content || !projectId) {
      return         c.json(apiError('Missing required fields: role, content, projectId', ERROR_CODES.BAD_REQUEST), 400);
    }

    const env = c.env;
    const messageId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO Message (id, role, content, projectId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [messageId, role, content, projectId, now]
    );

    const message = await queryOne<MessageRow>(
      env,
      'SELECT * FROM Message WHERE id = ?',
      [messageId]
    );

    return c.json({ message }, 201);
  } catch (error) {
    safeError('Error creating message:', error);
    return         c.json(apiError('Failed to create message', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default messages;