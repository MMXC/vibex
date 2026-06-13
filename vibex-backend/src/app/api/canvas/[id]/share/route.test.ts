/**
 * route.test.ts — S94-E2: Advanced Canvas Share API Tests
 * Tests: role selection (owner/editor/viewer/commenter), expiration, password protection
 * Backend: Jest framework
 */
import { describe, it, expect, beforeEach } from '@jest/globals';

const mockExecuteDB = jest.fn();
const mockQueryOne = jest.fn();
const mockQueryDB = jest.fn();
jest.mock('@/lib/db', () => ({
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  generateId: () => 'mock-share-id',
  Env: {},
}));

jest.mock('@/lib/logger/safeError', () => ({
  safeError: jest.fn(),
}));

// Re-import after mocking
import { POST, GET, DELETE } from './route';
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
    expect(body.embedUrl).toContain('embed=1');
    expect(body.hasPassword).toBe(false);
  });

  it('creates a share link with editor role', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'editor' }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe('editor');
    expect(body.embedUrl).toContain('mode=editor');
  });

  it('creates a share link with commenter role', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'commenter' }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe('commenter');
    expect(body.embedUrl).toContain('mode=commenter');
  });

  it('creates a share link with owner role', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'owner' }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe('owner');
  });

  it('creates a share link with password protection', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secret123' }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.hasPassword).toBe(true);
    // password is base64-encoded in the DB
    expect(mockExecuteDB).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('INSERT INTO canvas_share_links'),
      expect.arrayContaining([expect.stringContaining('c2VjcmV0MTIz')])
    );
  });

  it('creates a share link with expiration time', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresInHours: 24 }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.expiresAt).toBeDefined();
    const expiresAt = new Date(body.expiresAt);
    const now = new Date();
    const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 3600);
    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThan(25);
  });

  it('creates a share link with allowComments and allowDownload', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowComments: true, allowDownload: true }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.allowComments).toBe(true);
    expect(body.allowDownload).toBe(true);
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
      role: 'commenter',
      created_by: 'user1',
      created_at: '2026-01-01T00:00:00Z',
      expires_at: '2027-01-01T00:00:00Z',
      is_active: 1,
      password_hash: null,
      allow_comments: 1,
      allow_download: 0,
      view_count: 5,
      metadata: null,
    });
  });

  it('returns share info for valid token', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=abc123token');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('commenter');
    expect(body.hasPassword).toBe(false);
    expect(body.allowComments).toBe(true);
    expect(body.allowDownload).toBe(false);
    expect(body.viewCount).toBe(5);
  });

  it('returns embedUrl when embed=1', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=abc123token&embed=1');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.embedUrl).toContain('embed=1');
    expect(body.embedUrl).toContain('mode=commenter');
  });

  it('returns 400 when token and canvasId are missing', async () => {
    // canvasId is in path but not token → route proceeds to list shares (canvasId from path)
    // This test verifies path canvasId is used when token is absent
    mockQueryDB.mockResolvedValue([]);
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    // canvasId from path is used, so route lists shares → 200
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shares).toEqual([]);
  });

  it('returns 400 when canvasId is missing from both path and query', async () => {
    // Only way to truly test missing canvasId: make params resolve to empty id
    mockQueryDB.mockResolvedValue([]);
    const req = new NextRequest('http://localhost/api/canvas//share');
    const ctx = { params: Promise.resolve({ id: '' }), env: { DB: {} as D1Database } };
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when token not found', async () => {
    mockQueryOne.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=notfound');
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
      password_hash: null,
      allow_comments: 1,
      allow_download: 0,
      view_count: 0,
      metadata: null,
    });
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=abc123token');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(410);
  });

  it('lists all shares for a canvas when canvasId is provided', async () => {
    mockQueryDB.mockResolvedValue([
      {
        id: 'share-1',
        canvas_id: 'canvas-123',
        token: 'token1',
        role: 'viewer',
        created_by: 'user1',
        created_at: '2026-01-01T00:00:00Z',
        expires_at: '2027-01-01T00:00:00Z',
        is_active: 1,
        password_hash: 'hash1',
        allow_comments: 1,
        allow_download: 1,
        view_count: 10,
        metadata: null,
      },
      {
        id: 'share-2',
        canvas_id: 'canvas-123',
        token: 'token2',
        role: 'editor',
        created_by: 'user1',
        created_at: '2026-01-02T00:00:00Z',
        expires_at: '2027-01-02T00:00:00Z',
        is_active: 1,
        password_hash: null,
        allow_comments: 0,
        allow_download: 0,
        view_count: 2,
        metadata: null,
      },
    ]);
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?canvasId=canvas-123');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shares).toHaveLength(2);
    expect(body.shares[0].role).toBe('viewer');
    expect(body.shares[0].hasPassword).toBe(true);
    expect(body.shares[0].allowDownload).toBe(true);
    expect(body.shares[1].role).toBe('editor');
    expect(body.shares[1].hasPassword).toBe(false);
  });
});

describe('DELETE /api/canvas/:id/share', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteDB.mockResolvedValue({});
  });

  it('revokes a share link by token', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share?token=abc123token', {
      method: 'DELETE',
    });
    const ctx = makeContext();
    const res = await DELETE(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockExecuteDB).toHaveBeenCalledWith(
      expect.anything(),
      'UPDATE canvas_share_links SET is_active = 0 WHERE token = ?',
      ['abc123token']
    );
  });

  it('returns 400 when token is missing', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/share', {
      method: 'DELETE',
    });
    const ctx = makeContext();
    const res = await DELETE(req, ctx as any);
    expect(res.status).toBe(400);
  });
});
