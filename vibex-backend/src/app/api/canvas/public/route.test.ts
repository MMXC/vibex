/**
 * route.test.ts — Public Canvas List API Tests
 * S95-E2: Public Canvas Portal
 * Backend: Jest framework
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockQueryOne = jest.fn();
const mockQueryDB = jest.fn();

jest.mock('@/lib/db', () => ({
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  executeDB: jest.fn(),
}));

jest.mock('@/lib/logger/safeError', () => ({
  safeError: jest.fn(),
}));

import { GET } from './route';

function makeCtx() {
  return { params: Promise.resolve({}), env: { DB: {} } } as any;
}

describe('GET /api/canvas/public', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns paginated public canvases with defaults', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 2 });
    mockQueryDB.mockResolvedValueOnce([
      { canvas_id: 'c1', public_slug: 's1', canvas_name: 'Canvas 1', canvas_updated_at: '2026-01-01', canvas_created_at: '2026-01-01', owner_name: 'Alice', owner_email: 'alice@test.com', nodes: '[]', edges: '[]' },
      { canvas_id: 'c2', public_slug: 's2', canvas_name: 'Canvas 2', canvas_updated_at: '2026-01-02', canvas_created_at: '2026-01-02', owner_name: 'Bob', owner_email: 'bob@test.com', nodes: '[1,2,3]', edges: '[1,2]' },
    ]);
    const res = await GET(new NextRequest('http://localhost/api/canvas/public'), makeCtx());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(body.canvases).toHaveLength(2);
    expect(body.canvases[0].name).toBe('Canvas 1');
    expect(body.canvases[0].publicUrl).toBe('/public/s1');
  });

  it('respects page and limit params', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 50 });
    mockQueryDB.mockResolvedValueOnce([]);
    const res = await GET(new NextRequest('http://localhost/api/canvas/public?page=3&limit=10'), makeCtx());
    const body = await res.json();
    expect(body.page).toBe(3);
    expect(body.limit).toBe(10);
  });

  it('caps limit at 100', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 200 });
    mockQueryDB.mockResolvedValueOnce([]);
    const res = await GET(new NextRequest('http://localhost/api/canvas/public?limit=999'), makeCtx());
    const body = await res.json();
    expect(body.limit).toBe(100);
  });

  it('calculates node/edge counts from JSON', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 1 });
    mockQueryDB.mockResolvedValueOnce([
      { canvas_id: 'c1', public_slug: 's1', canvas_name: 'C', canvas_updated_at: '2026-01-01', canvas_created_at: '2026-01-01', owner_name: null, owner_email: null, nodes: '[1,2,3,4,5]', edges: '[1,2,3]' },
    ]);
    const res = await GET(new NextRequest('http://localhost/api/canvas/public'), makeCtx());
    const body = await res.json();
    expect(body.canvases[0].nodeCount).toBe(5);
    expect(body.canvases[0].edgeCount).toBe(3);
  });

  it('handles null/empty nodes gracefully', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 1 });
    mockQueryDB.mockResolvedValueOnce([
      { canvas_id: 'c1', public_slug: 's1', canvas_name: 'C', canvas_updated_at: '2026-01-01', canvas_created_at: '2026-01-01', owner_name: null, owner_email: null, nodes: null, edges: null },
    ]);
    const res = await GET(new NextRequest('http://localhost/api/canvas/public'), makeCtx());
    const body = await res.json();
    expect(body.canvases[0].nodeCount).toBe(0);
    expect(body.canvases[0].edgeCount).toBe(0);
  });

  it('returns empty list when no public canvases', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 });
    mockQueryDB.mockResolvedValueOnce([]);
    const res = await GET(new NextRequest('http://localhost/api/canvas/public'), makeCtx());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.canvases).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('does not require authentication', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 });
    mockQueryDB.mockResolvedValueOnce([]);
    const res = await GET(new NextRequest('http://localhost/api/canvas/public'), makeCtx());
    expect(res.status).toBe(200);
  });
});
