/**
 * share/route.test.ts — S88-E4: Canvas Share API Tests
 * Tests comment-only permission + embed URL generation
 * Backend: Jest framework, not Vitest
 */
import { describe, it, expect } from '@jest/globals';

const mockExecuteDB = jest.fn();
const mockQueryOne = jest.fn();
jest.mock('@/lib/db', () => ({
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  generateId: () => 'mock-share-id',
  Env: {},
}));

jest.mock('@/lib/logger/safeError', () => ({
  safeError: jest.fn(),
}));

// Re-import after mocking
import { POST, GET } from './route';
import { NextRequest } from 'next/server';

function makeContext(env = {}) {
  return {
    params: Promise.resolve({ id: 'canvas-123' }),
    env: { DB: {} as D1Database, ...env },
  };
}

describe('POST /api/canvas/:id/share', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteDB.mockResolvedValue({});
  });

  it('creates a share link with default viewer role', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe('viewer');
    expect(body.shareUrl).toContain('/canvas/share?token=');
    expect(body.embedUrl).toContain('/canvas/share?token=');
  });

  it('creates a share link with comment-only role', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'comment-only' }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe('comment-only');
    expect(body.embedUrl).toContain('mode=comment-only');
  });

  it('rejects invalid role', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('role must be one of');
  });

  it('returns embedUrl in response', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'editor' }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    const body = await res.json();
    expect(body.embedUrl).toContain('embed=1');
    expect(body.embedUrl).toContain('mode=editor');
  });
});

describe('GET /api/canvas/:id/share', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne.mockResolvedValue({
      id: 'share-id',
      canvas_id: 'canvas-123',
      token: 'abc123token',
      role: 'comment-only',
      created_by: 'user1',
      created_at: '2026-01-01T00:00:00Z',
      expires_at: '2027-01-01T00:00:00Z',
      is_active: 1,
    });
  });

  it('returns share info for valid token', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=abc123token');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('comment-only');
    expect(body.mode).toBe('comment-only');
  });

  it('returns embedUrl when embed=1', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=abc123token&embed=1');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.embedUrl).toContain('embed=1');
    expect(body.embedUrl).toContain('mode=comment-only');
  });

  it('returns 400 when token is missing', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when token not found', async () => {
    mockQueryOne.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=invalid');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(404);
  });

  it('returns 410 when token expired', async () => {
    mockQueryOne.mockResolvedValue({
      id: 'share-id',
      canvas_id: 'canvas-123',
      token: 'abc123token',
      role: 'viewer',
      created_by: 'user1',
      created_at: '2020-01-01T00:00:00Z',
      expires_at: '2020-01-02T00:00:00Z',
      is_active: 1,
    });
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=abc123token');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(410);
  });
});
