/**
 * route-tags.test.ts — GET /api/templates with tags parameter tests
 * Sprint86 E3: 模板增强搜索与筛选
 *
 * Tests:
 * 1. GET without tags → returns all templates (existing behavior)
 * 2. GET with single tag → filters templates with matching tags (OR)
 * 3. GET with multiple tags → OR filter, returns templates matching any tag
 * 4. GET with tags + sort=usage → filters then sorts
 * 5. GET with tags + sort=rating → filters then sorts
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => {
  const mockQueryDB = jest.fn();
  const mockSafeError = jest.fn((..._args: unknown[]) => { /* noop */ });
  (global as Record<string, unknown>).__tplTagsQueryDB = mockQueryDB;
  return {
    queryDB: mockQueryDB,
    queryOne: jest.fn(),
    executeDB: jest.fn(),
    generateId: jest.fn(() => 'gen-id'),
    safeError: mockSafeError,
  };
});

jest.mock('@/lib/log-sanitizer', () => ({
  safeError: jest.fn((..._args: unknown[]) => { /* noop */ }),
}));

const mockQueryDB = () => (global as Record<string, unknown>).__tplTagsQueryDB as jest.Mock;

import { GET } from './route';

const mockEnv = { DB: {} };

const mockTemplateRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'tpl-001',
  name: 'SaaS Product Requirements',
  description: 'Template for SaaS products',
  author_id: 'user-1',
  author_name: 'Alice',
  tags: '["saas","product"]',
  thumbnail: null,
  canvas_id: 'canvas-1',
  usage_count: 42,
  avg_rating: 4.5,
  rating_count: 10,
  created_at: '2026-06-01T00:00:00.000Z',
  published_at: '2026-06-01T00:00:00.000Z',
  ...overrides,
});

describe('GET /api/templates — tags parameter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all templates without tags filter', async () => {
    mockQueryDB().mockResolvedValueOnce([
      mockTemplateRow({ id: 'tpl-001', tags: '["saas"]' }),
      mockTemplateRow({ id: 'tpl-002', tags: '["ecommerce"]' }),
    ]);

    const request = new NextRequest('http://localhost:3000/api/templates');
    const response = await GET(request, { env: mockEnv } as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.templates).toHaveLength(2);
    // No WHERE clause → queryDB called without tag params
    const callArgs = mockQueryDB().mock.calls[0];
    expect(callArgs[0]).toBe(mockEnv);
    expect(callArgs[1]).toContain('FROM templates');
    expect(callArgs[1]).not.toContain('WHERE');
  });

  it('filters by single tag (OR)', async () => {
    mockQueryDB().mockResolvedValueOnce([
      mockTemplateRow({ id: 'tpl-001', tags: '["saas","product"]' }),
    ]);

    const request = new NextRequest('http://localhost:3000/api/templates?tags=saas');
    const response = await GET(request, { env: mockEnv } as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.templates).toHaveLength(1);
    // WHERE clause with LIKE for the single tag
    const callArgs = mockQueryDB().mock.calls[0];
    expect(callArgs[1]).toContain('WHERE');
    expect(callArgs[1]).toContain('tags LIKE');
    // params: tag value + limit
    expect(callArgs[2]).toContain('%saas%');
    expect(callArgs[2]).toContain(50); // default limit
  });

  it('filters by multiple tags (OR — returns templates matching any tag)', async () => {
    mockQueryDB().mockResolvedValueOnce([
      mockTemplateRow({ id: 'tpl-001', tags: '["saas"]' }),
      mockTemplateRow({ id: 'tpl-002', tags: '["ecommerce"]' }),
    ]);

    const request = new NextRequest('http://localhost:3000/api/templates?tags=saas,ecommerce');
    const response = await GET(request, { env: mockEnv } as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.templates).toHaveLength(2);
    const callArgs = mockQueryDB().mock.calls[0];
    // Two LIKE conditions joined by OR
    expect(callArgs[1]).toContain('tags LIKE ? OR tags LIKE ?');
    expect(callArgs[2]).toEqual(['%saas%', '%ecommerce%', 50]);
  });

  it('filters by tags and sorts by usage_count', async () => {
    mockQueryDB().mockResolvedValueOnce([
      mockTemplateRow({ id: 'tpl-002', tags: '["ecommerce"]', usage_count: 100 }),
      mockTemplateRow({ id: 'tpl-001', tags: '["saas"]', usage_count: 42 }),
    ]);

    const request = new NextRequest('http://localhost:3000/api/templates?tags=saas&sort=usage');
    const response = await GET(request, { env: mockEnv } as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.templates).toHaveLength(2);
    const callArgs = mockQueryDB().mock.calls[0];
    expect(callArgs[1]).toContain('usage_count DESC');
    expect(callArgs[1]).toContain('WHERE');
    expect(callArgs[2]).toEqual(['%saas%', 50]);
  });

  it('returns 500 on DB error', async () => {
    mockQueryDB().mockRejectedValueOnce(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/templates?tags=saas');
    const response = await GET(request, { env: mockEnv } as never);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });
});
