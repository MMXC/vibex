export const dynamic = 'force-dynamic';

/**
 * /api/ai/clarify — E03 S03.1 AI 需求澄清端点
 *
 * POST Body: { requirement: string }
 * Response: ClarifyResult
 *
 * 行为：
 *  1. 有 AI_API_KEY → 调用 LLM，返回结构化 JSON
 *  2. 无 AI_API_KEY 或超时 30s → 降级到 ruleEngine
 *
 * 约束：
 *  - 硬编码超时 30s: AbortSignal.timeout(30_000)
 *  - 降级路径不阻断 Onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { ruleEngine } from '@/lib/ai/ruleEngine';

const AI_API_BASE = process.env.AI_API_BASE ?? 'https://api.openai.com/v1';
const AI_API_KEY = process.env.AI_API_KEY ?? '';

const SYSTEM_PROMPT = `你是一个需求分析助手。用户会输入一段产品需求描述，你的任务是从中提取并结构化为：

1. **角色（role）**：目标用户或系统管理员的身份
2. **目标（goal）**：用户希望完成的核心任务或达成的主要目的
3. **约束条件（constraints）**：需求中的限制、要求或必须遵守的规则

请严格按以下 JSON 格式返回（只返回 JSON，不要额外文字）：

{
  "role": "角色描述，如果无法识别则返回 null",
  "goal": "目标描述，如果无法识别则返回 null",
  "constraints": ["约束1", "约束2"],
  "raw": "原始需求文本的完整内容"
}

示例输入："作为电商管理员，我希望能够批量编辑商品价格，一次最多编辑100个，且必须保留操作日志"
示例输出：{"role":"电商管理员","goal":"批量编辑商品价格","constraints":["一次最多编辑100个","必须保留操作日志"],"raw":"..."}`;

const USER_PROMPT_TEMPLATE = (req: string) =>
  `需求描述：\n${req}\n\n请提取角色、目标和约束条件。`;

export interface ClarifyRequest {
  requirement: string;
}

export interface ClarifyResult {
  role: string | null;
  goal: string | null;
  constraints: string[];
  raw: string;
  parsed: { role: string; goal: string; constraints: string[] } | null;
  guidance?: string;
}

async function callLLM(requirement: string): Promise<ClarifyResult> {
  const controller = new AbortController();
  // E03 C1: 硬编码 30s 超时
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${AI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT_TEMPLATE(requirement) },
        ],
        temperature: 0.3,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? '';

    // Parse LLM JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM response is not valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      role: string | null;
      goal: string | null;
      constraints: string[];
      raw?: string;
    };

    const clarified: ClarifyResult = {
      role: parsed.role ?? null,
      goal: parsed.goal ?? null,
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
      raw: parsed.raw ?? requirement,
      parsed:
        parsed.role || parsed.goal
          ? {
              role: parsed.role ?? '未知',
              goal: parsed.goal ?? requirement.slice(0, 80),
              constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
            }
          : null,
    };

    return clarified;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ClarifyRequest = await req.json();
    const { requirement } = body;

    if (!requirement || typeof requirement !== 'string' || !requirement.trim()) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'requirement 字段不能为空' } },
        { status: 400 }
      );
    }

    const trimmed = requirement.trim();

    // E03 C3: 无 API Key → 直接降级
    if (!AI_API_KEY) {
      const result = ruleEngine({ requirement: trimmed });
      return NextResponse.json(result, { status: 200 });
    }

    // E03 C2: 调用 LLM，超时 → 降级
    try {
      const result = await callLLM(trimmed);
      return NextResponse.json(result, { status: 200 });
    } catch (err) {
      const isAbort =
        err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
      if (isAbort) {
        // E03 C2: 超时 30s 降级
        const result = ruleEngine({ requirement: trimmed });
        return NextResponse.json({ ...result, guidance: '⏱️ AI 解析超时，已使用规则引擎降级。' }, { status: 200 });
      }
      // 其他错误也降级，不阻断 Onboarding
      console.error('[/api/ai/clarify] LLM error, falling back:', err);
      const result = ruleEngine({ requirement: trimmed });
      return NextResponse.json(
        { ...result, guidance: '⚠️ AI 解析失败，已使用规则引擎降级。' },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error('[/api/ai/clarify] Parse error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    );
  }
}
