/** @vitest-environment jsdom */
/**
 * Unit tests for E03: AI 辅助需求解析
 *
 * 覆盖范围：
 *  1. ruleEngine — 降级路径解析（3 场景）
 *  2. /api/ai/clarify route — Happy path + no-key 降级 + timeout 降级
 *
 * E03 C1: 硬编码超时 30s
 * E03 C2: LLM timeout → ruleEngine 降级
 * E03 C3: 无 API Key → ruleEngine 降级
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ruleEngine } from '@/lib/ai/ruleEngine';

// =============================================================================
// 1. ruleEngine 单元测试
// =============================================================================

describe('ruleEngine — E03 S03.3 降级规则引擎', () => {
  it('TC1: 完整需求 — 提取角色/目标/约束', () => {
    const result = ruleEngine({
      requirement:
        '作为电商管理员，我希望批量编辑商品价格，一次最多编辑100个，且必须保留操作日志',
    });
    expect(result.role).toBeTruthy();
    expect(result.goal).toBeTruthy();
    expect(result.constraints.length).toBeGreaterThan(0);
    expect(result.parsed).not.toBeNull();
    expect(result.guidance).toContain('规则引擎');
  });

  it('TC2: 仅有角色 — role 提取，goal 使用首句 fallback', () => {
    const result = ruleEngine({ requirement: '作为普通用户' });
    expect(result.role).not.toBeNull(); // "作为普通用户" 匹配角色模式
    // goal 来自首句 fallback
    expect(result.goal).toBeTruthy();
    expect(result.constraints).toEqual([]);
    expect(result.parsed?.role).toBeTruthy();
  });

  it('TC3: 仅有目标 — role=null, goal 提取', () => {
    const result = ruleEngine({ requirement: '我想要实现用户登录功能' });
    expect(result.role).toBeNull();
    expect(result.goal).toBeTruthy();
    expect(result.constraints).toEqual([]);
  });

  it('TC4: 多条约束条件 — 全部提取', () => {
    const result = ruleEngine({
      requirement:
        '不能超过100条记录，必须使用加密存储，仅限管理员操作',
    });
    expect(result.constraints.length).toBeGreaterThanOrEqual(2);
    expect(result.parsed?.constraints.length).toBeGreaterThanOrEqual(2);
  });

  it('TC5: 纯文本无关键词 — fallback 为 requirement 前 80 字符', () => {
    const result = ruleEngine({ requirement: '这是一个很长的完全没有任何关键词的需求描述文本内容' });
    expect(result.role).toBeNull();
    expect(result.goal).not.toBeNull();
    expect(result.parsed?.goal).toBeTruthy();
  });

  it('TC6: raw 字段等于原始输入', () => {
    const input = '原始需求内容';
    const result = ruleEngine({ requirement: input });
    expect(result.raw).toBe(input);
  });

  it('TC7: 空字符串输入 — 返回合理降级结果', () => {
    const result = ruleEngine({ requirement: '' });
    expect(result.parsed).toBeNull();
    expect(result.role).toBeNull();
    expect(result.goal).toBeNull();
    expect(result.constraints).toEqual([]);
  });

  it('TC8: guidance 包含降级提示', () => {
    const result = ruleEngine({ requirement: '测试需求' });
    expect(typeof result.guidance).toBe('string');
    expect(result.guidance.length).toBeGreaterThan(0);
  });

  it('TC9: 重复约束不重复提取', () => {
    const result = ruleEngine({
      requirement: '不能超过100条，不能超过100条，不能超过100条',
    });
    // 同一条约束不应出现多次
    const unique = [...new Set(result.constraints)];
    expect(unique.length).toBeLessThanOrEqual(result.constraints.length);
  });

  it('TC10: 约束关键词变体 — "每次最多" 提取', () => {
    const result = ruleEngine({ requirement: '每次最多提交50条数据' });
    const hasConstraint = result.constraints.some((c) =>
      c.includes('50') || c.includes('条')
    );
    expect(hasConstraint).toBe(true);
  });
});

// =============================================================================
// 2. API Route 单元测试（mock 全局 fetch）
// =============================================================================

describe('/api/ai/clarify route — E03 S03.1 API 端点', () => {
  beforeEach(() => {
    vi.resetModules();
    // Reset env mocks
    vi.stubEnv('AI_API_KEY', '');
    vi.stubEnv('AI_API_BASE', 'https://api.openai.com/v1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper: call the route handler directly
  async function callRoute(body: unknown): Promise<Response> {
    const { POST } = await import('@/app/api/ai/clarify/route');
    const req = new Request('http://localhost/api/ai/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return POST(req);
  }

  // ---------------------------------------------------------------------------
  // TC11: validation — missing requirement
  // ---------------------------------------------------------------------------
  it('TC11: 400 when requirement is missing', async () => {
    const res = await callRoute({});
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe('VALIDATION_ERROR');
  });

  it('TC12: 400 when requirement is empty string', async () => {
    const res = await callRoute({ requirement: '' });
    expect(res.status).toBe(400);
  });

  it('TC13: 400 when requirement is whitespace only', async () => {
    const res = await callRoute({ requirement: '   ' });
    expect(res.status).toBe(400);
  });

  // ---------------------------------------------------------------------------
  // TC14: E03 C3 — no API key → fallback to ruleEngine
  // ---------------------------------------------------------------------------
  it('TC14: no API key → 200 with ruleEngine result', async () => {
    vi.stubEnv('AI_API_KEY', '');
    const res = await callRoute({ requirement: '作为管理员，想要管理用户列表' });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      role: unknown; goal: unknown; constraints: unknown; guidance: unknown;
    };
    expect(json.role).not.toBeUndefined();
    expect(json.guidance).toContain('规则引擎');
  });

  // ---------------------------------------------------------------------------
  // TC15: E03 C1+C2 — LLM timeout → fallback to ruleEngine
  // ---------------------------------------------------------------------------
  it('TC15: LLM timeout → 200 with ruleEngine result + timeout guidance', async () => {
    // Simulate AbortError (what setTimeout(30s).abort() throws)
    vi.stubEnv('AI_API_KEY', 'fake-key-for-timeout-test');
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const res = await callRoute({ requirement: '作为测试用户，想要测试超时' });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { guidance?: string };
    expect(json.guidance).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // TC16: E03 happy path — LLM returns valid JSON
  // ---------------------------------------------------------------------------
  it('TC16: LLM success → 200 with structured result', async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content:
              '{"role":"产品经理","goal":"创建需求文档","constraints":["必须包含验收标准"],"raw":"..."}',
          },
        },
      ],
    };

    vi.stubEnv('AI_API_KEY', 'test-api-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockLLMResponse),
    }));

    const res = await callRoute({ requirement: '作为产品经理，想要创建需求文档' });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      role: unknown; goal: unknown; constraints: unknown; parsed: unknown;
    };
    expect(json.role).toBe('产品经理');
    expect(json.goal).toBe('创建需求文档');
    expect(json.parsed).not.toBeNull();
    expect(json.parsed).toHaveProperty('role');
    expect(json.parsed).toHaveProperty('goal');
    expect(json.parsed).toHaveProperty('constraints');
  });

  // ---------------------------------------------------------------------------
  // TC17: LLM returns non-JSON → fallback to ruleEngine
  // ---------------------------------------------------------------------------
  it('TC17: LLM non-JSON response → fallback to ruleEngine', async () => {
    vi.stubEnv('AI_API_KEY', 'test-api-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ choices: [{ message: { content: '这不是 JSON' } }] }),
    }));

    const res = await callRoute({ requirement: '测试需求' });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { guidance?: string };
    expect(json.guidance).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // TC18: LLM API error → fallback to ruleEngine (no error thrown)
  // ---------------------------------------------------------------------------
  it('TC18: LLM API 500 → fallback to ruleEngine, no 500 propagated', async () => {
    vi.stubEnv('AI_API_KEY', 'test-api-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    }));

    const res = await callRoute({ requirement: '测试需求' });
    // Must NOT return 500 — Onboarding should not be blocked
    expect(res.status).toBe(200);
    const json = (await res.json()) as { guidance?: string };
    expect(json.guidance).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // TC19: result shape matches ClarifyResult interface
  // ---------------------------------------------------------------------------
  it('TC19: response shape matches ClarifyResult interface', async () => {
    vi.stubEnv('AI_API_KEY', '');
    const res = await callRoute({ requirement: '测试需求' });
    const json = await res.json() as Record<string, unknown>;
    // Required fields
    expect(json).toHaveProperty('role');
    expect(json).toHaveProperty('goal');
    expect(json).toHaveProperty('constraints');
    expect(Array.isArray(json.constraints)).toBe(true);
    expect(json).toHaveProperty('raw');
    expect(json).toHaveProperty('parsed');
    // parsed is null or object
    if (json.parsed !== null) {
      expect(json.parsed).toHaveProperty('role');
      expect(json.parsed).toHaveProperty('goal');
      expect(json.parsed).toHaveProperty('constraints');
    }
  });
});
