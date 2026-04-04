/**
 * generate-contexts.test.ts — E1: 错误处理增强 + E3: 单元测试覆盖
 *
 * Tests verify:
 * - E1-T1: Input validation (empty/blank/missing requirementText → 400)
 * - E1-T2: API Key check (missing key → 500)
 * - E1-T3: AI service .catch() (no crash on AI error)
 * - E3-T1: Unit test coverage
 */
import { NextRequest } from 'next/server';

// Mock the entire module to intercept AI service calls
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

// Import after mocks are set up
import { POST } from '../generate-contexts/route';

describe('E1-T1: 输入验证', () => {
  it('空字符串 → 400', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('requirementText');
  });

  it('纯空白字符串 → 400', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '   ' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('缺少 requirementText 字段 → 400', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('E1-T2: API Key 检查', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('@/lib/env', () => ({ getLocalEnv: jest.fn(() => ({ MINIMAX_API_KEY: '' })) }));
    mockGenerateJSON.mockClear();
  });

  afterEach(() => {
    jest.resetModules();
    jest.unmock('@/lib/env');
  });

  it('无 API Key → 500', async () => {
    // Re-import to pick up new mock
    const { POST: POSTNoKey } = await import('../generate-contexts/route');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '测试需求' }),
    });
    const res = await POSTNoKey(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('API Key');
  });
});

describe('E1-T3: AI 服务 .catch() 防御', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('@/lib/env', () => ({ getLocalEnv: jest.fn(() => ({ MINIMAX_API_KEY: 'test-key' })) }));
    mockGenerateJSON.mockReset();
  });

  afterEach(() => {
    jest.resetModules();
    jest.unmock('@/lib/env');
  });

  it('AI 服务异常 → 500 + error 字段，不崩溃', async () => {
    const { POST: POSTError } = await import('../generate-contexts/route');
    mockGenerateJSON.mockRejectedValue(new Error('AI service network error'));

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '测试需求' }),
    });

    // Should NOT throw — .catch() handles it
    const res = await POSTError(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('AI service network error');
  });

  it('成功时 → 200 + success', async () => {
    const { POST: POSTSuccess } = await import('../generate-contexts/route');
    mockGenerateJSON.mockResolvedValue({
      success: true,
      data: [{ id: '1', name: '测试上下文', description: '描述', type: 'core', ubiquitousLanguage: [], confidence: 0.9 }],
      usage: { completionTokens: 100 },
    });

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '测试需求' }),
    });

    const res = await POSTSuccess(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.contexts).toHaveLength(1);
  });
});
