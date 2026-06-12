/**
 * route.test.ts — /api/canvas/[id]/versions/[versionId]/restore Jest Tests
 * Sprint93 E1: Canvas Version History
 *
 * Tests:
 * 1. PATCH without auth → 401 Unauthorized
 * 2. PATCH with valid version → returns version data
 * 3. PATCH with non-existent versionId → 404 Not Found
 */

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
    return { success: true as const, user: { id: 'user-001', name: 'Test User' } };
  }),
}));

import { PATCH } from './route';

describe('PATCH /api/canvas/[id]/versions/[versionId]/restore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryDB.mockResolvedValue([
      {
        id: 'v1',
        canvas_id: 'c1',
        version_number: 1,
        snapshot_data: JSON.stringify({ nodes: [], edges: [] }),
        description: 'First version',
        created_by: 'user-001',
        created_at: 1718200000,
      },
    ]);
  });

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/canvas/c1/versions/v1/restore', {
      method: 'PATCH',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'c1', versionId: 'v1' }),
      env: {} as any,
    });
    expect(res.status).toBe(401);
  });

  it('returns version data for valid version', async () => {
    const req = new Request('http://localhost/api/canvas/c1/versions/v1/restore', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer test' },
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'c1', versionId: 'v1' }),
      env: {} as any,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; version: unknown };
    expect(data.ok).toBe(true);
    expect(data.version).toMatchObject({
      id: 'v1',
      canvasId: 'c1',
      versionNumber: 1,
    });
  });

  it('returns 404 when version not found', async () => {
    mockQueryDB.mockResolvedValue([]);
    const req = new Request('http://localhost/api/canvas/c1/versions/v999/restore', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer test' },
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'c1', versionId: 'v999' }),
      env: {} as any,
    });
    expect(res.status).toBe(404);
    const data = (await res.json()) as { ok: boolean; error: string };
    expect(data.error).toBe('Version not found');
  });
});
