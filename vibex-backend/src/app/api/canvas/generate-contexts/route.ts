/**
 * POST /api/canvas/generate-contexts
 * 生成限界上下文树
 *
 * Epic 2: S2.1 — 使用统一 prompt 模块
 *
 * 输入: { requirementText: string, projectId?: string }
 * 输出: { success: boolean, contexts: BoundedContext[], sessionId: string, confidence: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/services/ai-service';
import { getLocalEnv as getCloudflareEnv } from '@/lib/env';
import { generateId } from '@/lib/db';
import { buildBoundedContextsPrompt } from '@/lib/prompts/bounded-contexts';
import { filterInvalidContexts } from '@/lib/bounded-contexts-filter';

interface BoundedContextResponse {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  ubiquitousLanguage: string[];
  confidence: number;
}

interface GenerateContextsOutput {
  success: boolean;
  contexts: BoundedContextResponse[];
  generationId: string;
  confidence: number;
  error?: string;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<GenerateContextsOutput>> {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.requirementText !== 'string' || !body.requirementText.trim()) {
      return NextResponse.json(
        { success: false, contexts: [] as BoundedContextResponse[], generationId: '', confidence: 0, error: 'requirementText 不能为空' },
        { status: 400 }
      );
    }

    const { requirementText, projectId } = body as {
      requirementText: string;
      projectId?: string;
    };

    const env = getCloudflareEnv();
    const aiService = createAIService(env);
    const sessionId = generateId();

    const prompt = buildBoundedContextsPrompt(requirementText);

    const result = await aiService.generateJSON<BoundedContextResponse[]>(prompt, undefined, {
      temperature: 0.3,
      maxTokens: 3072,
    });

    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        { success: false, contexts: [] as BoundedContextResponse[], generationId: sessionId, confidence: 0, error: '未能提取到有效的限界上下文，请重试或补充需求描述' },
        { status: 200 }
      );
    }

    // Apply post-processing filter before returning
    const rawContexts = result.data.filter(ctx => typeof ctx.name === 'string');
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

    return NextResponse.json({ success: true, contexts, generationId: sessionId, confidence });
  } catch (err) {
    console.error('[canvas/generate-contexts] Error:', err);
    return NextResponse.json(
      { success: false, contexts: [] as BoundedContextResponse[], generationId: '', confidence: 0, error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
