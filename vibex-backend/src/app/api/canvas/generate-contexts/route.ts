/**
 * POST /api/canvas/generate-contexts
 * 生成限界上下文树
 *
 * Epic 1: S1.1
 *
 * 输入: { requirementText: string, projectId?: string }
 * 输出: { success: boolean, contexts: BoundedContext[], sessionId: string, confidence: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/services/ai-service';
import { getLocalEnv as getCloudflareEnv } from '@/lib/env';
import { generateId } from '@/lib/db';

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

const USER_PROMPT = `分析以下需求，提取限界上下文（Bounded Contexts）。

需求：{requirementText}

要求：
- 每个上下文有明确的业务边界，不重叠
- 类型: core(核心域)/supporting(支撑域)/generic(通用域)/external(外部系统)
- 用 DDD 通用语言命名
- 返回 JSON 数组，每个元素包含 name, description, type

JSON 数组格式示例：
[
  {"name": "患者管理", "description": "管理患者注册、档案和认证", "type": "core"},
  {"name": "预约管理", "description": "处理预约、排班和取消逻辑", "type": "core"}
]`;

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

    const prompt = USER_PROMPT.replace('{requirementText}', requirementText);

    const result = await aiService.generateJSON<BoundedContextResponse[]>(prompt, undefined, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        { success: false, contexts: [] as BoundedContextResponse[], generationId: sessionId, confidence: 0, error: '未能提取到有效的限界上下文，请重试或补充需求描述' },
        { status: 200 }
      );
    }

    const validTypes = ['core', 'supporting', 'generic', 'external'] as const;
    const contexts: BoundedContextResponse[] = result.data.map((ctx) => ({
      id: generateId(),
      name: ctx.name || '未命名上下文',
      description: ctx.description || '',
      type: validTypes.includes(ctx.type as typeof validTypes[number])
        ? (ctx.type as typeof validTypes[number])
        : ('core' as const),
      ubiquitousLanguage: [],
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
