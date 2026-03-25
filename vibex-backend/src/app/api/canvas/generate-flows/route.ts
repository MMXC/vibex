/**
 * POST /api/canvas/generate-flows
 * 生成业务流程树
 *
 * Epic 1: S1.2
 *
 * 输入: { contexts: BoundedContext[], sessionId: string }
 * 输出: { success: boolean, flows: BusinessFlow[], confidence: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/services/ai-service';
import { getLocalEnv as getCloudflareEnv } from '@/lib/env';
import { generateId } from '@/lib/db';
import type { BoundedContext } from '@/services/context/types';

interface BusinessFlowResponse {
  id: string;
  contextId: string;
  name: string;
  description?: string;
  steps: FlowStepResponse[];
  confidence: number;
}

interface FlowStepResponse {
  id: string;
  name: string;
  actor: string;
  description?: string;
  order: number;
}

interface GenerateFlowsOutput {
  success: boolean;
  flows: BusinessFlowResponse[];
  generationId: string;
  confidence: number;
  error?: string;
}

const USER_PROMPT = `根据以下限界上下文，生成业务流程。

上下文列表：
{contexts}

要求：
- 每个上下文对应一个或多个业务流程
- 每个流程包含步骤(steps)，每步有 name(步骤名), actor(参与者), description(描述), order(顺序)
- actor 可以是：用户、系统、管理员、外部服务
- 返回 JSON 数组

JSON 格式：
[
  {
    "name": "用户注册流程",
    "contextId": "对应的上下文ID",
    "description": "流程简介",
    "steps": [
      {"name": "填写注册表单", "actor": "用户", "description": "用户输入基本信息", "order": 0},
      {"name": "验证手机号", "actor": "系统", "description": "发送验证码并验证", "order": 1}
    ]
  }
]`;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<GenerateFlowsOutput>> {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.contexts) || body.contexts.length === 0) {
      return NextResponse.json(
        { success: false, flows: [] as BusinessFlowResponse[], generationId: '', confidence: 0, error: 'contexts 不能为空' },
        { status: 400 }
      );
    }

    const { contexts, sessionId: _sessionId } = body as {
      contexts: BoundedContext[];
      sessionId?: string;
    };

    const env = getCloudflareEnv();
    const aiService = createAIService(env);

    // Build context summary for prompt
    const contextSummary = contexts
      .map((c) => `- ${c.name}: ${c.description} (类型: ${c.type})`)
      .join('\n');

    const prompt = USER_PROMPT.replace('{contexts}', contextSummary);

    const result = await aiService.generateJSON<BusinessFlowResponse[]>(prompt, undefined, {
      temperature: 0.4,
      maxTokens: 3072,
    });

    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          flows: [] as BusinessFlowResponse[],
          generationId: '',
          confidence: 0,
          error: '未能生成有效的业务流程，请重试',
        },
        { status: 200 }
      );
    }

    // Validate and normalize flows
    const generationId = generateId();
    const flows: BusinessFlowResponse[] = result.data.map((flow) => ({
      id: generateId(),
      name: flow.name || '未命名流程',
      contextId: flow.contextId || contexts[0]?.id || '',
      description: flow.description || '',
      steps: (flow.steps || []).map((step, idx) => ({
        id: generateId(),
        name: step.name || `步骤 ${idx + 1}`,
        actor: step.actor || '用户',
        description: step.description || '',
        order: typeof step.order === 'number' ? step.order : idx,
      })),
      confidence: flow.confidence ?? 0.7,
    }));

    const confidence = result.usage
      ? Math.max(0.5, Math.min(0.9, 1 - (result.usage.completionTokens / 4096)))
      : 0.6;

    console.log(
      `[canvas/generate-flows] Generated ${flows.length} flows for ${contexts.length} contexts`
    );

    return NextResponse.json({ success: true, flows, generationId, confidence });
  } catch (err) {
    console.error('[canvas/generate-flows] Error:', err);
    return NextResponse.json(
      { success: false, flows: [] as BusinessFlowResponse[], generationId: '', confidence: 0, error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
