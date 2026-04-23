/**
 * Chat API
 * POST /api/v1/chat
 * 
 * Part of: api-input-validation-layer / Epic E2 (S2.2 Chat API Prompt Injection 防护)
 * 
 * Validates incoming messages against chatMessageSchema to prevent:
 * - Empty or missing messages
 * - Messages exceeding 10000 chars
 * - Prompt injection via suspicious keywords
 */

import { NextRequest, NextResponse } from 'next/server';
import { debug } from '@/lib/logger';
import { chatMessageSchema } from '@/schemas/security';
import { parseBody } from '@/lib/high-risk-validation';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getLocalEnv } from '@/lib/env';

// MiniMax API configuration
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_BASE = process.env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'abab6.5s-chat';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function* streamFromMiniMax(
  messages: ChatMessage[],
  conversationId: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const url = `${MINIMAX_API_BASE}/text/chatcompletion_v2`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
  };

  const body = JSON.stringify({
    model: MINIMAX_MODEL,
    messages,
    stream: true,
    temperature: 0.7,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal, // [F2.1] Forward abort signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield `data: ${JSON.stringify({
        error: `MiniMax API error: ${response.status} - ${errorText}`,
      })}\n\n`;
      return;
    }

    if (!response.body) {
      yield `data: ${JSON.stringify({
        error: 'No response body from MiniMax API',
      })}\n\n`;
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

export async function POST(request: NextRequest) {
  // E1-S4: Use consolidated auth via getAuthUserFromRequest (reads from Hono headers + JWT fallback)
  const env = getLocalEnv();
  const { success, user } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json(
      { error: 'Unauthorized: authentication required', code: 'AUTH_ERROR' },
      { status: 401 }
    );
  }
  const userId = user?.userId;
  const email = user?.email;

  // S2.2: Validate request body against security schema
  const result = await parseBody(request, chatMessageSchema);

  if ('error' in result) {
    const parsed = JSON.parse(result.error.message);
    return new Response(result.error.message, {
      status: result.error.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, conversationId, history } = result.data;

  // Build messages for API
  const messages: ChatMessage[] = [{ role: 'user', content: message }];

  // Create a new conversation ID if not provided
  const convId = conversationId || `conv_${Date.now()}`;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // [F2.1] Add 30s timeout to prevent unbounded stream
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 30_000);

      // [F2.2] Forward client disconnect signal
      request.signal.addEventListener('abort', () => {
        debug('[Chat SSE] Client disconnected, aborting stream');
        clearTimeout(timeoutId);
        abortController.abort();
        try { controller.close(); } catch {}
      });

      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`)
        );

        // [F2.1] Pass abortController.signal to MiniMax fetch
        for await (const chunk of streamFromMiniMax(messages, convId, abortController.signal)) {
          // Check if aborted mid-stream
          if (abortController.signal.aborted) break;
          controller.enqueue(encoder.encode(chunk));
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
        );
      } finally {
        // [F2.1] Cleanup timeout timer
        clearTimeout(timeoutId);
        // [F2.2] Abort any pending fetch
        abortController.abort();
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
}

export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Chat API is running. Use POST with { message: "your message" }',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
