/**
/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
 * AI UI Generation API Routes
 * 
 * Provides endpoints for generating UI code from natural language descriptions.
 * Supports multiple frameworks, streaming responses, and component storage.
 * 
 * Features:
 * - Natural language to UI code generation
 * - Multiple framework support (React, Vue, HTML, etc.)
 * - Streaming responses for real-time feedback
 * - Component saving to database
 * - Design system integration
 * 
 * @module routes/ai-ui-generation
 */

import { Hono } from 'hono';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

const aiUIGeneration = new Hono<{ Bindings: Env }>();

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

interface GeneratedComponentRow {
  id: string;
  projectId: string;
  pageId: string | null;
  name: string;
  type: string;
  framework: string;
  uiLibrary: string;
  code: string;
  styles: string | null;
  types: string | null;
  propsInterface: string | null;
  usageExample: string | null;
  dependencies: string | null;
  config: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== System Prompts ====================

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
  apiKey: string,
  apiBase: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
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

async function saveGeneratedComponent(
  db: any,
  projectId: string,
  pageId: string | null,
  response: UIGenerationResponse,
  framework: string,
  uiLibrary: string
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();

  const insertQuery = `
    INSERT INTO generated_components (
      id, project_id, page_id, name, type, framework, ui_library,
      code, styles, types, props_interface, usage_example, dependencies,
      config, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL, ?, ?)
  `;

  try {
    await db.prepare(insertQuery).bind(
      id,
      projectId,
      pageId,
      response.componentName,
      'generated',
      framework,
      uiLibrary,
      response.code,
      response.usageExample || '',
      response.dependencies ? JSON.stringify(response.dependencies) : '[]',
      now,
      now
    ).run();
  } catch (error) {
    // Table might not exist, try to create or ignore
    safeError('Failed to save component:', error);
  }

  return id;
}

// ==================== Routes ====================

// GET /api/ai-ui-generation - Health check and info
aiUIGeneration.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'AI UI Generation API is running. Use POST with { description: "..." }',
    endpoints: {
      POST: 'Generate UI from description',
      GET: 'Health check',
    },
    supportedFrameworks: ['react', 'vue', 'html', 'svelte', 'angular'],
    supportedUILibraries: ['shadcn', 'mui', 'antd', 'bootstrap', 'tailwind', 'none'],
  });
});

// POST /api/ai-ui-generation - Generate UI code
aiUIGeneration.post('/', async (c) => {
  try {
    const env = c.env;
    const apiKey = env.MINIMAX_API_KEY;
    const apiBase = env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
    const model = env.MINIMAX_MODEL || 'abab6.5s-chat';

    if (!apiKey) {
      return c.json({ error: 'MINIMAX_API_KEY is not configured' }, 500);
    }

    const body = await c.req.json<UIGenerationRequest>();
    const { description, projectId, pageId, framework = 'react', uiLibrary = 'tailwind', designStyle = 'modern', componentType = 'component', context, save = false } = body;

    if (!description) {
      return c.json({ error: 'Description is required' }, 400);
    }

    const conversationId = `ui_gen_${Date.now()}`;
    const prompt = buildGenerationPrompt(body);

    // Build messages for AI
    const messages = [
      { role: 'system', content: UI_GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

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
          for await (const chunk of streamFromMiniMax(apiKey, apiBase, model, messages, conversationId)) {
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

          // Save to database if requested
          if (save && response && projectId && env.DB) {
            try {
              const componentId = await saveGeneratedComponent(
                env.DB,
                projectId,
                pageId || null,
                response,
                framework,
                uiLibrary
              );
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ saved: true, componentId })}\n\n`)
              );
            } catch (saveError) {
              safeError('Failed to save component:', saveError);
            }
          }

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

// POST /api/ai-ui-generation/generate - Non-streaming generation
aiUIGeneration.post('/generate', async (c) => {
  try {
    const env = c.env;
    const apiKey = env.MINIMAX_API_KEY;
    const apiBase = env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
    const model = env.MINIMAX_MODEL || 'abab6.5s-chat';

    if (!apiKey) {
      return c.json({ error: 'MINIMAX_API_KEY is not configured' }, 500);
    }

    const body = await c.req.json<UIGenerationRequest>();
    const { description, projectId, pageId, framework = 'react', uiLibrary = 'tailwind', designStyle = 'modern', componentType = 'component', context, save = false } = body;

    if (!description) {
      return c.json({ error: 'Description is required' }, 400);
    }

    const prompt = buildGenerationPrompt(body);

    // Build messages for AI
    const messages = [
      { role: 'system', content: UI_GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    // Make non-streaming request
    const url = `${apiBase}/text/chatcompletion_v2`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({ error: `MiniMax API error: ${response.status} - ${errorText}` }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the response
    const parsedResponse = parseAIResponse(content);

    if (!parsedResponse) {
      return c.json({
        code: content,
        componentName: 'GeneratedComponent',
        framework,
        uiLibrary,
        language: 'typescript',
        message: 'Raw response (parse failed)',
      });
    }

    // Save to database if requested
    if (save && parsedResponse && projectId && env.DB) {
      try {
        const componentId = await saveGeneratedComponent(
          env.DB,
          projectId,
          pageId || null,
          parsedResponse,
          framework,
          uiLibrary
        );
        return c.json({
          ...parsedResponse,
          componentId,
          saved: true,
        });
      } catch (saveError) {
        safeError('Failed to save component:', saveError);
      }
    }

    return c.json(parsedResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

// GET /api/ai-ui-generation/templates - Get common UI templates
aiUIGeneration.get('/templates', (c) => {
  const templates = [
    {
      id: 'login-form',
      name: 'Login Form',
      description: 'A modern login form with email and password fields',
      framework: 'react',
      uiLibrary: 'tailwind',
      preview: 'Email/password form with submit button',
    },
    {
      id: 'dashboard-header',
      name: 'Dashboard Header',
      description: 'A responsive dashboard header with navigation',
      framework: 'react',
      uiLibrary: 'tailwind',
      preview: 'Header with logo, nav links, and user menu',
    },
    {
      id: 'data-table',
      name: 'Data Table',
      description: 'A sortable, paginated data table component',
      framework: 'react',
      uiLibrary: 'shadcn',
      preview: 'Table with columns, sorting, and pagination',
    },
    {
      id: 'card-grid',
      name: 'Card Grid',
      description: 'A responsive grid of card components',
      framework: 'react',
      uiLibrary: 'tailwind',
      preview: 'Grid layout with card components',
    },
    {
      id: 'sidebar-nav',
      name: 'Sidebar Navigation',
      description: 'A collapsible sidebar navigation menu',
      framework: 'react',
      uiLibrary: 'tailwind',
      preview: 'Vertical sidebar with collapsible sections',
    },
    {
      id: 'modal-dialog',
      name: 'Modal Dialog',
      description: 'A reusable modal dialog component',
      framework: 'react',
      uiLibrary: 'tailwind',
      preview: 'Overlay modal with header, body, footer',
    },
  ];

  return c.json({ templates });
});

export default aiUIGeneration;
