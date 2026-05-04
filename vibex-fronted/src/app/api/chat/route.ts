export const dynamic = 'force-dynamic';


/**
 * /api/chat — AI Chat Completions API
 * Sprint6 E1-U1: Image AI 解析端点
 *
 * Accepts chat completion requests and forwards to AI provider.
 * Supports vision (image) input via base64-encoded images.
 *
 * POST Body: ChatRequest
 * Response: ChatResponse
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<ChatContentPart>;
}

export interface ChatContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  message: { role: 'assistant'; content: string };
  done: boolean;
}

const AI_API_BASE = process.env.AI_API_BASE ?? 'https://api.openai.com/v1';
const AI_API_KEY = process.env.AI_API_KEY ?? '';

/**
 * POST /api/chat
 * Forwards chat request to AI API and returns the response.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, systemPrompt, model = 'gpt-4o', temperature = 0.7 } = body;

    // Build the messages array with optional system prompt
    const apiMessages: Array<{ role: string; content: string | Array<object> }> = [];
    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        apiMessages.push({ role: msg.role, content: msg.content });
      } else {
        // Array of content parts (with images)
        apiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const aiResponse = await fetch(`${AI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return NextResponse.json(
        { error: `AI API error: ${aiResponse.status} ${errorText}` },
        { status: aiResponse.status }
      );
    }

    const data = await aiResponse.json();
    const choice = data.choices?.[0];
    const assistantMessage = choice?.message?.content ?? '';

    return NextResponse.json({
      id: data.id ?? `chat-${Date.now()}`,
      model: data.model ?? model,
      message: { role: 'assistant', content: assistantMessage },
      done: true,
    } satisfies ChatResponse);
  } catch (err) {
    console.error('[/api/chat] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
