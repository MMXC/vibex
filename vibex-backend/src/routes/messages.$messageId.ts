import { Hono } from 'hono';
import { queryOne, executeDB, Env } from '@/lib/db';

const messageId = new Hono<{ Bindings: Env }>();

interface MessageRow {
  id: string;
  role: string;
  content: string;
  projectId: string;
  createdAt: string;
}

// GET /api/messages/:messageId - Get message by ID
messageId.get('/', async (c) => {
  try {
    const id = c.req.param('messageId');
    const env = c.env;

    const message = await queryOne<MessageRow>(
      env,
      'SELECT * FROM Message WHERE id = ?',
      [id]
    );

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    return c.json({ message });
  } catch (error) {
    console.error('Error fetching message:', error);
    return c.json({ error: 'Failed to fetch message' }, 500);
  }
});

// DELETE /api/messages/:messageId - Delete message
messageId.delete('/', async (c) => {
  try {
    const id = c.req.param('messageId');
    const env = c.env;

    await executeDB(env, 'DELETE FROM Message WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

export default messageId;