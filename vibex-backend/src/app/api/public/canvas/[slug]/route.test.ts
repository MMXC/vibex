/**
 * route.test.ts — Public Canvas Access API Tests
 * S95-E2: Public Canvas Portal
 * Backend: Jest framework
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockQueryOne = jest.fn();

jest.mock('@/lib/db', () => ({
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryDB: jest.fn(),
  executeDB: jest.fn(),
}));

jest.mock('@/lib/logger/safeError', () => ({
  safeError: jest.fn(),
}));

import { GET } from './route';

function makeCtx(slug: string) {
  return { params: Promise.resolve({ slug }), env: { DB: {} } } as any;
}

describe('GET /api/public/canvas/:slug', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns 400 when slug is empty', async () => {
    const req = new NextRequest('http://localhost/api/public/canvas/');
    const res = await GET(req, { params: Promise.resolve({ slug: '' }), env: { DB: {} } } as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when slug not found', async () => {
    mockQueryOne.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost/api/public/canvas/nonexistent'), makeCtx('nonexistent'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('not found or not public');
  });

  it('returns 404 when canvas data missing despite slug', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ canvas_id: 'c1', public_slug: 'my-slug', is_public: 1, canvas_name: 'C', canvas_owner_id: 'u1', owner_name: 'A', owner_email: 'a@test.com' })
      .mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost/api/public/canvas/my-slug'), makeCtx('my-slug'));
    expect(res.status).toBe(404);
  });

  it('returns full canvas data for valid public slug', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ canvas_id: 'c1', public_slug: 'my-slug', is_public: 1, canvas_name: 'My Canvas', canvas_owner_id: 'u1', owner_name: 'Alice', owner_email: 'alice@test.com' })
      .mockResolvedValueOnce({ id: 'c1', name: 'My Canvas', nodes: '[]', edges: '[]', owner_id: 'u1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' });
    const res = await GET(new NextRequest('http://localhost/api/public/canvas/my-slug'), makeCtx('my-slug'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.is_public).toBe(true);
    expect(body.canvas.id).toBe('c1');
    expect(body.canvas.name).toBe('My Canvas');
    expect(body.canvas.nodes).toEqual([]);
    expect(body.canvas.edges).toEqual([]);
    expect(body.canvas.owner.userId).toBe('u1');
    expect(body.canvas.owner.name).toBe('Alice');
  });

  it('parses nodes and edges JSON correctly', async () => {
    const nodes = [{ id: 'n1' }, { id: 'n2' }];
    const edges = [{ id: 'e1', source: 'n1', target: 'n2' }];
    mockQueryOne
      .mockResolvedValueOnce({ canvas_id: 'c1', public_slug: 's', is_public: 1, canvas_name: 'C', canvas_owner_id: 'u1', owner_name: null, owner_email: null })
      .mockResolvedValueOnce({ id: 'c1', name: 'C', nodes: JSON.stringify(nodes), edges: JSON.stringify(edges), owner_id: 'u1', created_at: '2026-01-01', updated_at: '2026-01-01' });
    const res = await GET(new NextRequest('http://localhost/api/public/canvas/s'), makeCtx('s'));
    const body = await res.json();
    expect(body.canvas.nodes).toEqual(nodes);
    expect(body.canvas.edges).toEqual(edges);
  });

  it('handles null nodes and edges gracefully', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ canvas_id: 'c1', public_slug: 's', is_public: 1, canvas_name: 'C', canvas_owner_id: 'u1', owner_name: null, owner_email: null })
      .mockResolvedValueOnce({ id: 'c1', name: 'C', nodes: null, edges: null, owner_id: 'u1', created_at: '2026-01-01', updated_at: '2026-01-01' });
    const res = await GET(new NextRequest('http://localhost/api/public/canvas/s'), makeCtx('s'));
    const body = await res.json();
    expect(body.canvas.nodes).toEqual([]);
    expect(body.canvas.edges).toEqual([]);
  });

  it('rejects non-public slugs (no is_public=1)', async () => {
    mockQueryOne.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost/api/public/canvas/private-slug'), makeCtx('private-slug'));
    expect(res.status).toBe(404);
  });
});
