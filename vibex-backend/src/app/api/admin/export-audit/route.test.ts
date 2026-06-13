/**
 * export-audit/route.test.ts — S94-E3: Canvas Audit Log
 * Tests for /api/admin/export-audit POST
 */
import { jest } from '@jest/globals';

// Mock before imports
const mockQueryDB = jest.fn<() => Promise<unknown[]>>();

// Mock modules
jest.mock('@/lib/db', () => ({
  queryDB: mockQueryDB,
  safeError: jest.fn((...args: unknown[]) => { console.error('[safeError]', ...args); }),
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

import { POST } from './route';
import type { NextRequest } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

const mockEnv = {
  DB: {} as unknown,
} as { DB: unknown };

const _makeReq = (body: Record<string, unknown>, token = 'valid-token') => {
  return {
    json: jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue(body),
  } as unknown as NextRequest;
};

beforeEach(() => {
  mockQueryDB.mockReset();
  (getAuthUserFromRequest as jest.Mock).mockReset();
});

describe('POST /api/admin/export-audit', () => {
  it('returns 401 if not authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: false, user: null });

    const req = _makeReq({ format: 'csv' });
    const res = await POST(req as NextRequest, { env: mockEnv });

    expect(res.status).toBe(401);
    const json = await (res as NextResponse).json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 if format is missing', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: true, user: { userId: 'admin-1' } });

    const req = _makeReq({});
    const res = await POST(req as NextRequest, { env: mockEnv });

    expect(res.status).toBe(400);
  });

  it('returns 400 if format is invalid', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: true, user: { userId: 'admin-1' } });

    const req = _makeReq({ format: 'xml' });
    const res = await POST(req as NextRequest, { env: mockEnv });

    expect(res.status).toBe(400);
    const json = await (res as NextResponse).json();
    expect(json.error).toContain('format must be csv or json');
  });

  it('returns CSV with correct headers', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: true, user: { userId: 'admin-1' } });
    mockQueryDB.mockResolvedValue([
      {
        id: 'a1',
        canvas_id: 'canvas-123',
        user_id: 'user-1',
        action: 'create',
        entity_type: 'node',
        entity_id: 'node-1',
        details: '{"name":"Test"}',
        created_at: '2026-06-13T10:00:00Z',
      },
    ]);

    const req = _makeReq({ format: 'csv' });
    const res = await POST(req as NextRequest, { env: mockEnv });

    expect(res.status).toBe(200);
    expect((res as NextResponse).headers.get('Content-Type')).toContain('text/csv');
    expect((res as NextResponse).headers.get('Content-Disposition')).toContain('attachment');

    const text = await (res as NextResponse).text();
    expect(text).toContain('id,canvas_id,user_id,action');
    expect(text).toContain('canvas-123');
  });

  it('returns JSON when format is json', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: true, user: { userId: 'admin-1' } });
    mockQueryDB.mockResolvedValue([]);

    const req = _makeReq({ format: 'json' });
    const res = await POST(req as NextRequest, { env: mockEnv });

    expect(res.status).toBe(200);
    expect((res as NextResponse).headers.get('Content-Type')).toContain('application/json');
    expect((res as NextResponse).headers.get('Content-Disposition')).toContain('attachment');

    const json = await (res as NextResponse).json();
    expect(json).toHaveProperty('entries');
    expect(json).toHaveProperty('exportedAt');
    expect(json).toHaveProperty('total');
  });

  it('escapes CSV fields with commas and quotes', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: true, user: { userId: 'admin-1' } });
    mockQueryDB.mockResolvedValue([
      {
        id: 'a2',
        canvas_id: 'canvas, x',
        user_id: 'user"1',
        action: 'create',
        entity_type: 'node',
        entity_id: null,
        details: null,
        created_at: '2026-06-13T10:00:00Z',
      },
    ]);

    const req = _makeReq({ format: 'csv' });
    const res = await POST(req as NextRequest, { env: mockEnv });
    const text = await (res as NextResponse).text();

    // "canvas, x" should be quoted, "user""1" should be double-quoted
    expect(text).toContain('"canvas, x"');
    expect(text).toContain('"user""1"');
  });
});

import { NextResponse } from 'next/server';
