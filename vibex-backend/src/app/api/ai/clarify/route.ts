/**
 * POST /api/ai/clarify
 * AI 辅助需求解析
 * P003 S-P3.1
 *
 * Input: { requirement: string }
 * Output: { role, goal, constraints, raw, parsed, guidance? }
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ClarifyResult {
  /** AI 解析出的角色（如 "产品经理"、"开发者"） */
  role: string | null;
  /** 目标描述 */
  goal: string | null;
  /** 约束条件列表 */
  constraints: string[];
  /** 原始输入 */
  raw: string;
  /** AI 解析结果，失败时为 null */
  parsed: { role: string; goal: string; constraints: string[] } | null;
  /** 引导提示（降级时提供） */
  guidance?: string;
}

const AI_TIMEOUT_MS = 30_000; // 30s 超时

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as { requirement?: string };
    const requirement = body.requirement ?? '';

    if (!requirement.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'requirement is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // S-P3.4: 无 API Key，返回降级结果 + guidance
      return NextResponse.json({
        ...buildFallback(requirement),
        guidance: '请配置 OPENAI_API_KEY 以启用 AI 辅助功能',
      } satisfies ClarifyResult);
    }

    // S-P3.1: 调用 OpenAI API
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `你是一个需求分析助手。用户会输入一段需求描述，请从中提取：
1. 角色/身份（谁在使用这个系统？）
2. 目标（他们想达成什么？）
3. 约束条件（有什么限制？）

请用 JSON 格式回答：{"role":"...","goal":"...","constraints":["...","..."]}`,
            },
            {
              role: 'user',
              content: requirement,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices[0]?.message?.content ?? '';

      let parsed: ClarifyResult['parsed'] = null;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const obj = JSON.parse(jsonMatch[0]!) as { role?: string; goal?: string; constraints?: string[] };
          const role = obj.role ?? '';
          const goal = obj.goal ?? '';
          parsed = {
            role,
            goal,
            constraints: Array.isArray(obj.constraints) ? obj.constraints : [],
          };
        }
      } catch {
        // JSON 解析失败
      }

      if (!parsed) {
        throw new Error('Failed to parse AI response');
      }

      return NextResponse.json({
        role: parsed.role ?? '',
        goal: parsed.goal ?? '',
        constraints: parsed.constraints,
        raw: requirement,
        parsed,
      } satisfies ClarifyResult);
    } catch (err) {
      // S-P3.3: 超时或 AI 失败 → 降级到纯文本
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      return NextResponse.json({
        ...buildFallback(requirement),
        ...(isTimeout ? { guidance: 'AI 响应超时，已降级为手动输入模式' } : {}),
      } satisfies ClarifyResult);
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'AI 解析失败，请稍后重试' },
      { status: 500 }
    );
  }
}

function buildFallback(requirement: string): Omit<ClarifyResult, 'guidance'> {
  return {
    role: null,
    goal: requirement,
    constraints: [],
    raw: requirement,
    parsed: null,
  };
}
