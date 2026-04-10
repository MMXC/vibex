/**
 * AI UI Generation API Route (Next.js)
 * 
 * Provides endpoints for generating UI code from natural language descriptions.
 * This is the Next.js API route handler for local development.
 * 
 * @module app/api/ai-ui-generation/route
 */

import { NextRequest, NextResponse } from 'next/server';

import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';


// E-P0-3: API v0 deprecation header (per architecture.md ADR-003)
const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

// MiniMax API configuration
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_BASE = process.env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'abab6.5s-chat';

export const dynamic = 'force-dynamic';

// ==================== Types ====================

interface UIGenerationRequest {
  description: string;
  projectId?: string;
  pageId?: string;
  framework?: 'react' | 'vue' | 'html' | 'svelte' | 'angular';
  uiLibrary?: 'shadcn' | 'mui' | 'antd' | 'bootstrap' | 'tailwind' | 'none';
  designStyle?: 'modern' | 'classic' | 'minimal' | 'creative';
  componentType?: 'page' | 'component' | 'layout' | 'form' | 'card' | 'navigation';
  context?: {
    existingComponents?: string[];
    designTokens?: Record<string, string>;
    colorScheme?: string;
  };
  save?: boolean;
}

interface UIGenerationResponse {
  code: string;
  componentName: string;
  framework: string;
  uiLibrary: string;
  language: string;
  dependencies?: string[];
  usageExample?: string;
  explanations?: string[];
}

// ==================== System Prompt ====================

const UI_GENERATION_SYSTEM_PROMPT = `You are VibeX AI UI Generator, an expert UI code generator that transforms natural language descriptions into clean, functional UI code.

Your role:
- Generate high-quality UI code from text descriptions
- Follow best practices for each framework
- Create accessible, responsive components
- Use modern CSS and design patterns
- Provide complete, runnable code examples

Supported Frameworks:
- React (with hooks, TypeScript preferred)
- Vue 3 (Composition API)
- HTML5 + CSS3
- Svelte
- Angular

Supported UI Libraries:
- Shadcn UI (React)
- Material UI (MUI)
- Ant Design (AntD)
- Bootstrap 5
- Tailwind CSS
- Plain CSS (none)

Guidelines:
- Always generate complete, functional code
- Include proper TypeScript types when applicable
- Use responsive design patterns
- Follow accessibility guidelines (WCAG)
- Include inline styles or CSS classes as needed
- Add comments for complex logic
- Provide usage examples

When generating:
1. Create a clear component structure
2. Use semantic HTML elements
3. Include necessary imports and dependencies
4. Add responsive breakpoints
5. Consider dark/light mode if applicable
6. Include proper state management hooks`;

// ==================== Helper Functions ====================

function buildGenerationPrompt(request: UIGenerationRequest): string {
  const { description, framework = 'react', uiLibrary = 'tailwind', designStyle = 'modern', componentType = 'component' } = request;
  
  let prompt = `Generate a ${componentType} in ${framework} using ${uiLibrary} with a ${designStyle} design style.\n\n`;
  prompt += `Description: ${description}\n\n`;
  
  if (request.context?.existingComponents && request.context.existingComponents.length > 0) {
    prompt += `Existing Components: ${request.context.existingComponents.join(', ')}\n\n`;
  }
  
  if (request.context?.colorScheme) {
    prompt += `Color Scheme: ${request.context.colorScheme}\n\n`;
  }
  
  prompt += `Please provide:
1. The complete component code
2. Any necessary dependencies to install
3. A brief usage example
4. Brief explanation of key parts

Format your response as JSON with the following structure:
{
  "code": "...",
  "componentName": "...",
  "dependencies": ["..."],
  "usageExample": "...",
  "explanations": ["..."]
}`;

  return prompt;
}

async function* streamFromMiniMax(
  messages: Array<{ role: string; content: string }>,
  conversationId: string
): AsyncGenerator<string> {
  const url = `${MINIMAX_API_BASE}/text/chatcompletion_v2`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MINIMAX_API_KEY}`,
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

function parseAIResponse(content: string): UIGenerationResponse | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        code: parsed.code || '',
        componentName: parsed.componentName || 'GeneratedComponent',
        framework: parsed.framework || 'react',
        uiLibrary: parsed.uiLibrary || 'tailwind',
        language: parsed.language || 'typescript',
        dependencies: parsed.dependencies || [],
        usageExample: parsed.usageExample || '',
        explanations: parsed.explanations || [],
      };
    }
    return null;
  } catch (error) {
    safeError('Failed to parse AI response:', error);
    return null;
  }
}

// ==================== Route Handlers ====================

// GET is a health check — no auth required
export async function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'AI UI Generation API is running. Use POST with { description: "..." }',
    endpoints: {
      POST: 'Generate UI from description (streaming)',
      'POST /generate': 'Generate UI from description (non-streaming)',
      GET: 'Health check',
    },
    supportedFrameworks: ['react', 'vue', 'html', 'svelte', 'angular'],
    supportedUILibraries: ['shadcn', 'mui', 'antd', 'bootstrap', 'tailwind', 'none'],
  }), { status: 200,
    headers: { ...V0_DEPRECATION_HEADERS,  'Content-Type': 'application/json'  } });
}

export async function POST(request: NextRequest) {
  // Auth check
  const auth = await getAuthUserFromRequest(request);
  if (!auth.success) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: V0_DEPRECATION_HEADERS }
    );
  }

  try {
    if (!MINIMAX_API_KEY) {
      return new Response(JSON.stringify({ error: 'MINIMAX_API_KEY is not configured' }), { status: 500,
        headers: { ...V0_DEPRECATION_HEADERS,  'Content-Type': 'application/json'  } });
    }

    const body = await request.json() as UIGenerationRequest;
    const { description, framework = 'react', uiLibrary = 'tailwind', designStyle = 'modern', componentType = 'component' } = body;

    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), { status: 400,
        headers: { ...V0_DEPRECATION_HEADERS,  'Content-Type': 'application/json'  } });
    }

    const conversationId = `ui_gen_${Date.now()}`;
    const prompt = buildGenerationPrompt(body);

    // Build messages for AI
    const messages = [
      { role: 'system', content: UI_GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send generation start
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId, type: 'start', framework, uiLibrary })}\n\n`)
          );

          let fullContent = '';

          // Stream from MiniMax
          for await (const chunk of streamFromMiniMax(messages, conversationId)) {
            controller.enqueue(encoder.encode(chunk));
            
            // Extract content for storage
            try {
              const chunkData = JSON.parse(chunk.slice(6));
              if (chunkData.content) {
                fullContent += chunkData.content;
              }
            } catch {
              // Skip parsing errors
            }
          }

          // Parse the response
          const response = parseAIResponse(fullContent);

          // Send parsed response
          if (response) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'result', 
                data: response, 
                conversationId 
              })}\n\n`)
            );
          } else {
            // Fallback: return raw content
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'result', 
                data: { 
                  code: fullContent,
                  componentName: 'GeneratedComponent',
                  framework,
                  uiLibrary,
                  language: 'typescript'
                }, 
                conversationId 
              })}\n\n`)
            );
          }

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`));
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

    return new Response(stream, { headers: { ...V0_DEPRECATION_HEADERS, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
       } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500,
      headers: { ...V0_DEPRECATION_HEADERS,  'Content-Type': 'application/json'  } });
  }
}
