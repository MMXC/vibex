/**
 * Chat API — SSE Streaming with MiniMax
 * POST /api/chat
 * 
 * Part of: api-input-validation-layer / Epic E2
 * Uses chatMessageSchema for prompt injection protection
 */

import { NextRequest } from 'next/server';
import { validateBody } from '@/lib/next-validation';
import { chatMessageSchema } from '@/schemas/security';
import jwt from 'jsonwebtoken';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

// MiniMax API configuration
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_BASE = process.env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'abab6.5s-chat';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function* streamFromMiniMax(messages: ChatMessage[], conversationId: string): AsyncGenerator<string> {
  const url = `${MINIMAX_API_BASE}/text/chatcompletion_v2`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
  };

  const body = JSON.stringify({
    model: MINIMAX_MODEL,
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

/**
 * POST handler with Zod validation
 * The validateBody wrapper handles:
 * - JSON parsing with error handling
 * - Schema validation with prompt injection detection
 * - Standardized error responses
 */
// Auth helper
function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { auth: null, error: 'Unauthorized: authentication required' };
  }
  const token = authHeader.substring(7);
  try {
    const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
    return { auth, error: null };
  } catch {
    return { auth: null, error: 'Invalid or expired token' };
  }
}

export const POST = validateBody(chatMessageSchema, async (body, req: NextRequest) => {
  // E1: Authentication check
  const { auth, error } = checkAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error, code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, conversationId, history } = body;

  // Build messages for API
  const messages: ChatMessage[] = [
    { role: 'user', content: message },
  ];

  // Create a new conversation ID if not provided
  const convId = conversationId || `conv_${Date.now()}`;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Send conversation ID first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`));

        // Stream from MiniMax
        for await (const chunk of streamFromMiniMax(messages, convId)) {
          controller.enqueue(encoder.encode(chunk));
        }

        // Send done signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'ok',
    message: 'Chat API is running. Use POST with { message: "your message" }'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}