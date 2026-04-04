/**
 * generate-components.test.ts — E1: Canvas API Endpoints + E3: 单元测试覆盖
 *
 * Tests verify:
 * - E1-T1: Input validation (empty/invalid contexts or flows → 400)
 * - E1-T2: API Key check (missing key → 500)
 * - E1-T3: AI service .catch() (no crash on AI error → 500 + error field)
 * - E1-T4: Success path (200 + success + components array)
 */

const mockGenerateJSON = jest.fn();

beforeAll(() => {
  jest.doMock('@/services/ai-service', () => ({
    createAIService: jest.fn(() => ({
      generateJSON: mockGenerateJSON,
    })),
  }));
});

beforeEach(() => {
  mockGenerateJSON.mockReset();
  jest.resetModules();
});

describe('E1-T1: 输入验证', () => {
  it('空 contexts → 400', async () => {
    const { POST } = await import('../generate-components/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({ contexts: [], flows: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('contexts');
  });

  it('空 flows → 400', async () => {
    const { POST } = await import('../generate-components/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('缺少 contexts 字段 → 400', async () => {
    const { POST } = await import('../generate-components/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({ flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});

describe('E1-T2: API Key 检查', () => {
  it('无 API Key → 500', async () => {
    jest.resetModules();
    jest.doMock('@/lib/env', () => ({
      getLocalEnv: jest.fn(() => ({ MINIMAX_API_KEY: '' })),
    }));
    jest.doMock('@/services/ai-service', () => ({
      createAIService: jest.fn(() => ({
        generateJSON: mockGenerateJSON,
      })),
    }));
    const { POST } = await import('../generate-components/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});

describe('E1-T3: AI 服务 .catch() 防御', () => {
  it('AI 服务异常 → 500 + error 字段，不崩溃', async () => {
    mockGenerateJSON.mockRejectedValue(new Error('AI service network error'));

    const { POST } = await import('../generate-components/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }],
      }),
    });

    // Should NOT throw — .catch() handles it
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('AI service network error');
  });
});

describe('E1-T4: 成功路径', () => {
  it('成功时 → 200 + success + components 数组', async () => {
    mockGenerateJSON.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'comp1',
          name: '注册表单',
          flowId: 'f1',
          contextId: 'c1',
          type: 'form',
          description: '用户注册表单',
          apis: [{ method: 'POST', path: '/api/register', params: ['username', 'password'] }],
          confidence: 0.85,
        },
        {
          id: 'comp2',
          name: '用户列表页',
          flowId: 'f1',
          contextId: 'c1',
          type: 'page',
          description: '展示用户列表',
          apis: [{ method: 'GET', path: '/api/users', params: [] }],
          confidence: 0.9,
        },
      ],
      usage: { completionTokens: 300 },
    });

    const { POST } = await import('../generate-components/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.components).toHaveLength(2);
    expect(data.components[0].name).toBe('注册表单');
    expect(data.components[0].type).toBe('form');
    expect(data.totalCount).toBe(2);
    expect(data.confidence).toBeGreaterThan(0);
  });

  it('AI 返回空数组 → 200 + success:false + error', async () => {
    mockGenerateJSON.mockResolvedValue({
      success: true,
      data: [],
      usage: { completionTokens: 50 },
    });

    const { POST } = await import('../generate-components/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
