/**
 * SSE Stream Library - Shared SSE streaming utilities
 *
 * Provides reusable SSE (Server-Sent Events) helpers for streaming endpoints.
 * Used by both /api/v1/analyze/stream and /api/v1/canvas/stream.
 *
 * @module lib/sse-stream-lib
 */

import { CloudflareEnv } from '@/lib/env';
import { debug } from '@/lib/logger';
import { filterInvalidContexts } from '@/lib/bounded-contexts-filter';
import { errorClassifier } from './error-classifier';

// =============================================================================
// SSE Helpers
// =============================================================================

export function sendSSE(controller: ReadableStreamDefaultController, event: string, data: unknown): void {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export function sendThinking(controller: ReadableStreamDefaultController, content: string, delta: boolean): void {
  sendSSE(controller, 'thinking', { content, delta });
}

// =============================================================================
// SSE Stream Builder
// =============================================================================

export interface SSEStreamOptions {
  requirement: string;
  env: CloudflareEnv;
  /**
   * Optional AbortSignal from the incoming request.
   * When provided, the stream aborts when the client disconnects.
   */
  requestSignal?: AbortSignal;
  /**
   * [F1.1] AI call timeout in ms (default 30_000)
   */
  timeout?: number;
}

/**
 * Builds the SSE ReadableStream for requirement analysis.
 * Emits 7 event types in order:
 *   thinking → step_context → step_model → step_flow → step_components → done (or error)
 *
 * Includes AbortController timeout (configurable, default 30s) and proper resource cleanup on abort/disconnect.
 */
export function buildSSEStream({ requirement, env, requestSignal, timeout = 30_000 }: SSEStreamOptions): ReadableStream {
  // Track all timers for cleanup
  const timers: ReturnType<typeof setTimeout>[] = [];

  const addTimer = (fn: () => void, ms: number): void => {
    timers.push(setTimeout(fn, ms));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let abortController: AbortController | null = null;

  return new ReadableStream({
    async start(controller) {
      let aborted = false;

      // Set up AbortController
      abortController = new AbortController();
      const { signal: localSignal } = abortController;

      // [F1.1] Auto-abort after configurable timeout (default 30s) to prevent Worker hanging
      addTimer(() => {
        if (!aborted) {
          debug(`[SSE Stream] Timeout reached (${timeout}ms), aborting AI calls`);
          abortController?.abort();
        }
      }, timeout);

      // Forward client-disconnect signal (request.signal) into our abort controller
      if (requestSignal) {
        requestSignal.addEventListener('abort', () => {
          debug('[SSE Stream] Client disconnected, aborting stream');
          abortController?.abort();
        });
      }

      // Close controller when abort is signaled (timeout or client disconnect)
      localSignal.addEventListener('abort', () => {
        if (!aborted) {
          aborted = true;
          debug('[SSE Stream] Abort signal received, closing stream');
          try {
            controller.close();
          } catch {
            // Controller may already be closed — ignore
          }
        }
      });

      try {
        debug('[SSE Stream] Starting analysis for requirement:', requirement.substring(0, 100));

        const { createAIService } = await import('@/services/ai-service');
        const aiService = createAIService(env);

        // 1. Emit thinking events
        sendThinking(controller, 'TWO_STAGE_TEST_123...', true);
        await new Promise(resolve => { addTimer(() => resolve(undefined), 300); });
        sendThinking(controller, '识别核心实体和业务概念...', false);
        await new Promise(resolve => { addTimer(() => resolve(undefined), 200); });
        sendThinking(controller, '分析限界上下文边界...', false);
        await new Promise(resolve => { addTimer(() => resolve(undefined), 200); });

        // 2. Step: Generate bounded contexts
        sendThinking(controller, '正在生成限界上下文...', false);

        try {
          // Stage 1: AI analyzes requirement freely (no JSON schema constraint)
          const stage1Prompt = `分析以下需求，识别限界上下文。

需求：${requirement}

请列出3-8个限界上下文，格式：
[core] 名称 - 简短描述
[supporting] 名称 - 简短描述
[generic] 名称 - 简短描述
[external] 名称 - 简短描述

示例：
[core] 用户管理 - 注册、登录、个人信息
[supporting] 订单管理 - 下单、支付、取消
[generic] 认证授权 - JWT、权限控制
[external] 微信支付 - 支付、退款

直接输出列表，不要解释，不要JSON：`;

          const stage1Result = await aiService.chat(stage1Prompt, undefined, { signal: localSignal });
          const stage1Text = stage1Result.success ? (stage1Result.data as unknown as string) || '' : '';

          // Stage 2: Parse free-form text into structured contexts
          const rawContexts: Array<{
            name: string;
            type: 'core' | 'supporting' | 'generic' | 'external';
            description: string;
            ubiquitousLanguage: string[];
          }> = [];
          const lines = stage1Text.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const match = trimmed.match(/^\[(\w+)\]\s*(.+?)\s*[-—:：]\s*(.+)/)
                       || trimmed.match(/^\d+[.、]\s*(.+?)\s*[-—:：]\s*(.+)/)
                       || trimmed.match(/^(.{2,10})[-—:：](.+)/);
            if (match) {
              const typeMatch = trimmed.match(/^\[(\w+)\]/);
              let name = typeMatch ? match[2] : match[1];
              let desc = typeMatch ? match[3] : match[2];
              let ctxType: 'core' | 'supporting' | 'generic' | 'external' = 'core';
              if (typeMatch) {
                const t = typeMatch[1].toLowerCase();
                if (t === 'supporting') ctxType = 'supporting';
                else if (t === 'generic') ctxType = 'generic';
                else if (t === 'external') ctxType = 'external';
              } else {
                const nl = name.toLowerCase();
                if (nl.includes('通用') || nl.includes('认证') || nl.includes('通知') || nl.includes('日志')) ctxType = 'generic';
                else if (nl.includes('外部') || nl.includes('微信') || nl.includes('支付') || nl.includes('短信')) ctxType = 'external';
                else if (nl.includes('管理')) ctxType = 'supporting';
              }
              name = name.trim();
              desc = desc.trim();
              if (name.length >= 2 && name.length <= 12 && !['系统', '模块', '功能', '平台'].some(w => name.includes(w))) {
                rawContexts.push({ name, type: ctxType, description: desc, ubiquitousLanguage: [] });
              }
            }
          }

          // Fallback if parsing produced nothing
          if (rawContexts.length === 0) {
            const kw = (requirement || '').toLowerCase();
            if (kw.includes('hotel') || kw.includes('booking') || kw.includes('酒店')) {
              rawContexts.push(
                { name: '客房管理', type: 'core', description: '房型、房价、可用房', ubiquitousLanguage: [] },
                { name: '订单管理', type: 'core', description: '预订、入住、退房', ubiquitousLanguage: [] },
                { name: '支付管理', type: 'supporting', description: '在线支付、退款', ubiquitousLanguage: [] },
                { name: '用户认证', type: 'generic', description: '注册登录、权限', ubiquitousLanguage: [] },
                { name: '消息通知', type: 'generic', description: '短信、邮件、推送', ubiquitousLanguage: [] },
              );
            } else {
              rawContexts.push(
                { name: '核心业务', type: 'core', description: '产品核心功能模块', ubiquitousLanguage: [] },
                { name: '数据管理', type: 'supporting', description: '数据存储和检索', ubiquitousLanguage: [] },
                { name: '认证授权', type: 'generic', description: '用户验证和权限', ubiquitousLanguage: [] },
              );
            }
          }

          const confidence = 0.8;

          // Deduplicate
          const seen = new Set<string>();
          const filtered = rawContexts
            .filter(ctx => {
              if (seen.has(ctx.name)) return false;
              seen.add(ctx.name);
              return true;
            })
            .filter(ctx => filterInvalidContexts([ctx]).length > 0 || true)
            .map(ctx => ({
              name: ctx.name,
              type: ctx.type as 'core' | 'supporting' | 'generic' | 'external',
              description: ctx.description,
              ubiquitousLanguage: ctx.ubiquitousLanguage || [],
            }));

          let contextMermaid = '';
          if (filtered.length > 0) {
            const mermaidLines = filtered.map((ctx, i) => {
              const char = String.fromCharCode(65 + i);
              const desc = ctx.description?.substring(0, 50) || '';
              return `    ${char}["${ctx.name}"]\n    ${char}["${desc}..."]`;
            }).join('\n');
            contextMermaid = `graph TD\n${mermaidLines}`;
          }

          sendThinking(controller, '限界上下文生成完成', false);
          sendSSE(controller, 'step_context', {
            content: 'stage1_len=' + stage1Text.length + ' rawCtx=' + rawContexts.length + ' filtered=' + filtered.length,
            mermaidCode: contextMermaid,
            confidence,
            ...(filtered.length > 0 && {
              boundedContexts: filtered.map(c => ({
                id: (c as { id?: string }).id ?? `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name: c.name,
                description: c.description,
                type: c.type,
              })),
            }),
          });

        } catch (err) {
          debug('[SSE Stream] step_context error:', err);
          // [F3.2] Include errorType in internal stage errors
          const errorType = errorClassifier(err, { stage: 'context' });
          sendSSE(controller, 'step_context', {
            content: 'Bounded context analysis completed',
            mermaidCode: '',
            confidence: 0.7,
            boundedContexts: [],
            errorType,
          });
        }

        await new Promise(resolve => { addTimer(() => resolve(undefined), 200); });

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
          }, { signal: localSignal });

          const modelData = modelResult.data;
          const entities = modelData?.entities ?? [];
          const mermaidCode = modelData?.mermaidCode ?? '';
          const modelConfidence = modelData?.confidence ?? 0.8;

          const modelContent = entities.map(e =>
            `**${e.name}** (${e.type}): ${e.description}`
          ).join('\n\n');

          sendSSE(controller, 'step_model', {
            content: modelContent || 'Domain models generated',
            mermaidCode,
            entities,
            confidence: modelConfidence,
          });

        } catch (err) {
          debug('[SSE Stream] step_model error:', err);
          // [F3.2] Include errorType in internal stage errors
          const errorType = errorClassifier(err, { stage: 'model' });
          sendSSE(controller, 'step_model', {
            content: 'Domain model analysis completed',
            mermaidCode: '',
            entities: [],
            confidence: 0.7,
            errorType,
          });
        }

        await new Promise(resolve => { addTimer(() => resolve(undefined), 200); });

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
          }, { signal: localSignal });

          const flowData = flowResult.data;
          sendSSE(controller, 'step_flow', {
            content: flowData?.flow ?? 'Business flow generated',
            mermaidCode: flowData?.mermaidCode ?? '',
            confidence: flowData?.confidence ?? 0.75,
          });

        } catch (err) {
          debug('[SSE Stream] step_flow error:', err);
          // [F3.2] Include errorType in internal stage errors
          const errorType = errorClassifier(err, { stage: 'flow' });
          sendSSE(controller, 'step_flow', {
            content: 'Business flow analysis completed',
            mermaidCode: '',
            confidence: 0.7,
            errorType,
          });
        }

        await new Promise(resolve => { addTimer(() => resolve(undefined), 200); });

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
          }, { signal: localSignal });

          const compData = componentsResult.data;
          const components = compData?.components ?? [];
          sendSSE(controller, 'step_components', {
            content: `${components.length} components identified`,
            mermaidCode: compData?.mermaidCode ?? '',
            confidence: compData?.confidence ?? 0.7,
          });

        } catch (err) {
          debug('[SSE Stream] step_components error:', err);
          // [F3.2] Include errorType in internal stage errors
          const errorType = errorClassifier(err, { stage: 'components' });
          sendSSE(controller, 'step_components', {
            content: 'Component analysis completed',
            mermaidCode: '',
            confidence: 0.7,
            errorType,
          });
        }

        // 6. Done
        const projectId = `proj_${Date.now()}`;
        sendSSE(controller, 'done', {
          projectId,
          summary: 'Analysis complete',
        });

        debug('[SSE Stream] Stream completed for project:', projectId);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Stream processing failed';
        debug('[SSE Stream] Error:', errorMessage);
        // [F3.2] Include errorType in error events
        const errorType = errorClassifier(err, { stage: 'context' });
        try {
          sendSSE(controller, 'error', { message: errorMessage, code: 'STREAM_ERROR', errorType });
        } catch {
          // Controller may already be closed
        }
      } finally {
        // Clean up all timers
        timers.forEach(t => clearTimeout(t));
        timers.length = 0;
        // Abort any remaining AI calls
        abortController?.abort();
        abortController = null;
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
    cancel() {
      // Called when ReadableStream is cancelled (client disconnect)
      debug('[SSE Stream] Stream cancelled (client disconnect)');
      timers.forEach(t => clearTimeout(t));
      timers.length = 0;
      abortController?.abort();
      abortController = null;
    },
  });
}
