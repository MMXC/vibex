import { Hono } from 'hono';
/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { getAuthUserFromHono } from '@/lib/auth';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const conversations = new Hono<{ Bindings: Env }>();

interface ConversationRow {
  id: string;
  userId: string;
  messages: string;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  messages: Array<{
    role: string;
    content: string;
    createdAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Helper to parse messages JSON
function parseMessages(messagesJson: string): Conversation['messages'] {
  try {
    return JSON.parse(messagesJson);
  } catch {
    return [];
  }
}

// Helper to stringify messages
function stringifyMessages(messages: Conversation['messages']): string {
  return JSON.stringify(messages);
}

// GET /api/conversations - List conversations (filter by userId)
conversations.get('/', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const userId = c.req.query('userId');
    const env = c.env;

    // Only allow users to see their own conversations
    const targetUserId = userId || auth.userId;
    if (targetUserId !== auth.userId) {
      return c.json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }

    const conversationsList = await queryDB<ConversationRow>(
      env,
      'SELECT * FROM Conversation WHERE userId = ? ORDER BY updatedAt DESC',
      [targetUserId]
    );

    // Parse messages JSON for each conversation
    const result = conversationsList.map((conv) => ({
      id: conv.id,
      userId: conv.userId,
      messages: parseMessages(conv.messages),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return c.json({ conversations: result });
  } catch (error) {
    safeError('Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// POST /api/conversations - Create a new conversation
conversations.post('/', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const body = await c.req.json();
    const { userId, messages } = body;

    // Use authenticated user's ID if not provided
    const targetUserId = userId || auth.userId;

    // Only allow creating conversations for yourself
    if (targetUserId !== auth.userId) {
      return c.json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }

    const env = c.env;
    const conversationId = generateId();
    const now = new Date().toISOString();

    const messagesData = messages || [];
    const messagesJson = stringifyMessages(messagesData);

    await executeDB(
      env,
      'INSERT INTO Conversation (id, userId, messages, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [conversationId, targetUserId, messagesJson, now, now]
    );

    const conversation = await queryOne<ConversationRow>(
      env,
      'SELECT * FROM Conversation WHERE id = ?',
      [conversationId]
    );

    if (!conversation) {
      return c.json({ error: 'Failed to create conversation' }, 500);
    }

    return c.json(
      {
        conversation: {
          id: conversation.id,
          userId: conversation.userId,
          messages: parseMessages(conversation.messages),
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      },
      201
    );
  } catch (error) {
    safeError('Error creating conversation:', error);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

// GET /api/conversations/:id - Get a single conversation
conversations.get('/:id', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const id = c.req.param('id');
    const env = c.env;

    const conversation = await queryOne<ConversationRow>(
      env,
      'SELECT * FROM Conversation WHERE id = ?',
      [id]
    );

    if (!conversation) {
      return c.json({ success: false, error: 'Conversation not found', code: 'NOT_FOUND' }, 404);
    }

    // Only allow users to get their own conversations
    if (conversation.userId !== auth.userId) {
      return c.json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }

    return c.json({
      success: true,
      conversation: {
        id: conversation.id,
        userId: conversation.userId,
        messages: parseMessages(conversation.messages),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    safeError('Error fetching conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

// PUT /api/conversations/:id - Update a conversation (add messages)
conversations.put('/:id', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const id = c.req.param('id');
    const env = c.env;

    const existing = await queryOne<ConversationRow>(
      env,
      'SELECT * FROM Conversation WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ success: false, error: 'Conversation not found', code: 'NOT_FOUND' }, 404);
    }

    // Only allow users to update their own conversations
    if (existing.userId !== auth.userId) {
      return c.json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }

    const body = await c.req.json();
    const { messages } = body;

    const now = new Date().toISOString();

    if (messages !== undefined) {
      const messagesJson = stringifyMessages(messages);

      await executeDB(
        env,
        'UPDATE Conversation SET messages = ?, updatedAt = ? WHERE id = ?',
        [messagesJson, now, id]
      );
    }

    const updated = await queryOne<ConversationRow>(
      env,
      'SELECT * FROM Conversation WHERE id = ?',
      [id]
    );

    return c.json({
      success: true,
      conversation: {
        id: updated!.id,
        userId: updated!.userId,
        messages: parseMessages(updated!.messages),
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      },
    });
  } catch (error) {
    safeError('Error updating conversation:', error);
    return c.json({ error: 'Failed to update conversation' }, 500);
  }
});

// DELETE /api/conversations/:id - Delete a conversation
conversations.delete('/:id', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const id = c.req.param('id');
    const env = c.env;

    const existing = await queryOne<ConversationRow>(
      env,
      'SELECT * FROM Conversation WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({ success: false, error: 'Conversation not found', code: 'NOT_FOUND' }, 404);
    }

    // Only allow users to delete their own conversations
    if (existing.userId !== auth.userId) {
      return c.json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }

    await executeDB(env, 'DELETE FROM Conversation WHERE id = ?', [id]);

    return c.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    safeError('Error deleting conversation:', error);
    return c.json({ error: 'Failed to delete conversation' }, 500);
  }
});

export default conversations;
