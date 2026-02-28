import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

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
      return c.json({ error: 'projectId is required' }, 400);
    }

    const env = c.env;
    const messagesList = await queryDB<MessageRow>(
      env,
      'SELECT * FROM Message WHERE projectId = ? ORDER BY createdAt ASC',
      [projectId]
    );

    return c.json({ messages: messagesList });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// POST /api/messages - Create a new message
messages.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { role, content, projectId } = body;

    if (!role || !content || !projectId) {
      return c.json({ error: 'Missing required fields: role, content, projectId' }, 400);
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
    console.error('Error creating message:', error);
    return c.json({ error: 'Failed to create message' }, 500);
  }
});

export default messages;