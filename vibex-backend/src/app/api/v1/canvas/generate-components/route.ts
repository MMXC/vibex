/**
 * POST /api/canvas/generate-components
 * 生成组件树
 *
 * Epic 1: S1.3
 *
 * 输入: { contexts: BoundedContext[], flows: BusinessFlow[], sessionId: string }
 * 输出: { success: boolean, components: Component[], confidence: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/services/ai-service';
import { getLocalEnv } from '@/lib/env';
import { generateId } from '@/lib/db';
import type { BoundedContext } from '@/services/context/types';
import { canvasError, CanvasErrorCodes } from '../types';

interface FlowStep {
  name: string;
  actor: string;
  description?: string;
  order: number;
}

interface BusinessFlowInput {
  id?: string;
  name: string;
  contextId: string;
  steps?: FlowStep[];
}

interface ComponentApi {
  method: 'GET' | 'POST';
  path: string;
  params: string[];
}

interface ComponentResponse {
  id: string;
  name: string;
  flowId: string;
  contextId: string;
  type: 'page' | 'form' | 'list' | 'detail' | 'modal';
  description?: string;
  apis: ComponentApi[];
  confidence: number;
}

type SuccessResponse = {
  success: true;
  components: ComponentResponse[];
  generationId: string;
  totalCount: number;
  confidence: number;
};

type ErrorResponse = {
  success: false;
  components: ComponentResponse[];
  generationId: string;
  totalCount: number;
  confidence: number;
  error: string;
  code?: string;
  details?: unknown;
};

type ApiResponse = SuccessResponse | ErrorResponse;

const USER_PROMPT = `根据以下业务流程和上下文，生成 UI 组件列表。

上下文列表（必须使用 id 字段）：
{contexts}

流程列表（按顺序编号为 flow-1, flow-2, ...）：
{flows}

要求：
- 每个流程生成 2-5 个组件，覆盖主要用户操作
- 组件类型（仅限以下五种，禁止使用其他类型如 navigation/card/button/header）：page(页面)/form(表单)/list(列表)/detail(详情)/modal(弹窗)
- 每个组件的 flowId 必须是对应流程编号（flow-1、flow-2 等）
- 每个组件的 contextId 必须是上下文 id 字段（ctx-xxx 格式）
- apis 必须基于用户操作推断合理 API（GET 查列表、POST 创建设施、PUT 更新等）
- 入口页面组件通常是 list 或 form 类型

严格 JSON 数组格式输出：
[
  {"name": "课程列表页", "flowId": "flow-1", "contextId": "ctx-cmnku0yelrffpxlax", "type": "list", "apis": [{"method": "GET", "path": "/api/courses", "params": []}]},
  {"name": "创建课程表单", "flowId": "flow-1", "contextId": "ctx-cmnku0yelrffpxlax", "type": "form", "apis": [{"method": "POST", "path": "/api/courses", "params": ["title", "description"]}]}
]`;

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const generationId = generateId();

  try {
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.contexts) || !Array.isArray(body.flows)) {
      return NextResponse.json(
        { ...canvasError('contexts 和 flows 不能为空', CanvasErrorCodes.INVALID_INPUT), components: [] as ComponentResponse[], generationId, totalCount: 0, confidence: 0 },
        { status: 400 }
      );
    }

    if (body.contexts.length === 0) {
      return NextResponse.json(
        { ...canvasError('contexts 不能为空', CanvasErrorCodes.INVALID_INPUT), components: [] as ComponentResponse[], generationId, totalCount: 0, confidence: 0 },
        { status: 400 }
      );
    }

    if (body.flows.length === 0) {
      return NextResponse.json(
        { ...canvasError('flows 不能为空', CanvasErrorCodes.INVALID_INPUT), components: [] as ComponentResponse[], generationId, totalCount: 0, confidence: 0 },
        { status: 400 }
      );
    }

    const { contexts, flows } = body as {
      contexts: BoundedContext[];
      flows: BusinessFlowInput[];
      sessionId?: string;
    };

    const env = getLocalEnv();
    const aiService = createAIService(env);

    // Build context and flow summary for prompt
    const contextSummary = contexts
      .map((c) => `- [${c.id}] ${c.name}: ${c.description}`)
      .join('\n');

    const flowSummary = flows
      .map(
        (f, idx) =>
          `- [flow-${idx + 1}] ${f.name} (上下文ID: ${f.contextId})\n  步骤: ${(f.steps || [])
            .map((s) => s.name)
            .join(' → ')}`
      )
      .join('\n');

    const prompt = USER_PROMPT
      .replace('{flows}', flowSummary)
      .replace('{contexts}', contextSummary);

    const result = await aiService
      .generateJSON<ComponentResponse[]>(prompt, undefined, {
        temperature: 0.3,
        maxTokens: 4096,
      })
      .catch((err) => {
        console.error('[canvas/generate-components] AI service error:', err);
        return { data: null, usage: null, error: err instanceof Error ? err.message : 'AI service error' };
      });

    if (result.error || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        {
          ...canvasError(
            (result.error as string) || '未能生成有效的组件列表，请重试',
            result.error ? CanvasErrorCodes.AI_ERROR : CanvasErrorCodes.EMPTY_RESPONSE
          ),
          components: [] as ComponentResponse[],
          generationId,
          totalCount: 0,
          confidence: 0,
        },
        { status: result.error ? 500 : 200 }
      );
    }

    const validTypes = ['page', 'form', 'list', 'detail', 'modal'] as const;

    // Truncate to max 20 components
    const rawComponents = result.data.slice(0, 20);

    const components: ComponentResponse[] = rawComponents.map((comp) => ({
      id: generateId(),
      name: comp.name || '未命名组件',
      flowId: comp.flowId || flows[0]?.id || '',
      contextId: contexts[0]?.id || '',
      type: validTypes.includes(comp.type as typeof validTypes[number])
        ? (comp.type as typeof validTypes[number])
        : ('page' as const),
      description: comp.description || '',
      apis: comp.apis
        ? comp.apis.map((a) => ({
            method: (a.method as 'GET' | 'POST') || 'GET',
            path: a.path || '/api/',
            params: a.params || [],
          }))
        : [{ method: 'GET' as const, path: '/api/', params: [] }],
      confidence: comp.confidence ?? 0.7,
    }));

    const confidence = result.usage
      ? Math.max(0.5, Math.min(0.9, 1 - (result.usage.completionTokens / 4096)))
      : 0.6;

    console.log(
      `[canvas/generate-components] Generated ${components.length} components for ${flows.length} flows`
    );

    return NextResponse.json({ success: true, components, generationId, totalCount: components.length, confidence });
  } catch (err) {
    console.error('[canvas/generate-components] Error:', err);
    return NextResponse.json(
      { ...canvasError('服务器内部错误，请稍后重试', CanvasErrorCodes.INTERNAL_ERROR), components: [] as ComponentResponse[], generationId, totalCount: 0, confidence: 0 },
      { status: 500 }
    );
  }
}
