/**
 * route.test.ts — /api/canvas/[id]/access-history Jest Tests
 * Sprint89 E1: Canvas Analytics Dashboard
 *
 * Tests:
 * 1. GET without auth → 401 Unauthorized
 * 2. GET with auth → returns access records
 * 3. GET with limit → respects limit parameter
 * 4. POST without auth → 401 Unauthorized
 * 5. POST with auth → records access and returns ok
 * 6. POST with missing userId/userName → 400 Bad Request
 * 7. POST dedupes by userId per canvas
 */
import { describe, it, expect, beforeEach } from 'jest';

const mockQueryDB = jest.fn();
const mockExecuteDB = jest.fn();
const mockGenerateId = jest.fn(() => 'history-001');

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: () => mockGenerateId(),
  safeError: (...args: unknown[]) => {
    console.error('[safeError]', ...args);
  },
  Env: {},
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn((request: Request) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return { success: false as const, user: undefined };
    return { success: true as const, user: { userId: 'user-001', name: 'Test User' } };
  }),
}));

describe('GET /api/canvas/[id]/access-history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryDB.mockResolvedValue([
      {
        id: 'h1',
        canvas_id: 'c1',
        user_id: 'u1',
        user_name: 'Alice',
        avatar_url: 'https://avatar.example/alice.png',
        accessed_at: '2026-06-10T12:00:00Z',
      },
      {
        id: 'h2',
        canvas_id: 'c1',
        user_id: 'u2',
        user_name: 'Bob',
        avatar_url: null,
        accessed_at: '2026-06-09T12:00:00Z',
      },
    ]);
  });

  it('returns 401 without auth', async () => {
    const { GET } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history');
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(401);
  });

  it('returns access records for authenticated user', async () => {
    const { GET } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; records: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.records).toHaveLength(2);
    expect(data.records[0]).toMatchObject({
      id: 'h1',
      canvasId: 'c1',
      userId: 'u1',
      userName: 'Alice',
      avatarUrl: 'https://avatar.example/alice.png',
    });
    expect(data.records[1]).toMatchObject({
      id: 'h2',
      canvasId: 'c1',
      userId: 'u2',
      userName: 'Bob',
    });
  });

  it('respects limit parameter', async () => {
    const { GET } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history?limit=1', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; records: unknown[] };
    expect(mockQueryDB).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('LIMIT ?'),
      expect.arrayContaining([1])
    );
  });

  it('returns 500 on DB error', async () => {
    mockQueryDB.mockRejectedValue(new Error('DB error'));
    const { GET } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/canvas/[id]/access-history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteDB.mockResolvedValue({ success: true });
  });

  it('returns 401 without auth', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', userName: 'Alice' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(401);
  });

  it('records access for authenticated user', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', userName: 'Alice', avatarUrl: 'https://avatar.example/alice.png' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(true);
    expect(mockExecuteDB).toHaveBeenCalledTimes(2); // delete + insert
    expect(mockExecuteDB).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.stringContaining('DELETE'),
      expect.arrayContaining(['c1', 'u1'])
    );
    expect(mockExecuteDB).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.stringContaining('INSERT'),
      expect.arrayContaining(['history-001', 'c1', 'u1', 'Alice'])
    );
  });

  it('returns 400 when userId is missing', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: 'Alice' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(400);
  });

  it('returns 400 when userName is missing', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(400);
  });

  it('returns 500 on DB error during insert', async () => {
    mockExecuteDB.mockRejectedValue(new Error('DB error'));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/canvas/c1/access-history', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', userName: 'Alice' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(500);
  });
});
