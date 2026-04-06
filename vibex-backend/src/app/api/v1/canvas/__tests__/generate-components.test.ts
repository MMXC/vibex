/**
 * generate-components.test.ts — E1: Canvas API Endpoints + E3: 单元测试覆盖
 *
 * Tests verify:
 * - E1-T1: Input validation (empty/invalid contexts or flows → 400)
 * - E1-T2: API Key check (missing key → 500)
 * - E1-T3: AI service .catch() (no crash on AI error → 500 + error field)
 * - E1-T4: Success path (200 + success + components array)
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

import { POST } from '../generate-components/route';

import { authHeader } from '@/lib/__tests__/testAuth';
describe('E1-T1: 输入验证', () => {
  beforeEach(() => {
    mockGenerateJSON.mockResolvedValue({ data: [], usage: null });
  });

  it('空 contexts → validation error', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', { headers: authHeader() }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('空 flows → validation error', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [],
      }),
      headers: authHeader(),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('缺少 contexts 字段 → validation error', async () => {
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({ flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }] }),
      headers: authHeader(),
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
    const { POST: POSTNoKey } = await import('../generate-components/route');
    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }],
      }),
      headers: authHeader(),
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

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }],
      }),
      headers: authHeader(),
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

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }],
      }),
      headers: authHeader(),
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

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'c1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'f1', name: 'Test Flow', contextId: 'c1' }],
      }),
      headers: authHeader(),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });


  it('AI 返回 flowId 为真实 ID 时保留（flow.id 在 prompt 中可用）', async () => {
    mockGenerateJSON.mockResolvedValue({
      success: true,
      data: [
        {
          name: '课程列表页',
          flowId: 'flow-real-id-123',
          contextId: 'ctx-1',
          type: 'list',
          apis: [{ method: 'GET', path: '/api/courses', params: [] }],
          confidence: 0.85,
        },
      ],
      usage: { completionTokens: 100 },
    });

    const req = new NextRequest('http://localhost/api/v1/canvas/generate-components', {
      method: 'POST',
      body: JSON.stringify({
        contexts: [{ id: 'ctx-1', name: 'Test', type: 'core', description: 'test' }],
        flows: [{ id: 'flow-real-id-123', name: 'Test Flow', contextId: 'ctx-1' }],
      }),
      headers: authHeader(),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.components[0].flowId).toBe('flow-real-id-123');
  });

});