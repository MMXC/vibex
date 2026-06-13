/**
 * route.test.ts — /api/canvas/[id]/audit-log Jest Tests
 * Sprint94 E3: Canvas Audit Log
 *
 * Tests:
 * 1. GET without auth → 401 Unauthorized
 * 2. GET with auth → returns audit entries
 * 3. GET with user_id filter → filters results
 * 4. GET with action filter → filters results
 * 5. GET with time range filters → filters results
 * 6. GET with pagination → respects limit/offset
 * 7. GET with missing canvasId → handled (returns 401)
 */

const mockQueryDB = jest.fn();

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  generateId: () => 'audit-001',
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

import { GET } from './route';

describe('GET /api/canvas/[id]/audit-log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryDB.mockResolvedValue([
      {
        id: 'a1',
        canvas_id: 'c1',
        user_id: 'u1',
        action: 'create',
        entity_type: 'canvas',
        entity_id: 'c1',
        details: '{"title":"Test Canvas"}',
        created_at: '2026-06-13T10:00:00Z',
      },
      {
        id: 'a2',
        canvas_id: 'c1',
        user_id: 'u2',
        action: 'share',
        entity_type: 'share_link',
        entity_id: 'sl1',
        details: '{"role":"editor"}',
        created_at: '2026-06-13T11:00:00Z',
      },
    ]);
  });

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/canvas/c1/audit-log');
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(401);
  });

  it('returns audit entries for authenticated user', async () => {
    const req = new Request('http://localhost/api/canvas/c1/audit-log', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; entries: unknown[]; total: number };
    expect(data.ok).toBe(true);
    expect(data.entries).toHaveLength(2);
    expect(data.entries[0]).toMatchObject({
      id: 'a1',
      canvasId: 'c1',
      userId: 'u1',
      action: 'create',
      entityType: 'canvas',
      entityId: 'c1',
      details: { title: 'Test Canvas' },
      createdAt: '2026-06-13T10:00:00Z',
    });
    expect(data.entries[1]).toMatchObject({
      id: 'a2',
      canvasId: 'c1',
      userId: 'u2',
      action: 'share',
      entityType: 'share_link',
    });
  });

  it('returns total count', async () => {
    mockQueryDB
      .mockResolvedValueOnce([{ cnt: 42 }])
      .mockResolvedValueOnce([]);
    const req = new Request('http://localhost/api/canvas/c1/audit-log', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; entries: unknown[]; total: number };
    expect(data.total).toBe(42);
  });

  it('respects limit parameter', async () => {
    const req = new Request('http://localhost/api/canvas/c1/audit-log?limit=1', {
      headers: { Authorization: 'Bearer test' },
    });
    await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    // Count calls: first is count query, second is data query
    expect(mockQueryDB).toHaveBeenCalledTimes(2);
    const dataCall = mockQueryDB.mock.calls[1];
    expect(dataCall[2]).toContain(1); // limit param
  });

  it('respects offset parameter', async () => {
    const req = new Request('http://localhost/api/canvas/c1/audit-log?offset=10', {
      headers: { Authorization: 'Bearer test' },
    });
    await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    const dataCall = mockQueryDB.mock.calls[1];
    expect(dataCall[2]).toContain(10); // offset param
  });

  it('filters by user_id', async () => {
    const req = new Request('http://localhost/api/canvas/c1/audit-log?user_id=u1', {
      headers: { Authorization: 'Bearer test' },
    });
    await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    const dataCall = mockQueryDB.mock.calls[0]; // count query
    expect(dataCall[1]).toContain('user_id = ?');
    expect(dataCall[2]).toContain('u1');
  });

  it('filters by action', async () => {
    const req = new Request('http://localhost/api/canvas/c1/audit-log?action=create', {
      headers: { Authorization: 'Bearer test' },
    });
    await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    const dataCall = mockQueryDB.mock.calls[0]; // count query
    expect(dataCall[1]).toContain('action = ?');
    expect(dataCall[2]).toContain('create');
  });

  it('filters by time range (from/to)', async () => {
    const req = new Request(
      'http://localhost/api/canvas/c1/audit-log?from=2026-06-01T00:00:00Z&to=2026-06-30T23:59:59Z',
      { headers: { Authorization: 'Bearer test' } }
    );
    await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    const dataCall = mockQueryDB.mock.calls[0]; // count query
    expect(dataCall[1]).toContain('created_at >= ?');
    expect(dataCall[1]).toContain('created_at <= ?');
    expect(dataCall[2]).toContain('2026-06-01T00:00:00Z');
    expect(dataCall[2]).toContain('2026-06-30T23:59:59Z');
  });

  it('returns 500 on DB error', async () => {
    mockQueryDB.mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost/api/canvas/c1/audit-log', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(500);
  });

  it('handles null details gracefully', async () => {
    mockQueryDB
      .mockResolvedValueOnce([{ cnt: 1 }])
      .mockResolvedValueOnce([{
        id: 'a1',
        canvas_id: 'c1',
        user_id: 'u1',
        action: 'update',
        entity_type: 'canvas',
        entity_id: null,
        details: null,
        created_at: '2026-06-13T10:00:00Z',
      }]);
    const req = new Request('http://localhost/api/canvas/c1/audit-log', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; entries: unknown[] };
    expect(data.entries[0]).toMatchObject({
      details: null,
      entityId: null,
    });
  });

  it('limits max to 200', async () => {
    const req = new Request('http://localhost/api/canvas/c1/audit-log?limit=500', {
      headers: { Authorization: 'Bearer test' },
    });
    await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    const dataCall = mockQueryDB.mock.calls[1];
    expect(dataCall[2]).toContain(200); // max limit
  });
});
