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
import { getLocalEnv } from '@/lib/env';
import { generateId } from '@/lib/db';
import type { BoundedContext } from '@/services/context/types';
import { validateContexts } from '@/lib/canvas-validation';
import { canvasError, CanvasErrorCodes } from '../types';

import { devLog, safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

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

type SuccessResponse = {
  success: true;
  flows: BusinessFlowResponse[];
  generationId: string;
  confidence: number;
};

type ErrorResponse = {
  success: false;
  flows: BusinessFlowResponse[];
  generationId: string;
  confidence: number;
  error: string;
  code?: string;
  details?: unknown;
};

type ApiResponse = SuccessResponse | ErrorResponse;

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

// Auth helper for canvas routes
async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized: authentication required', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const token = authHeader.substring(7);
  const jwt = await import('jsonwebtoken');
  try {
    const env = getLocalEnv();
    return getAuthUserFromRequest(req);
  } catch {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  // E1: Authentication check
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth as NextResponse<ApiResponse>;
  }

  const generationId = generateId();

  try {
    const body = await request.json().catch(() => null);

    // Epic 2: 使用 canvas-validation 中间件校验请求
    const validation = validateContexts(body?.contexts);
    if (!validation.valid) {
      return NextResponse.json(
        {
          ...canvasError(validation.issues.map((i) => i.message).join('; '), CanvasErrorCodes.VALIDATION_ERROR),
          flows: [] as BusinessFlowResponse[],
          generationId,
          confidence: 0,
        },
        { status: 400 }
      );
    }

    const contexts = body.contexts as BoundedContext[];

    const env = getLocalEnv();
    const aiService = createAIService(env);

    // Build context summary for prompt
    const contextSummary = contexts
      .map((c) => `- ${c.name}: ${c.description} (类型: ${c.type})`)
      .join('\n');

    const prompt = USER_PROMPT.replace('{contexts}', contextSummary);

    const result = await aiService
      .generateJSON<BusinessFlowResponse[]>(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 3072,
      })
      .catch((err) => {
        safeError('[canvas/generate-flows] AI service error:', err);
        return { data: null, usage: null, error: err instanceof Error ? err.message : 'AI service error' };
      });

    if (result.error || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        {
          ...canvasError(
            (result.error as string) || '未能生成有效的业务流程，请重试',
            result.error ? CanvasErrorCodes.AI_ERROR : CanvasErrorCodes.EMPTY_RESPONSE
          ),
          flows: [] as BusinessFlowResponse[],
          generationId,
          confidence: 0,
        },
        { status: result.error ? 500 : 200 }
      );
    }

    // Validate and normalize flows
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

    devLog(
      `[canvas/generate-flows] Generated ${flows.length} flows for ${contexts.length} contexts`
    );

    return NextResponse.json({ success: true, flows, generationId, confidence });
  } catch (err) {
    safeError('[canvas/generate-flows] Error:', err);
    return NextResponse.json(
      { ...canvasError('服务器内部错误，请稍后重试', CanvasErrorCodes.INTERNAL_ERROR), flows: [] as BusinessFlowResponse[], generationId, confidence: 0 },
      { status: 500 }
    );
  }
}
