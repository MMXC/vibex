/**
 * AI Generate API — SSE Streaming Endpoint
 * POST /api/ai/generate
 *
 * E2: AI Agent 流式响应界面（SSE）
 * Part of: Sprint43 — AI SSE Streaming
 *
 * Supports both streaming (text/event-stream) and non-streaming (application/json)
 * responses. Client signals streaming intent via Accept: text/event-stream header
 * or stream query param.
 *
 * Backend uses MiniMax API for text generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { debug } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// MiniMax API configuration — mirrors /api/v1/chat
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_BASE = process.env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'abab6.5s-chat';

interface GenerateBody {
  message: string;
  stream?: boolean;
  conversationId?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Stream chunks from MiniMax API, yielding SSE-formatted strings.
 */
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
      signal,
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
            yield `data: ${JSON.stringify({ done: true, conversationId })}\n\n`;
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
 * Non-streaming response — collect full completion.
 */
async function nonStreamingResponse(messages: ChatMessage[], conversationId: string): Promise<NextResponse> {
  const url = `${MINIMAX_API_BASE}/text/chatcompletion_v2`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
  };

  const body = JSON.stringify({
    model: MINIMAX_MODEL,
    messages,
    stream: false,
    temperature: 0.7,
  });

  try {
    const response = await fetch(url, { method: 'POST', headers, body });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `MiniMax API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';

    return NextResponse.json({ content, conversationId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Auth check
  const { success, user } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json(
      { error: 'Unauthorized: authentication required', code: 'AUTH_ERROR' },
      { status: 401 }
    );
  }

  // Parse request body
  let body: GenerateBody;
  try {
    body = await request.json() as GenerateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message, conversationId } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'message is required and must be non-empty' }, { status: 400 });
  }

  if (message.length > 10000) {
    return NextResponse.json({ error: 'message exceeds 10000 character limit' }, { status: 400 });
  }

  // Determine streaming mode: check Accept header OR stream query param
  const acceptHeader = request.headers.get('accept') || '';
  const isStreaming = acceptHeader.includes('text/event-stream') || body.stream === true;

  const messages: ChatMessage[] = [{ role: 'user', content: message }];
  const convId = conversationId || `conv_${Date.now()}`;

  // Non-streaming response
  if (!isStreaming) {
    return nonStreamingResponse(messages, convId);
  }

  // Streaming SSE response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // 30s timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        debug('[AI/Generate SSE] Timeout — aborting stream');
        abortController.abort();
      }, 30_000);

      // Forward client disconnect
      request.signal.addEventListener('abort', () => {
        debug('[AI/Generate SSE] Client disconnected');
        clearTimeout(timeoutId);
        abortController.abort();
        try { controller.close(); } catch {}
      });

      try {
        // Send conversation ID
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ conversationId: convId, status: 'started' })}\n\n`)
        );

        // Stream chunks from MiniMax
        for await (const chunk of streamFromMiniMax(messages, convId, abortController.signal)) {
          if (abortController.signal.aborted) break;
          controller.enqueue(encoder.encode(chunk));
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`)
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
        );
      } finally {
        clearTimeout(timeoutId);
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
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/ai/generate',
    usage: 'POST with { message: string, stream?: boolean, conversationId?: string }',
    accepts: 'Accept: text/event-stream for streaming mode',
  });
}
