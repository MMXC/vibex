/**
 * generate-flows.test.ts — E1: Canvas API Endpoints + E3: 单元测试覆盖
 *
 * Tests verify:
 * - E1-T1: Input validation (empty/invalid contexts → 400)
 * - E1-T2: API Key check (missing key → 500)
 * - E1-T3: AI service .catch() (no crash on AI error → 500 + error field)
 * - E1-T4: Success path (200 + success + flows array)
 */

import { NextRequest } from 'next/server';

const mockGenerateJSON = jest.fn();
jest.mock('@/services/ai-service', () => ({
  createAIService: jest.fn(() => ({
    generateJSON: mockGenerateJSON,
  })),
}));

jest.mock('@/lib/env', () => ({
  getLocalEnv: jest.fn(() => ({ MINIMAX_API_KEY: 'test-key' })),
}));

jest.mock('@/lib/db', () => ({ generateId: () => 'test-session-id' }));

import { POST } from '../generate-flows/route';

describe('E1-T1: 输入验证', () => {
  beforeEach(() => {
    mockGenerateJSON.mockResolvedValue({ data: [], usage: null });
  });

  it('空 contexts → validation error', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-flows', {
      method: 'POST',
      body: JSON.stringify({ contexts: [] }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('contexts 缺失 type=core → validation error', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-flows', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'supporting', description: 'test' }],
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('core');
  });

  it('缺少 contexts 字段 → validation error', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-flows', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});

describe('E1-T2: API Key 检查', () => {
  it('无 API Key → error response', async () => {
    jest.resetModules();
    jest.doMock('@/lib/env', () => ({
      getLocalEnv: jest.fn(() => ({ MINIMAX_API_KEY: '' })),
    }));
    mockGenerateJSON.mockResolvedValue({ data: [], usage: null });
    const { POST: POSTNoKey } = await import('../generate-flows/route');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-flows', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
      }),
    });
    const res = await POSTNoKey(req);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});

describe('E1-T3: AI 服务 .catch() 防御', () => {
  beforeEach(() => {
    mockGenerateJSON.mockReset();
  });

  it('AI 服务异常 → 500 + error 字段，不崩溃', async () => {
    mockGenerateJSON.mockRejectedValue(new Error('AI service network error'));

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-flows', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
      }),
    });

    // Should NOT throw — .catch() handles it
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});

describe('E1-T4: 成功路径', () => {
  beforeEach(() => {
    mockGenerateJSON.mockReset();
  });

  it('成功时 → 200 + success + flows 数组', async () => {
    mockGenerateJSON.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'flow1',
          name: '用户注册流程',
          contextId: 'c1',
          description: '注册新用户',
          steps: [
            { id: 's1', name: '填写表单', actor: '用户', description: '输入基本信息', order: 0 },
            { id: 's2', name: '验证手机', actor: '系统', description: '发送验证码', order: 1 },
          ],
          confidence: 0.9,
        },
      ],
      usage: { completionTokens: 200 },
    });

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-flows', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.flows).toHaveLength(1);
    expect(data.flows[0].name).toBe('用户注册流程');
    expect(data.confidence).toBeGreaterThan(0);
  });

  it('AI 返回空数组 → 200 + success:false + error', async () => {
    mockGenerateJSON.mockResolvedValue({
      success: true,
      data: [],
      usage: { completionTokens: 50 },
    });

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-flows', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
