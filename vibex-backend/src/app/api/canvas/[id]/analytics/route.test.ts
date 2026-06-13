/**
 * route.test.ts — /api/canvas/[id]/analytics Jest Tests
 * Sprint95 E1: Canvas Analytics Dashboard
 *
 * Tests:
 * 1. GET without auth → 401 Unauthorized
 * 2. GET with auth, 7d range → returns analytics
 * 3. GET with auth, 30d range → returns analytics
 * 4. GET with auth, 90d range → returns analytics
 * 5. GET with empty canvas → all zeros
 * 6. GET with all-zero fields → handles zero counts gracefully
 * 7. GET returns 500 on DB error
 */

const mockQueryDB = jest.fn();

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  generateId: () => 'audit-001',
  Env: {},
}));

jest.mock('@/lib/logger/safeError', () => ({
  safeError: (...args: unknown[]) => {
    console.error('[safeError]', ...args);
  },
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn((request: Request) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return { success: false as const, user: undefined };
    return { success: true as const, user: { userId: 'user-001', name: 'Test', email: 'test@test.com' } };
  }),
}));

import { GET } from './route';

describe('GET /api/canvas/[id]/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: return empty arrays for all queries
    mockQueryDB.mockResolvedValue([]);
  });

  const mockTrendRows = [
    { day: '2026-06-07', views: '5', edits: '2' },
    { day: '2026-06-08', views: '3', edits: '1' },
    { day: '2026-06-09', views: '7', edits: '3' },
    { day: '2026-06-10', views: '2', edits: '0' },
    { day: '2026-06-11', views: '4', edits: '1' },
    { day: '2026-06-12', views: '6', edits: '2' },
    { day: '2026-06-13', views: '8', edits: '3' },
  ];

  const setupMock = () => {
    mockQueryDB
      // views today
      .mockResolvedValueOnce([{ cnt: 12 }])
      // views week
      .mockResolvedValueOnce([{ cnt: 35 }])
      // views month
      .mockResolvedValueOnce([{ cnt: 120 }])
      // editCount
      .mockResolvedValueOnce([{ cnt: 8 }])
      // uniqueUsers
      .mockResolvedValueOnce([{ cnt: 5 }])
      // shareCount
      .mockResolvedValueOnce([{ cnt: 2 }])
      // exportCount
      .mockResolvedValueOnce([{ cnt: 1 }])
      // dailyTrend
      .mockResolvedValueOnce(mockTrendRows);
  };

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/canvas/c1/analytics');
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(401);
  });

  it('returns analytics for authenticated user with 7d range', async () => {
    setupMock();
    const req = new Request('http://localhost/api/canvas/c1/analytics?range=7d', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; views: { today: number; week: number; month: number }; editCount: number; uniqueUsers: number; shareCount: number; exportCount: number; dailyTrend: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.views.today).toBe(12);
    expect(data.views.week).toBe(35);
    expect(data.views.month).toBe(120);
    expect(data.editCount).toBe(8);
    expect(data.uniqueUsers).toBe(5);
    expect(data.shareCount).toBe(2);
    expect(data.exportCount).toBe(1);
    expect(data.dailyTrend).toHaveLength(7);
  });

  it('returns analytics for authenticated user with 30d range', async () => {
    mockQueryDB
      .mockResolvedValueOnce([{ cnt: 5 }])
      .mockResolvedValueOnce([{ cnt: 20 }])
      .mockResolvedValueOnce([{ cnt: 80 }])
      .mockResolvedValueOnce([{ cnt: 15 }])
      .mockResolvedValueOnce([{ cnt: 10 }])
      .mockResolvedValueOnce([{ cnt: 3 }])
      .mockResolvedValueOnce([{ cnt: 2 }])
      .mockResolvedValueOnce([]); // empty trend for 30d

    const req = new Request('http://localhost/api/canvas/c1/analytics?range=30d', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; views: { today: number; week: number; month: number }; editCount: number; uniqueUsers: number; shareCount: number; exportCount: number; dailyTrend: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.views.today).toBe(5);
    expect(data.editCount).toBe(15);
    expect(data.dailyTrend).toHaveLength(30);
  });

  it('returns analytics for authenticated user with 90d range', async () => {
    mockQueryDB
      .mockResolvedValueOnce([{ cnt: 3 }])
      .mockResolvedValueOnce([{ cnt: 10 }])
      .mockResolvedValueOnce([{ cnt: 40 }])
      .mockResolvedValueOnce([{ cnt: 5 }])
      .mockResolvedValueOnce([{ cnt: 3 }])
      .mockResolvedValueOnce([{ cnt: 1 }])
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([]); // empty trend for 90d

    const req = new Request('http://localhost/api/canvas/c1/analytics?range=90d', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; views: { today: number; week: number; month: number }; editCount: number; uniqueUsers: number; shareCount: number; exportCount: number; dailyTrend: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.dailyTrend).toHaveLength(90);
  });

  it('returns all zeros for empty canvas', async () => {
    // All queries return empty arrays
    mockQueryDB.mockResolvedValue([]);
    const req = new Request('http://localhost/api/canvas/c1/analytics', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; views: { today: number; week: number; month: number }; editCount: number; uniqueUsers: number; shareCount: number; exportCount: number; dailyTrend: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.views.today).toBe(0);
    expect(data.views.week).toBe(0);
    expect(data.views.month).toBe(0);
    expect(data.editCount).toBe(0);
    expect(data.uniqueUsers).toBe(0);
    expect(data.shareCount).toBe(0);
    expect(data.exportCount).toBe(0);
    expect(data.dailyTrend).toHaveLength(7);
    expect(data.dailyTrend.every((d: any) => d.views === 0 && d.edits === 0)).toBe(true);
  });

  it('handles all-zero counts gracefully', async () => {
    mockQueryDB
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([]);

    const req = new Request('http://localhost/api/canvas/c1/analytics', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; views: { today: number; week: number; month: number } };
    expect(data.views.today).toBe(0);
    expect(data.views.week).toBe(0);
    expect(data.views.month).toBe(0);
  });

  it('returns 500 on DB error', async () => {
    mockQueryDB.mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost/api/canvas/c1/analytics', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(500);
  });
});
