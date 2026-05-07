/**
 * Unit tests for E04: 模板 API 完整 CRUD
 *
 * 覆盖范围：
 *  1. GET /api/v1/templates — 列表（支持 industry 过滤）
 *  2. GET /api/v1/templates/export — 导出 JSON
 *  3. POST /api/v1/templates — 创建模板（201）
 *  4. POST /api/v1/templates/import — 导入 JSON
 *
 * E04 C4: 存储 = 内存（module-level singleton），硬删除
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn().mockReturnValue({ success: true, user: { id: 'test-user' } }),
}));

import { GET, POST } from './route';

describe('GET /api/v1/templates — E04 S04.1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC1: 返回 200 + 模板列表', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates');
    const response = await GET(request);
    const data = await response.json() as { success: boolean; data: { templates: unknown[] } };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.templates)).toBe(true);
    expect(data.data.templates.length).toBeGreaterThan(0);
  });

  it('TC2: 支持 industry 过滤参数', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates?industry=saas');
    const response = await GET(request);
    const data = await response.json() as { success: boolean; data: { templates: unknown[] } };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // All returned templates should have industry === 'saas'
    for (const t of data.data.templates as Array<{ industry: string }>) {
      expect(t.industry).toBe('saas');
    }
  });

  it('TC3: 返回 data.total 字段', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates');
    const response = await GET(request);
    const data = await response.json() as { success: boolean; data: { total: number } };

    expect(response.status).toBe(200);
    expect(typeof data.data.total).toBe('number');
    expect(data.data.total).toBe(data.data.templates.length);
  });

  it('TC4: 每个模板包含必要字段', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates');
    const response = await GET(request);
    const data = await response.json() as { success: boolean; data: { templates: unknown[] } };

    const template = (data.data.templates as Array<Record<string, unknown>>)[0];
    expect(template).toHaveProperty('id');
    expect(template).toHaveProperty('name');
    expect(template).toHaveProperty('description');
    expect(template).toHaveProperty('industry');
    expect(template).toHaveProperty('createdAt');
    expect(template).toHaveProperty('updatedAt');
  });

  it('TC5: 未认证 → 401', async () => {
    const { getAuthUserFromRequest } = await import('@/lib/authFromGateway');
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: false });

    const request = new NextRequest('http://localhost:3000/api/v1/templates');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/templates/export — E04 S04.3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC6: 导出返回 200 + JSON Content-Type', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates/export');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
  });

  it('TC7: 导出内容是有效 JSON 数组', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates/export');
    const response = await GET(request);
    const text = await response.text();

    const parsed = JSON.parse(text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });
});

describe('POST /api/v1/templates — E04 S04.1 (201)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC8: 必填字段缺失 → 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }), // missing description
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('TC9: 正常创建 → 201 + 返回 created 模板', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E 测试模板',
        description: '用于自动化测试的模板',
        industry: 'saas',
        tags: ['test', 'e2e'],
      }),
    });
    const response = await POST(request);
    const data = await response.json() as { success: boolean; data: Record<string, unknown> };

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.name).toBe('E2E 测试模板');
    expect(data.data.description).toBe('用于自动化测试的模板');
    expect(data.data.tags).toContain('test');
  });

  it('TC10: 创建后可在列表中查到', async () => {
    const createReq = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '列表测试模板', description: '测试列表查询' }),
    });
    const createRes = await POST(createReq);
    const created = (await createRes.json()) as { data: { id: string } };

    const listReq = new NextRequest('http://localhost:3000/api/v1/templates');
    const listRes = await GET(listReq);
    const listData = await listRes.json() as { data: { templates: Array<{ id: string }> } };

    const ids = listData.data.templates.map(t => t.id);
    expect(ids).toContain(created.data.id);
  });

  it('TC11: industry 默认为 saas', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '无 industry 模板', description: '测试默认' }),
    });
    const response = await POST(request);
    const data = await response.json() as { success: boolean; data: { industry: string } };

    expect(response.status).toBe(201);
    expect(data.data.industry).toBe('saas');
  });

  it('TC12: tags 默认为空数组', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '无 tags 模板', description: '测试默认' }),
    });
    const response = await POST(request);
    const data = await response.json() as { success: boolean; data: { tags: unknown[] } };

    expect(response.status).toBe(201);
    expect(Array.isArray(data.data.tags)).toBe(true);
    expect(data.data.tags.length).toBe(0);
  });

  it('TC13: 无认证 → 401', async () => {
    const { getAuthUserFromRequest } = await import('@/lib/authFromGateway');
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: false });

    const request = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', description: 'Test' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/v1/templates/import — E04 S04.3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC14: 正常导入 → 201 + 返回导入的模板', async () => {
    const importData = {
      name: '导入模板',
      description: '从 JSON 导入的模板',
      industry: 'ecommerce',
      tags: ['imported'],
    };
    const request = new NextRequest('http://localhost:3000/api/v1/templates/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importData),
    });
    const response = await POST(request);
    const data = await response.json() as { success: boolean; data: Record<string, unknown> };

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('导入模板');
    expect(data.data.industry).toBe('ecommerce');
    expect(data.data.tags).toContain('imported');
  });

  it('TC15: 缺少必填字段 → 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: '缺少 name' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('TC16: 无效 JSON → 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/templates/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json{',
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
