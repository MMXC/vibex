/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { getAuthUserFromHono } from '@/lib/auth';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const prototypeChat = new Hono<{ Bindings: Env }>();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

interface ConversationRow {
  id: string;
  userId: string;
  prototypeId?: string;
  messages: string;
  createdAt: string;
  updatedAt: string;
}

// Helper to parse messages JSON
function parseMessages(messagesJson: string): ChatMessage[] {
  try {
    return JSON.parse(messagesJson);
  } catch {
    return [];
  }
}

// Helper to stringify messages
function stringifyMessages(messages: ChatMessage[]): string {
  return JSON.stringify(messages);
}

// Stream from MiniMax API
async function* streamFromMiniMax(
  apiKey: string,
  apiBase: string,
  model: string,
  messages: ChatMessage[],
  conversationId: string
): AsyncGenerator<string> {
  const url = `${apiBase}/text/chatcompletion_v2`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const body = JSON.stringify({
    model: model,
    messages: messages,
    stream: true,
    temperature: 0.7,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield `data: ${JSON.stringify({ error: `MiniMax API error: ${response.status} - ${errorText}` })}\n\n`;
      return;
    }

    if (!response.body) {
      yield `data: ${JSON.stringify({ error: 'No response body from MiniMax API' })}\n\n`;
      return;
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            yield `data: ${JSON.stringify({ done: true })}\n\n`;
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              const content = parsed.choices[0].delta.content;
              yield `data: ${JSON.stringify({ content, conversationId })}\n\n`;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    yield `data: ${JSON.stringify({ error: `Stream error: ${errorMessage}` })}\n\n`;
  }
}

// GET /api/prototype/chat - Health check and list conversations
prototypeChat.get('/', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const env = c.env;
    const prototypeId = c.req.query('prototypeId');

    let query = 'SELECT * FROM Conversation WHERE userId = ?';
    const params: unknown[] = [auth.userId];

    if (prototypeId) {
      query += ' AND prototypeId = ?';
      params.push(prototypeId);
    }

    query += ' ORDER BY updatedAt DESC';

    const conversations = await queryDB<ConversationRow>(env, query, params);

    const result = conversations.map((conv) => ({
      id: conv.id,
      userId: conv.userId,
      prototypeId: conv.prototypeId,
      messages: parseMessages(conv.messages),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return c.json({ conversations: result });
  } catch (error) {
    safeError('Error fetching prototype conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// POST /api/prototype/chat - Create new chat or send message
prototypeChat.post('/', async (c) => {
  try {
    const auth = getAuthUserFromHono(c);
    if (!auth) {
      return c.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        401
      );
    }

    const env = c.env;
    const apiKey = env.MINIMAX_API_KEY;
    const apiBase = env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
    const model = env.MINIMAX_MODEL || 'abab6.5s-chat';

    if (!apiKey) {
      return c.json({ error: 'MINIMAX_API_KEY is not configured' }, 500);
    }

    const body = await c.req.json();
    const { message, conversationId, prototypeId, clearContext } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    let convId = conversationId;
    let messages: ChatMessage[] = [];

    // Get existing conversation if provided
    if (convId) {
      const existing = await queryOne<ConversationRow>(
        env,
        'SELECT * FROM Conversation WHERE id = ? AND userId = ?',
        [convId, auth.userId]
      );

      if (existing) {
        messages = parseMessages(existing.messages);
      }
    }

    // Clear context if requested
    if (clearContext) {
      messages = [];
      convId = undefined;
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    messages.push(userMessage);

    // Create new conversation if needed
    if (!convId) {
      convId = generateId();
      const now = new Date().toISOString();

      await executeDB(
        env,
        'INSERT INTO Conversation (id, userId, prototypeId, messages, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [convId, auth.userId, prototypeId || null, stringifyMessages(messages), now, now]
      );
    } else {
      // Update existing conversation
      const now = new Date().toISOString();
      await executeDB(
        env,
        'UPDATE Conversation SET messages = ?, updatedAt = ? WHERE id = ?',
        [stringifyMessages(messages), now, convId]
      );
    }

    // Build messages for API (limit to last 20 messages for context window)
    const apiMessages = messages.slice(-20);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let assistantContent = '';

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: convId, type: 'start' })}\n\n`)
          );

          for await (const chunk of streamFromMiniMax(apiKey, apiBase, model, apiMessages, convId)) {
            controller.enqueue(encoder.encode(chunk));

            // Extract content for saving
            try {
              const data = JSON.parse(chunk.slice(6).trim());
              if (data.content) {
                assistantContent += data.content;
              }
            } catch {
              // Skip parsing errors
            }
          }

          // Save assistant message to conversation
          if (assistantContent) {
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: assistantContent,
              createdAt: new Date().toISOString(),
            };
            messages.push(assistantMessage);

            const now = new Date().toISOString();
            await executeDB(
              env,
              'UPDATE Conversation SET messages = ?, updatedAt = ? WHERE id = ?',
              [stringifyMessages(messages), now, convId]
            );
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    safeError('Error in prototype chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

// GET /api/prototype/chat/:id - Get conversation by ID
prototypeChat.get('/:id', async (c) => {
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
        prototypeId: conversation.prototypeId,
        messages: parseMessages(conversation.messages),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    safeError('Error fetching prototype conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

// DELETE /api/prototype/chat/:id - Delete conversation
prototypeChat.delete('/:id', async (c) => {
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
    safeError('Error deleting prototype conversation:', error);
    return c.json({ error: 'Failed to delete conversation' }, 500);
  }
});

export default prototypeChat;
