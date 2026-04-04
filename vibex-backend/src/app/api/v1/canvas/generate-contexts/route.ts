/**
 * POST /api/canvas/generate-contexts
 * 生成限界上下文树
 *
 * Epic 2: S2.1 — 使用统一 prompt 模块
 *
 * 输入: { requirementText: string, projectId?: string }
 * 输出: { success: boolean, contexts: BoundedContext[], generationId: string, confidence: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/services/ai-service';
import { getLocalEnv } from '@/lib/env';
import { generateId } from '@/lib/db';
import { buildBoundedContextsPrompt } from '@/lib/prompts/bounded-contexts';
import { filterInvalidContexts } from '@/lib/bounded-contexts-filter';
import { canvasError, CanvasErrorCodes } from '../types';

interface BoundedContextResponse {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  ubiquitousLanguage: string[];
  confidence: number;
}

type SuccessResponse = {
  success: true;
  contexts: BoundedContextResponse[];
  generationId: string;
  confidence: number;
};

type ErrorResponse = {
  success: false;
  contexts: BoundedContextResponse[];
  generationId: string;
  confidence: number;
  error: string;
  code?: string;
  details?: unknown;
};

type ApiResponse = SuccessResponse | ErrorResponse;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const generationId = generateId();

  try {
    const body = await request.json().catch(() => null);

    // E1-T1: 输入验证
    if (!body || typeof body.requirementText !== 'string' || !body.requirementText.trim()) {
      return NextResponse.json(
        { ...canvasError('requirementText 不能为空', CanvasErrorCodes.INVALID_INPUT), contexts: [] as BoundedContextResponse[], generationId, confidence: 0 },
        { status: 400 }
      );
    }

    const { requirementText, projectId } = body as {
      requirementText: string;
      projectId?: string;
    };

    const env = getLocalEnv();

    // E1-T2: API Key 检查
    if (!env.MINIMAX_API_KEY) {
      return NextResponse.json(
        { ...canvasError('AI 服务未配置（API Key 缺失）', CanvasErrorCodes.API_KEY_MISSING), contexts: [] as BoundedContextResponse[], generationId, confidence: 0 },
        { status: 500 }
      );
    }

    const aiService = createAIService(env);

    const prompt = buildBoundedContextsPrompt(requirementText);

    // E1-T3: AI 服务 .catch() 防御
    const result = await aiService
      .generateJSON<BoundedContextResponse[]>(prompt, undefined, {
        temperature: 0.3,
        maxTokens: 3072,
      })
      .catch((err: Error) => {
        console.error('[canvas/generate-contexts] AI service error:', err);
        return { success: false, error: err.message, data: null as BoundedContextResponse[] | null, usage: null };
      });

    if (!result.success || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
      const errorMsg = result.success === false
        ? (result as { error?: string }).error ?? 'AI 服务错误'
        : '未能提取到有效的限界上下文，请重试或补充需求描述';
      const code = result.success === false ? CanvasErrorCodes.AI_ERROR : CanvasErrorCodes.EMPTY_RESPONSE;
      return NextResponse.json(
        { ...canvasError(errorMsg, code), contexts: [] as BoundedContextResponse[], generationId, confidence: 0 },
        { status: result.success === false ? 500 : 200 }
      );
    }

    // Apply post-processing filter before returning
    const rawContexts = result.data.filter((ctx: BoundedContextResponse) => typeof ctx.name === 'string');
    const filtered = filterInvalidContexts(rawContexts);

    const validTypes = ['core', 'supporting', 'generic', 'external'] as const;
    const contexts: BoundedContextResponse[] = filtered.map((ctx) => ({
      id: generateId(),
      name: ctx.name || '未命名上下文',
      description: ctx.description || '',
      type: validTypes.includes(ctx.type as typeof validTypes[number])
        ? (ctx.type as typeof validTypes[number])
        : ('core' as const),
      ubiquitousLanguage: ctx.ubiquitousLanguage ?? [],
      confidence: 0.7,
    }));

    const confidence = result.usage
      ? Math.max(0.5, Math.min(0.95, 1 - (result.usage.completionTokens / 4096)))
      : 0.7;

    console.log(
      `[canvas/generate-contexts] Generated ${contexts.length} contexts for project ${projectId ?? 'unknown'}`
    );

    return NextResponse.json({ success: true, contexts, generationId, confidence });
  } catch (err) {
    console.error('[canvas/generate-contexts] Error:', err);
    return NextResponse.json(
      { ...canvasError('服务器内部错误，请稍后重试', CanvasErrorCodes.INTERNAL_ERROR), contexts: [] as BoundedContextResponse[], generationId, confidence: 0 },
      { status: 500 }
    );
  }
}
