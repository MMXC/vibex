/**
 * route.test.ts — /api/templates/[id]/tags API tests
 * Sprint86 E3: 模板增强搜索与筛选
 *
 * Tests:
 * 1. PUT: unauthenticated → 401
 * 2. PUT: template not found → 404
 * 3. PUT: invalid tags (not array) → 400
 * 4. PUT: update tags successfully → 200
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => {
  const mockQueryOne = jest.fn();
  const mockExecuteDB = jest.fn();
  (global as Record<string, unknown>).__tagsQueryOne = mockQueryOne;
  (global as Record<string, unknown>).__tagsExecuteDB = mockExecuteDB;
  return {
    queryOne: mockQueryOne,
    executeDB: mockExecuteDB,
    generateId: jest.fn(() => 'generated-id'),
    queryDB: jest.fn(),
  };
});

jest.mock('@/lib/log-sanitizer', () => {
  const mockSafeError = jest.fn();
  (global as Record<string, unknown>).__tagsSafeError = mockSafeError;
  return { safeError: mockSafeError };
});

const mockQueryOne = () => (global as Record<string, unknown>).__tagsQueryOne as jest.Mock;
const mockExecuteDB = () => (global as Record<string, unknown>).__tagsExecuteDB as jest.Mock;

import { PUT } from './route';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

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

describe('PUT /api/templates/[id]/tags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: false, user: null });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-001/tags', {
      method: 'PUT',
      body: JSON.stringify({ tags: ['saas'] }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'tpl-001' }),
      env: mockEnv as never,
    });

    expect(response.status).toBe(401);
  });

  it('returns 400 when tags is not an array', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-001/tags', {
      method: 'PUT',
      body: JSON.stringify({ tags: 'not-an-array' }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'tpl-001' }),
      env: mockEnv as never,
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('tags must be an array');
  });

  it('returns 404 when template not found', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    mockQueryOne().mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-999/tags', {
      method: 'PUT',
      body: JSON.stringify({ tags: ['saas', 'product'] }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'tpl-999' }),
      env: mockEnv as never,
    });

    expect(response.status).toBe(404);
  });

  it('updates tags successfully and returns the template', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    mockQueryOne()
      .mockResolvedValueOnce({ id: 'tpl-001' }) // exists check
      .mockResolvedValueOnce(mockTemplateRow({ tags: '["saas","product","ecommerce"]' })); // after update
    mockExecuteDB().mockResolvedValueOnce({ changes: 1 });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-001/tags', {
      method: 'PUT',
      body: JSON.stringify({ tags: ['saas', 'product', 'ecommerce'] }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'tpl-001' }),
      env: mockEnv as never,
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.template.tags).toEqual(['saas', 'product', 'ecommerce']);
    expect(mockExecuteDB()).toHaveBeenCalledWith(
      mockEnv,
      'UPDATE templates SET tags = ? WHERE id = ?',
      ['["saas","product","ecommerce"]', 'tpl-001']
    );
  });
});
