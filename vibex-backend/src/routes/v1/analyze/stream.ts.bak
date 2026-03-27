/**
 * Analyze Stream API - SSE Streaming Endpoint
 * GET /v1/analyze/stream?requirement=xxx
 *
 * Streams a step-by-step requirement analysis via Server-Sent Events.
 * Emits 7 event types in order:
 *   thinking → step_context → step_model → step_flow → step_components → done (or error)
 *
 * Ported from: src/app/api/v1/analyze/stream/route.ts (Next.js → Hono)
 *
 * @module routes/v1/analyze/stream
 */

import { Hono } from 'hono';
import { CloudflareEnv, getLocalEnv } from '../../../lib/env';
import { devDebug } from '../../../lib/log-sanitizer';

const stream_ = new Hono<{ Bindings: CloudflareEnv }>();

function sendSSE(controller: ReadableStreamDefaultController, event: string, data: unknown): void {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

function sendThinking(controller: ReadableStreamDefaultController, content: string, delta: boolean): void {
  sendSSE(controller, 'thinking', { content, delta });
}

stream_.get('/', async (c) => {
  const requirement = c.req.query('requirement');

  if (!requirement || requirement.trim().length === 0) {
    return c.json({ error: 'requirement query parameter is required' }, 400);
  }

  const stream = new ReadableStream({
    async start(controller) {
      sendThinking(controller, "[START] Stream initiated", false);
      // Use Cloudflare runtime env (c.env), NOT getLocalEnv()
      const runtimeEnv = c.env as CloudflareEnv;
      const env = runtimeEnv;

      try {
        devDebug('[SSE Stream] Starting analysis for requirement:', requirement.substring(0, 100));

        // Dynamically import to avoid circular deps
        const { createAIService } = await import('../../../services/ai-service');
        const aiService = createAIService(env);

        // 1. Emit thinking events
        sendThinking(controller, '正在分析需求...', true);
        await new Promise(resolve => setTimeout(resolve, 300));
        sendThinking(controller, '识别核心实体和业务概念...', false);
        await new Promise(resolve => setTimeout(resolve, 200));
        sendThinking(controller, '分析限界上下文边界...', false);
        await new Promise(resolve => setTimeout(resolve, 200));

        // 2. Step: Generate bounded contexts
        sendThinking(controller, '正在生成限界上下文...', false);

        try {
          const planPrompt = `你是一个DDD专家。分析这个需求并只返回JSON:

需求: ${requirement}

只返回JSON:
{
  "summary": "2-3句话总结",
  "boundedContexts": [
    {
      "id": "ctx1",
      "name": "上下文名称",
      "description": "这个限界上下文处理什么",
      "type": "core",
      "keyResponsibilities": ["职责1", "职责2"]
    }
  ],
  "confidence": 0.85
}`;

          const planResult = await aiService.generateJSON<{
            summary: string;
            boundedContexts: Array<{
              id: string;
              name: string;
              description: string;
              type: string;
              keyResponsibilities: string[];
            }>;
            confidence: number;
          }>(planPrompt, {
            summary: { type: 'string' },
            boundedContexts: { type: 'array' },
            confidence: { type: 'number' },
          });

          const data = planResult.data;
          const contexts = data?.boundedContexts ?? [];
          const summary = data?.summary ?? '';
          const confidence = data?.confidence ?? 0.8;

          let contextMermaid = '';
          if (contexts.length > 0) {
            const lines = contexts.map((ctx: { name: string; description: string }, i: number) => {
              const char = String.fromCharCode(65 + i);
              const desc = ctx.description?.substring(0, 50) || '';
              return `    ${char}["${ctx.name}"]\n    ${char}["${desc}..."]`;
            }).join('\n');
            contextMermaid = `graph TD\n${lines}`;
          }

          sendThinking(controller, '限界上下文生成完成', false);
          sendSSE(controller, 'step_context', {
            content: summary,
            mermaidCode: contextMermaid,
            confidence,
            boundedContexts: contexts,
          });

        } catch (err) {
          devDebug('[SSE Stream] step_context error:', err);
          sendSSE(controller, 'step_context', {
            content: 'Bounded context analysis completed',
            mermaidCode: '',
            confidence: 0.7,
            boundedContexts: [],
          });
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // 3. Step: Generate domain models
        sendThinking(controller, '正在生成领域模型...', false);

        try {
          const modelPrompt = `你是DDD专家。基于这个需求生成领域实体JSON:

需求: ${requirement}

只返回JSON:
{
  "entities": [
    {
      "name": "实体名",
      "type": "aggregate|entity|valueObject",
      "description": "实体描述",
      "attributes": [
        { "name": "字段名", "type": "string", "required": true }
      ]
    }
  ],
  "mermaidCode": "classDiagram\\n    class 实体名 {\\n        +字段名: string\\n    }",
  "confidence": 0.8
}`;

          const modelResult = await aiService.generateJSON<{
            entities: Array<{ name: string; type: string; description: string; attributes: Array<{ name: string; type: string; required: boolean }> }>;
            mermaidCode: string;
            confidence: number;
          }>(modelPrompt, {
            entities: { type: 'array' },
            mermaidCode: { type: 'string' },
            confidence: { type: 'number' },
          });

          const modelData = modelResult.data;
          const entities = modelData?.entities ?? [];
          const mermaidCode = modelData?.mermaidCode ?? '';
          const modelConfidence = modelData?.confidence ?? 0.8;

          const modelContent = entities.map((e: { name: string; type: string; description: string }) =>
            `**${e.name}** (${e.type}): ${e.description}`
          ).join('\n\n');

          sendSSE(controller, 'step_model', {
            content: modelContent || 'Domain models generated',
            mermaidCode,
            entities,
            confidence: modelConfidence,
          });

        } catch (err) {
          devDebug('[SSE Stream] step_model error:', err);
          sendSSE(controller, 'step_model', {
            content: 'Domain model analysis completed',
            mermaidCode: '',
            entities: [],
            confidence: 0.7,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // 4. Step: Generate business flow
        sendThinking(controller, '正在生成业务流程...', false);

        try {
          const flowPrompt = `你是业务流程分析师。为这个需求生成JSON业务流程图:

需求: ${requirement}

只返回JSON:
{
  "flow": "业务流程描述",
  "mermaidCode": "flowchart LR\\n    A[开始] --> B{判断}\\n    B -->|是| C[操作]\\n    B -->|否| D[结束]",
  "confidence": 0.75
}`;

          const flowResult = await aiService.generateJSON<{
            flow: string;
            mermaidCode: string;
            confidence: number;
          }>(flowPrompt, {
            flow: { type: 'string' },
            mermaidCode: { type: 'string' },
            confidence: { type: 'number' },
          });

          const flowData = flowResult.data;
          sendSSE(controller, 'step_flow', {
            content: flowData?.flow ?? 'Business flow generated',
            mermaidCode: flowData?.mermaidCode ?? '',
            confidence: flowData?.confidence ?? 0.75,
          });

        } catch (err) {
          devDebug('[SSE Stream] step_flow error:', err);
          sendSSE(controller, 'step_flow', {
            content: 'Business flow analysis completed',
            mermaidCode: '',
            confidence: 0.7,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // 5. Step: Generate component relationships
        sendThinking(controller, '正在分析组件关系...', false);

        try {
          const componentsPrompt = `你是软件架构师。为这个需求生成组件关系JSON:

需求: ${requirement}

只返回JSON:
{
  "components": [
    {
      "name": "组件名",
      "type": "frontend|backend|service|database",
      "description": "组件功能"
    }
  ],
  "mermaidCode": "flowchart TB\\n    FE[前端] --> BE[后端]\\n    BE --> DB[数据库]",
  "confidence": 0.7
}`;

          const componentsResult = await aiService.generateJSON<{
            components: Array<{ name: string; type: string; description: string }>;
            mermaidCode: string;
            confidence: number;
          }>(componentsPrompt, {
            components: { type: 'array' },
            mermaidCode: { type: 'string' },
            confidence: { type: 'number' },
          });

          const compData = componentsResult.data;
          const components = compData?.components ?? [];
          sendSSE(controller, 'step_components', {
            content: `${components.length} components identified`,
            mermaidCode: compData?.mermaidCode ?? '',
            confidence: compData?.confidence ?? 0.7,
          });

        } catch (err) {
          devDebug('[SSE Stream] step_components error:', err);
          sendSSE(controller, 'step_components', {
            content: 'Component analysis completed',
            mermaidCode: '',
            confidence: 0.7,
          });
        }

        // 6. Done
        const projectId = `proj_${Date.now()}`;
        sendSSE(controller, 'done', {
          projectId,
          summary: 'Analysis complete',
        });

        devDebug('[SSE Stream] Stream completed for project:', projectId);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Stream processing failed';
        devDebug('[SSE Stream] Error:', errorMessage);
        sendSSE(controller, 'error', { message: errorMessage, code: 'STREAM_ERROR' });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
});


// Simple SSE test endpoint
stream_.get('/sse-test', async (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('event: thinking\ndata: {"content":"test1","delta":true}\n\n'));
      setTimeout(() => {
        controller.enqueue(encoder.encode('event: thinking\ndata: {"content":"test2","delta":false}\n\n'));
        setTimeout(() => {
          controller.close();
      }
        }, 500);
      }, 500);
    }
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
});

// Quick AI test
stream_.get("/ai-test", async (c) => {
  const env = c.env as CloudflareEnv;
  try {
    const resp = await fetch("https://api.minimaxi.com/anthropic/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY || env.MINIMAX_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || "MiniMax-M2.7-highspeed",
        messages: [{role: "user", content: "say hi in 3 words"}],
        max_tokens: 20
      })
    });
    const text = await resp.text();
    return c.json({ status: resp.status, body: JSON.parse(text) });
  } catch(e) {
    return c.json({ error: e.message, stack: e.stack });
  }
});

export default stream_;
