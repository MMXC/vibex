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
import { getLocalEnv as getCloudflareEnv } from '@/lib/env';
import type { BoundedContext } from '@/services/context/types';
import type { BusinessFlow } from '@/services/context/types';

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
  name: string;
  flowId: string;
  type: 'page' | 'form' | 'list' | 'detail' | 'modal';
  description?: string;
  api?: ComponentApi;
}

interface GenerateComponentsOutput {
  success: boolean;
  components: ComponentResponse[];
  confidence: number;
  error?: string;
}

const USER_PROMPT = `根据以下业务流程，生成 UI 组件列表。

流程列表：
{flows}

上下文列表：
{contexts}

要求：
- 每个流程对应一个或多个页面组件
- 组件类型: page(页面)/form(表单)/list(列表)/detail(详情)/modal(弹窗)
- 每个组件包含 name, flowId, type, api(method/path/params)
- 页面组件通常是用户交互入口

JSON 数组格式：
[
  {"name": "注册表单", "flowId": "对应流程ID", "type": "form", "api": {"method": "POST", "path": "/api/register", "params": ["username", "password"]}},
  {"name": "用户列表页", "flowId": "对应流程ID", "type": "page", "api": {"method": "GET", "path": "/api/users", "params": []}}
]`;

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateComponentsOutput>> {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.contexts) || !Array.isArray(body.flows)) {
      return NextResponse.json(
        { success: false, components: [], confidence: 0, error: 'contexts 和 flows 不能为空' },
        { status: 400 }
      );
    }

    const { contexts, flows } = body as {
      contexts: BoundedContext[];
      flows: BusinessFlowInput[];
      sessionId?: string;
    };

    const env = getCloudflareEnv();
    const aiService = createAIService(env);

    // Build context and flow summary for prompt
    const contextSummary = contexts
      .map((c) => `- ${c.name}: ${c.description}`)
      .join('\n');

    const flowSummary = flows
      .map(
        (f, idx) =>
          `- 流程${idx + 1}: ${f.name} (上下文ID: ${f.contextId})\n  步骤: ${(f.steps || [])
            .map((s) => s.name)
            .join(' → ')}`
      )
      .join('\n');

    const prompt = USER_PROMPT
      .replace('{flows}', flowSummary)
      .replace('{contexts}', contextSummary);

    const result = await aiService.generateJSON<ComponentResponse[]>(prompt, undefined, {
      temperature: 0.3,
      maxTokens: 4096,
    });

    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          components: [],
          confidence: 0,
          error: '未能生成有效的组件列表，请重试',
        },
        { status: 200 }
      );
    }

    const validTypes = ['page', 'form', 'list', 'detail', 'modal'] as const;
    const components: ComponentResponse[] = result.data.map((comp) => ({
      name: comp.name || '未命名组件',
      flowId: comp.flowId || flows[0]?.id || '',
      type: validTypes.includes(comp.type as typeof validTypes[number])
        ? (comp.type as typeof validTypes[number])
        : ('page' as const),
      description: comp.description || '',
      api: comp.api || { method: 'GET', path: '/api/', params: [] },
    }));

    const confidence = result.usage
      ? Math.max(0.5, Math.min(0.9, 1 - (result.usage.completionTokens / 4096)))
      : 0.6;

    console.log(
      `[canvas/generate-components] Generated ${components.length} components for ${flows.length} flows`
    );

    return NextResponse.json({ success: true, components, confidence });
  } catch (err) {
    console.error('[canvas/generate-components] Error:', err);
    return NextResponse.json(
      { success: false, components: [], confidence: 0, error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
