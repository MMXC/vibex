/**
 * health.test.ts — E2-T1: 健康检查端点 + E3-T1: 单元测试
 */
jest.mock('@/lib/env', () => ({
  getLocalEnv: jest.fn(() => ({ MINIMAX_API_KEY: 'test-key-for-health' })),
}));

import { GET } from '../health/route';

describe('E2-T1: 健康检查端点', () => {
  it('有 API Key → 200 + healthy', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.hasApiKey).toBe(true);
    expect(data.timestamp).toBeDefined();
    expect(data.endpoints).toBeDefined();
    expect(data.endpoints['generate-contexts']).toBe('/api/v1/canvas/generate-contexts');
  });

  it('响应包含所有必需字段', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('hasApiKey');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('endpoints');
  });
});

describe('E2-T1: 无 API Key → 503 degraded', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('@/lib/env', () => ({ getLocalEnv: jest.fn(() => ({ MINIMAX_API_KEY: '' })) }));
  });

  afterEach(() => {
    jest.resetModules();
    jest.unmock('@/lib/env');
  });

  it('无 API Key → 503 + degraded', async () => {
    const { GET: GETNoKey } = await import('../health/route');
    const res = await GETNoKey();
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.status).toBe('degraded');
    expect(data.hasApiKey).toBe(false);
  });
});
