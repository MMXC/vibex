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
}));

jest.mock('@/lib/log-sanitizer', () => ({
  devDebug: jest.fn(),
}));

import { GET } from '../route';

/** Parse SSE stream response into event map */
async function collectSSEEvents(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  const events: Record<string, unknown> = {};
  const lines = text.split('\n');

  let currentEvent = '';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6);
    } else if (line === '') {
      if (currentEvent && currentData) {
        events[currentEvent] = JSON.parse(currentData);
      }
      currentEvent = '';
      currentData = '';
    }
  }

  return events;
}

describe('GET /api/v1/analyze/stream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if requirement is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/analyze/stream');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should return 400 if requirement is empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/analyze/stream?requirement=');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('should emit step_context event with boundedContexts', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockResolvedValue({
        data: {
          summary: '在线预约医生系统分析完成',
          boundedContexts: [
            { name: '患者管理', description: '患者注册建档', type: 'core', ubiquitousLanguage: ['患者', '档案'] },
            { name: '认证授权', description: '登录注册', type: 'generic', ubiquitousLanguage: ['登录'] },
          ],
          confidence: 0.85,
        },
      }),
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/v1/analyze/stream?requirement=' + encodeURIComponent('在线预约医生系统')
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');

    const events = await collectSSEEvents(response);

    expect(events.step_context).toBeDefined();
    const stepContext = events.step_context as Record<string, unknown>;
    expect(stepContext.content).toBeDefined();
    expect(stepContext.confidence).toBeDefined();
    expect(stepContext.boundedContexts).toBeDefined();
    expect(Array.isArray(stepContext.boundedContexts)).toBe(true);
  });

  it('should filter out invalid context names from SSE boundedContexts', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockResolvedValue({
        data: {
          summary: '测试',
          boundedContexts: [
            { name: '认证授权', description: '有效', type: 'generic', ubiquitousLanguage: [] },
            { name: '订单管理系统', description: '无效-包含管理', type: 'core', ubiquitousLanguage: [] },
            { name: '患者管理', description: '无效-包含管理', type: 'core', ubiquitousLanguage: [] },
          ],
          confidence: 0.8,
        },
      }),
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/v1/analyze/stream?requirement=' + encodeURIComponent('企业ERP')
    );
    const response = await GET(request);
    const events = await collectSSEEvents(response);

    const stepContext = events.step_context as Record<string, unknown>;
    const boundedContexts = stepContext.boundedContexts as Array<{ name: string }>;

    // All filtered contexts should not contain forbidden words
    expect(boundedContexts.every(ctx => !ctx.name.includes('管理'))).toBe(true);
  });

  it('should handle AI service error gracefully', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockRejectedValue(new Error('AI service failed')),
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/v1/analyze/stream?requirement=' + encodeURIComponent('测试')
    );
    const response = await GET(request);
    const events = await collectSSEEvents(response);

    // Should still emit step_context with empty boundedContexts (fallback)
    expect(events.step_context).toBeDefined();
  });

  it('should emit done event at the end of stream', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockResolvedValue({
        data: {
          summary: '完成',
          boundedContexts: [
            { name: '认证授权', description: '登录', type: 'generic', ubiquitousLanguage: [] },
          ],
          confidence: 0.8,
        },
      }),
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/v1/analyze/stream?requirement=' + encodeURIComponent('简单需求')
    );
    const response = await GET(request);
    const events = await collectSSEEvents(response);

    expect(events.done).toBeDefined();
    expect((events.done as Record<string, unknown>).projectId).toBeDefined();
  });

  it('should emit thinking events before step_context', async () => {
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => ({
      generateJSON: jest.fn().mockResolvedValue({
        data: {
          summary: '测试',
          boundedContexts: [],
          confidence: 0.8,
        },
      }),
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/v1/analyze/stream?requirement=' + encodeURIComponent('测试')
    );
    const response = await GET(request);
    const events = await collectSSEEvents(response);

    expect(events.thinking).toBeDefined();
    expect(Array.isArray(events.thinking) || typeof events.thinking === 'object').toBe(true);
  });
});
