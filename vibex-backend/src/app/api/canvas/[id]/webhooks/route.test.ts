/**
 * route.test.ts — S94-E2: Canvas Webhooks API Tests
 * Tests: GET list webhooks, POST create webhook, validation
 * Backend: Jest framework
 */
import { describe, it, expect, beforeEach } from '@jest/globals';

const mockQueryDB = jest.fn();
const mockExecuteDB = jest.fn();
jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: () => 'mock-webhook-id',
  Env: {},
}));

jest.mock('@/lib/logger/safeError', () => ({
  safeError: jest.fn(),
}));

import { GET, POST } from './route';
import { NextRequest } from 'next/server';

function makeContext(env = {}) {
  return {
    params: Promise.resolve({ id: 'canvas-123' }),
    env: { DB: {} as D1Database, ...env },
  };
}

describe('GET /api/canvas/:id/webhooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryDB.mockResolvedValue([]);
  });

  it('returns empty array when no webhooks exist', async () => {
    mockQueryDB.mockResolvedValue([]);
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webhooks).toEqual([]);
  });

  it('returns webhooks mapped correctly', async () => {
    mockQueryDB.mockResolvedValue([{
      id: 'wh-1',
      canvas_id: 'canvas-123',
      url: 'https://example.com/hook',
      secret: 'mysecret',
      events: '["share.created","canvas.updated"]',
      is_active: 1,
      created_by: 'user1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }]);
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webhooks).toHaveLength(1);
    expect(body.webhooks[0].url).toBe('https://example.com/hook');
    expect(body.webhooks[0].events).toEqual(['share.created', 'canvas.updated']);
    expect(body.webhooks[0].isActive).toBe(true);
    expect(body.webhooks[0].secret).toBeUndefined(); // secret should not be exposed
  });

  it('marks inactive webhooks correctly', async () => {
    mockQueryDB.mockResolvedValue([{
      id: 'wh-2',
      canvas_id: 'canvas-123',
      url: 'https://example.com/hook2',
      secret: 'secret2',
      events: '["share.accessed"]',
      is_active: 0,
      created_by: 'user2',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }]);
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks');
    const ctx = makeContext();
    const res = await GET(req, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webhooks[0].isActive).toBe(false);
  });
});

describe('POST /api/canvas/:id/webhooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteDB.mockResolvedValue({});
  });

  it('creates a webhook with valid url and events', async () => {
    mockExecuteDB.mockResolvedValue({});
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com/webhook',
        events: ['share.created', 'canvas.updated'],
      }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('mock-webhook-id');
    expect(body.url).toBe('https://example.com/webhook');
    expect(body.events).toEqual(['share.created', 'canvas.updated']);
    expect(body.isActive).toBe(true);
  });

  it('returns 400 when url is missing', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: ['share.created'] }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('url is required');
  });

  it('returns 400 when url is invalid', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'not-a-url', events: ['share.created'] }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('valid URL');
  });

  it('returns 400 when url uses non-http protocol', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'ftp://example.com/hook', events: ['share.created'] }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('http or https');
  });

  it('returns 400 when events array is empty', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/hook', events: [] }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('non-empty array');
  });

  it('returns 400 when events contain invalid event types', async () => {
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/hook', events: ['share.created', 'invalid.event'] }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('invalid.event');
  });

  it('accepts all valid event types', async () => {
    mockExecuteDB.mockResolvedValue({});
    const validEvents = [
      'share.created', 'share.accessed', 'share.expired', 'share.revoked',
      'canvas.updated', 'canvas.deleted', 'canvas.exported',
      'comment.created', 'comment.updated',
    ];
    const req = new NextRequest('http://localhost/api/canvas/canvas-123/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/hook', events: validEvents }),
    });
    const ctx = makeContext();
    const res = await POST(req, ctx as any);
    expect(res.status).toBe(201);
  });
});
