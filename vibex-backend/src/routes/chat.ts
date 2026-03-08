import { Hono } from 'hono';
import { CloudflareEnv } from '../lib/env';

const chat = new Hono<{ Bindings: CloudflareEnv }>();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

// GET /api/chat - Health check
chat.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Chat API is running. Use POST with { message: "your message" }',
  });
});

// POST /api/chat - Stream chat
chat.post('/', async (c) => {
  try {
    const env = c.env;
    const apiKey = env.MINIMAX_API_KEY;
    const apiBase = env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
    const model = env.MINIMAX_MODEL || 'abab6.5s-chat';

    if (!apiKey) {
      return c.json({ error: 'MINIMAX_API_KEY is not configured' }, 500);
    }

    const body = await c.req.json();
    const { message, conversationId } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const messages: ChatMessage[] = [{ role: 'user', content: message }];
    const convId = conversationId || `conv_${Date.now()}`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`)
          );

          for await (const chunk of streamFromMiniMax(apiKey, apiBase, model, messages, convId)) {
            controller.enqueue(encoder.encode(chunk));
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

export default chat;