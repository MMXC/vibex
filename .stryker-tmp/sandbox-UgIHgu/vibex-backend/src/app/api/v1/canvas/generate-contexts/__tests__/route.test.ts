// @ts-nocheck
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/services/ai-service', () => ({
  createAIService: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  getLocalEnv: jest.fn(() => ({
    MINIMAX_API_KEY: 'test-key',
    MINIMAX_API_BASE: 'https://test.api',
    MINIMAX_MODEL: 'test-model',
  })),
  getCloudflareEnv: jest.fn(() => ({
    MINIMAX_API_KEY: 'test-key',
    MINIMAX_API_BASE: 'https://test.api',
    MINIMAX_MODEL: 'test-model',
  })),
}));

jest.mock('@/lib/db', () => ({
  generateId: jest.fn(() => 'test-id-123'),
}));

import { POST } from '../route';

describe('POST /api/canvas/generate-contexts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if requirementText is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('requirementText');
  });

  it('should return 400 if requirementText is empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('should return bounded contexts for valid requirement', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockResolvedValue({
        data: [
          { name: '患者管理', description: '患者注册建档', type: 'core', ubiquitousLanguage: ['患者', '档案'] },
          { name: '认证授权', description: '登录注册', type: 'generic', ubiquitousLanguage: ['登录', 'JWT'] },
        ],
        usage: { completionTokens: 200 },
      }),
    }));

    const request = new NextRequest('http://localhost:3000/api/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '在线预约医生系统' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.contexts.length).toBeGreaterThanOrEqual(1);
    expect(data.contexts[0]).toHaveProperty('id');
    expect(data.contexts[0]).toHaveProperty('name');
    expect(data.contexts[0]).toHaveProperty('type');
    expect(data.contexts[0].ubiquitousLanguage).toBeDefined();
  });

  it('should filter out invalid context names containing "管理"', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockResolvedValue({
        data: [
          { name: '患者管理', description: '有效上下文', type: 'core', ubiquitousLanguage: [] },
          { name: '认证授权', description: '有效上下文', type: 'generic', ubiquitousLanguage: [] },
          { name: '订单管理系统', description: '无效上下文，应被过滤', type: 'core', ubiquitousLanguage: [] },
        ],
        usage: { completionTokens: 200 },
      }),
    }));

    const request = new NextRequest('http://localhost:3000/api/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '企业ERP系统' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // "患者管理系统" contains "管理" → filtered, "认证授权" passes, "订单管理系统" filtered
    expect(data.contexts.every((ctx: { name: string }) => !ctx.name.includes('管理'))).toBe(true);
  });

  it('should return empty contexts when AI returns no valid data', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockResolvedValue({ data: [] }),
    }));

    const request = new NextRequest('http://localhost:3000/api/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '测试需求' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.contexts).toEqual([]);
  });

  it('should handle all 4 context types', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockResolvedValue({
        data: [
          { name: '患者档案', description: '核心域', type: 'core', ubiquitousLanguage: [] },
          { name: '订单支付', description: '支撑域', type: 'supporting', ubiquitousLanguage: [] },
          { name: '认证授权', description: '通用域', type: 'generic', ubiquitousLanguage: [] },
          { name: '微信支付', description: '外部系统', type: 'external', ubiquitousLanguage: [] },
        ],
        usage: { completionTokens: 200 },
      }),
    }));

    const request = new NextRequest('http://localhost:3000/api/canvas/generate-contexts', {
      method: 'POST',
      body: JSON.stringify({ requirementText: '在线问诊系统' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const types = data.contexts.map((c: { type: string }) => c.type);
    expect(types).toContain('core');
    expect(types).toContain('supporting');
    expect(types).toContain('generic');
    expect(types).toContain('external');
  });
});
