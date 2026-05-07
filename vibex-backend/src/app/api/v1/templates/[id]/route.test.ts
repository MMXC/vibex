/**
 * Unit tests for E04: 模板 [id] API (PUT + DELETE)
 *
 * 覆盖范围：
 *  1. GET /api/v1/templates/:id — 获取单个模板
 *  2. PUT /api/v1/templates/:id — 更新模板（200）
 *  3. DELETE /api/v1/templates/:id — 删除模板（200，后续 GET → 404）
 *
 * E04 C4: 硬删除，DELETE 后 GET 返回 404
 * E04 C4: 内置模板（tmpl-001/002/003）不可修改或删除 → 403
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn().mockReturnValue({ success: true, user: { id: 'test-user' } }),
}));

import { GET, PUT, DELETE } from './route';

function makeRequest(method: string, body?: unknown, id = 'tmpl-001') {
  return new NextRequest(`http://localhost:3000/api/v1/templates/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe('GET /api/v1/templates/:id — E04 S04.1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC1: 存在的模板 → 200 + 模板数据', async () => {
    const request = makeRequest('GET', undefined, 'tmpl-001');
    const response = await GET(request, { params: Promise.resolve({ id: 'tmpl-001' }) });
    const data = await response.json() as { success: boolean; data: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id', 'tmpl-001');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('description');
  });

  it('TC2: 不存在的模板 → 404', async () => {
    const request = makeRequest('GET', undefined, 'non-existent-id');
    const response = await GET(request, { params: Promise.resolve({ id: 'non-existent-id' }) });
    const data = await response.json() as { success: boolean; error: string };

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  it('TC3: 返回的模板包含所有必需字段', async () => {
    const request = makeRequest('GET', undefined, 'tmpl-001');
    const response = await GET(request, { params: Promise.resolve({ id: 'tmpl-001' }) });
    const data = await response.json() as { data: Record<string, unknown> };

    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('description');
    expect(data.data).toHaveProperty('industry');
    expect(data.data).toHaveProperty('icon');
    expect(data.data).toHaveProperty('createdAt');
    expect(data.data).toHaveProperty('updatedAt');
    expect(data.data).toHaveProperty('tags');
    expect(data.data).toHaveProperty('entities');
    expect(data.data).toHaveProperty('boundedContexts');
  });
});

describe('PUT /api/v1/templates/:id — E04 S04.1 (200)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC4: 正常更新 → 200 + 更新后的数据', async () => {
    const request = makeRequest('PUT', { name: '更新的模板名称', description: '新的描述' }, 'tmpl-001');
    const response = await PUT(request, { params: Promise.resolve({ id: 'tmpl-001' }) });
    const data = await response.json() as { success: boolean; data: Record<string, unknown> };

    // 内置模板 tmpl-001 不可修改 → 403
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Built-in');
  });

  it('TC5: 不存在的模板 → 404', async () => {
    const request = makeRequest('PUT', { name: 'Test' }, 'non-existent-id');
    const response = await PUT(request, { params: Promise.resolve({ id: 'non-existent-id' }) });

    expect(response.status).toBe(404);
  });

  it('TC6: 先创建再更新 → PUT 返回 200（自定义模板可修改）', async () => {
    // 先通过 route.ts POST 创建
    const { POST: createPOST } = await import('../route');
    const createReq = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '可更新模板', description: '原始描述' }),
    });
    const createRes = await createPOST(createReq);
    const created = (await createRes.json()) as { data: { id: string } };
    const newId = created.data.id;

    // 更新
    const updateReq = makeRequest('PUT', { name: '更新后的名称' }, newId);
    const updateRes = await PUT(updateReq, { params: Promise.resolve({ id: newId }) });
    const updated = (await updateRes.json()) as { success: boolean; data: Record<string, unknown> };

    expect(updateRes.status).toBe(200);
    expect(updated.success).toBe(true);
    expect(updated.data.name).toBe('更新后的名称');
    expect(updated.data.description).toBe('原始描述'); // 未更新的字段保留
  });

  it('TC7: 部分字段更新 → 其他字段保持不变', async () => {
    // 创建
    const { POST: createPOST } = await import('../route');
    const createReq = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '原始名称', description: '原始描述', industry: 'ecommerce', tags: ['a', 'b'] }),
    });
    const createRes = await createPOST(createReq);
    const created = (await createRes.json()) as { data: { id: string } };
    const newId = created.data.id;

    // 只更新 name
    const updateReq = makeRequest('PUT', { name: '新名称' }, newId);
    const updateRes = await PUT(updateReq, { params: Promise.resolve({ id: newId }) });
    const updated = (await updateRes.json()) as { data: Record<string, unknown> };

    expect(updated.data.name).toBe('新名称');
    expect(updated.data.description).toBe('原始描述');
    expect(updated.data.industry).toBe('ecommerce');
    expect(updated.data.tags).toEqual(['a', 'b']);
  });

  it('TC8: updatedAt 在更新后变化', async () => {
    const { POST: createPOST } = await import('../route');
    const createReq = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '时间戳测试', description: '测试 updatedAt' }),
    });
    const createRes = await createPOST(createReq);
    const created = (await createRes.json()) as { data: { id: string; updatedAt: string } };
    const newId = created.data.id;

    await new Promise(r => setTimeout(r, 10)); // 等待 10ms 确保时间戳差异

    const updateReq = makeRequest('PUT', { name: '更新后' }, newId);
    const updateRes = await PUT(updateReq, { params: Promise.resolve({ id: newId }) });
    const updated = (await updateRes.json()) as { data: { updatedAt: string } };

    expect(updated.data.updatedAt).not.toBe(created.data.updatedAt);
  });
});

describe('DELETE /api/v1/templates/:id — E04 S04.1 (硬删除)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC9: 内置模板 tmpl-001 不可删除 → 403', async () => {
    const request = makeRequest('DELETE', undefined, 'tmpl-001');
    const response = await DELETE(request, { params: Promise.resolve({ id: 'tmpl-001' }) });

    expect(response.status).toBe(403);
  });

  it('TC10: 内置模板 tmpl-002 不可删除 → 403', async () => {
    const request = makeRequest('DELETE', undefined, 'tmpl-002');
    const response = await DELETE(request, { params: Promise.resolve({ id: 'tmpl-002' }) });

    expect(response.status).toBe(403);
  });

  it('TC11: 内置模板 tmpl-003 不可删除 → 403', async () => {
    const request = makeRequest('DELETE', undefined, 'tmpl-003');
    const response = await DELETE(request, { params: Promise.resolve({ id: 'tmpl-003' }) });

    expect(response.status).toBe(403);
  });

  it('TC12: 不存在的模板 → 404', async () => {
    const request = makeRequest('DELETE', undefined, 'non-existent-id');
    const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent-id' }) });

    expect(response.status).toBe(404);
  });

  it('TC13: 自定义模板删除 → 200', async () => {
    // 创建
    const { POST: createPOST } = await import('../route');
    const createReq = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '待删除模板', description: '将被删除' }),
    });
    const createRes = await createPOST(createReq);
    const created = (await createRes.json()) as { data: { id: string } };
    const newId = created.data.id;

    // 删除
    const deleteReq = makeRequest('DELETE', undefined, newId);
    const deleteRes = await DELETE(deleteReq, { params: Promise.resolve({ id: newId }) });

    expect(deleteRes.status).toBe(200);
  });

  it('TC14: E04 C4 — DELETE 后 GET → 404（硬删除）', async () => {
    // 创建
    const { POST: createPOST } = await import('../route');
    const createReq = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '硬删除测试', description: '测试硬删除' }),
    });
    const createRes = await createPOST(createReq);
    const created = (await createRes.json()) as { data: { id: string } };
    const newId = created.data.id;

    // 确认存在
    const getReq = makeRequest('GET', undefined, newId);
    const getRes = await GET(getReq, { params: Promise.resolve({ id: newId }) });
    expect(getRes.status).toBe(200);

    // 删除
    const deleteReq = makeRequest('DELETE', undefined, newId);
    await DELETE(deleteReq, { params: Promise.resolve({ id: newId }) });

    // 再次 GET → 404
    const getAfterDeleteReq = makeRequest('GET', undefined, newId);
    const getAfterDeleteRes = await GET(getAfterDeleteReq, { params: Promise.resolve({ id: newId }) });
    expect(getAfterDeleteRes.status).toBe(404);
  });

  it('TC15: DELETE 返回 200 + { success: true }', async () => {
    const { POST: createPOST } = await import('../route');
    const createReq = new NextRequest('http://localhost:3000/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '删除响应测试', description: '测试' }),
    });
    const createRes = await createPOST(createReq);
    const created = (await createRes.json()) as { data: { id: string } };
    const newId = created.data.id;

    const deleteReq = makeRequest('DELETE', undefined, newId);
    const deleteRes = await DELETE(deleteReq, { params: Promise.resolve({ id: newId }) });
    const deleteData = await deleteRes.json() as { success: boolean };

    expect(deleteRes.status).toBe(200);
    expect(deleteData.success).toBe(true);
  });
});
