/**
 * route.test.ts — /api/canvas/stats Jest Tests
 * S89-E1: Canvas Analytics Dashboard
 *
 * Tests:
 * 1. GET without auth → 401 Unauthorized
 * 2. GET with auth (no canvasId) → returns all canvas stats
 * 3. GET with auth + canvasId → returns single canvas stats
 */
import { describe, it, expect, beforeEach } from 'jest';

const mockQueryDB = jest.fn();

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
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

describe('GET /api/canvas/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryDB.mockResolvedValue([
      {
        canvas_id: 'c1',
        name: 'Test Canvas',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-06-10T00:00:00Z',
        collaborator_count: 3,
      },
      {
        canvas_id: 'c2',
        name: 'Another Canvas',
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-11T00:00:00Z',
        collaborator_count: 1,
      },
    ]);
  });

  it('returns 401 without auth', async () => {
    const { GET } = await import('../route');
    const req = new Request('http://localhost/api/canvas/stats');
    const res = await GET(req, { env: {} as any });
    expect(res.status).toBe(401);
  });

  it('returns canvas stats for authenticated user', async () => {
    const { GET } = await import('../route');
    const req = new Request('http://localhost/api/canvas/stats', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; stats: unknown[] };
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.stats)).toBe(true);
    expect(data.stats).toHaveLength(2);
    expect(data.stats[0]).toMatchObject({
      canvasId: 'c1',
      name: 'Test Canvas',
      collaboratorCount: 3,
    });
  });

  it('filters by canvasId when provided', async () => {
    const { GET } = await import('../route');
    const req = new Request('http://localhost/api/canvas/stats?canvasId=c1', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; stats: unknown[] };
    expect(data.ok).toBe(true);
    expect(mockQueryDB).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('WHERE id = ?'),
      expect.arrayContaining(['c1', 'user-001'])
    );
  });

  it('returns 500 on DB error', async () => {
    mockQueryDB.mockRejectedValue(new Error('DB error'));
    const { GET } = await import('../route');
    const req = new Request('http://localhost/api/canvas/stats', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { env: {} as any });
    expect(res.status).toBe(500);
    const data = (await res.json()) as { ok: boolean; error: string };
    expect(data.ok).toBe(false);
    expect(data.error).toBe('Internal server error');
  });
});
