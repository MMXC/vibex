/**
 * Unit tests for GET /api/templates/public
 * S90-E3: Template Sharing & Public Gallery
 *
 * Coverage:
 *  1. TC1: Returns 200 + public templates list
 *  2. TC2: Supports category filter via tags
 *  3. TC3: Supports sort=rating
 *  4. TC4: Supports sort=usage
 *  5. TC5: Supports pagination (page, limit)
 *  6. TC6: Returns total count
 *  7. TC7: No auth required — works without auth header
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => {
  return {
    queryDB: jest.fn(),
    queryOne: jest.fn(),
    executeDB: jest.fn(),
    generateId: jest.fn(),
    safeError: jest.fn(),
    Env: {},
  };
});

import { GET } from './route';
import { queryDB } from '@/lib/db';

const mockEnv = {} as any;

describe('GET /api/templates/public', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC1: Returns 200 + public templates list', async () => {
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([{ cnt: 2 }]) // count query
      .mockResolvedValueOnce([
        {
          id: 'tpl-1',
          name: 'Ecommerce SaaS',
          description: 'Ecommerce template',
          author_name: 'Alice',
          tags: '["saas","ecommerce"]',
          thumbnail: null,
          usage_count: 10,
          avg_rating: 4.5,
          rating_count: 8,
          share_token: 'abc123',
          published_at: '2026-06-01T00:00:00Z',
        },
        {
          id: 'tpl-2',
          name: 'Social Platform',
          description: 'Social network',
          author_name: 'Bob',
          tags: '["social"]',
          thumbnail: null,
          usage_count: 5,
          avg_rating: 4.0,
          rating_count: 3,
          share_token: 'def456',
          published_at: '2026-06-02T00:00:00Z',
        },
      ]);

    const request = new NextRequest('http://localhost:3000/api/templates/public');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.templates).toHaveLength(2);
    expect(data.templates[0].tags).toEqual(['saas', 'ecommerce']);
    expect(data.templates[1].tags).toEqual(['social']);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
  });

  it('TC2: Supports category filter via tags', async () => {
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([{ cnt: 1 }])
      .mockResolvedValueOnce([
        {
          id: 'tpl-1',
          name: 'Ecommerce SaaS',
          description: 'Ecommerce template',
          author_name: 'Alice',
          tags: '["saas","ecommerce"]',
          thumbnail: null,
          usage_count: 10,
          avg_rating: 4.5,
          rating_count: 8,
          share_token: 'abc123',
          published_at: '2026-06-01T00:00:00Z',
        },
      ]);

    const request = new NextRequest('http://localhost:3000/api/templates/public?category=saas');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    // Verify the query was called with the category filter
    expect(queryDB).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('tags LIKE'),
      expect.arrayContaining(['%saas%'])
    );
  });

  it('TC3: Supports sort=rating', async () => {
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/public?sort=rating');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    expect(queryDB).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('avg_rating DESC'),
      expect.any(Array)
    );
  });

  it('TC4: Supports sort=usage', async () => {
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/public?sort=usage');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    expect(queryDB).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('usage_count DESC'),
      expect.any(Array)
    );
  });

  it('TC5: Supports pagination (page, limit)', async () => {
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([{ cnt: 50 }])
      .mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/public?page=3&limit=10');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.page).toBe(3);
    expect(data.limit).toBe(10);
    // OFFSET = (3-1) * 10 = 20
    expect(queryDB).toHaveBeenLastCalledWith(
      mockEnv,
      expect.stringContaining('LIMIT ? OFFSET ?'),
      expect.arrayContaining([10, 20])
    );
  });

  it('TC6: Returns total count', async () => {
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([{ cnt: 42 }])
      .mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/public');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.total).toBe(42);
  });

  it('TC7: No auth required — works without auth header', async () => {
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([]);

    // No auth header set
    const request = new NextRequest('http://localhost:3000/api/templates/public');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});
