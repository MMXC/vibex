/**
 * route.test.ts — /api/canvas/[id]/versions Jest Tests
 * Sprint93 E1: Canvas Version History
 *
 * Tests:
 * 1. GET without auth → 401 Unauthorized
 * 2. GET with auth → returns version list
 * 3. GET with empty versions → returns empty array
 * 4. POST without auth → 401 Unauthorized
 * 5. POST with auth and valid body → creates version
 * 6. POST with missing snapshotData → 400 Bad Request
 */

const mockQueryDB = jest.fn();
const mockExecuteDB = jest.fn();
const mockGenerateId = jest.fn(() => 'v-s93-001');

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
    return { success: true as const, user: { id: 'user-001', name: 'Test User' } };
  }),
}));

import { GET, POST } from './route';

describe('GET /api/canvas/[id]/versions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryDB.mockResolvedValue([
      {
        id: 'v-1',
        canvas_id: 'c1',
        version_number: 3,
        snapshot_data: JSON.stringify({ nodes: [], edges: [] }),
        description: 'Before refactor',
        created_by: 'user-001',
        created_at: 1718300000,
      },
      {
        id: 'v-2',
        canvas_id: 'c1',
        version_number: 2,
        snapshot_data: JSON.stringify({ nodes: [{ id: 'n1' }], edges: [] }),
        description: null,
        created_by: 'user-001',
        created_at: 1718200000,
      },
    ]);
  });

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/canvas/c1/versions');
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(401);
  });

  it('returns version list for authenticated user', async () => {
    const req = new Request('http://localhost/api/canvas/c1/versions', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; versions: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.versions).toHaveLength(2);
    expect(data.versions[0]).toMatchObject({
      id: 'v-1',
      canvasId: 'c1',
      versionNumber: 3,
    });
  });

  it('returns empty array when no versions exist', async () => {
    mockQueryDB.mockResolvedValue([]);
    const req = new Request('http://localhost/api/canvas/c1/versions', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; versions: unknown[] };
    expect(data.versions).toHaveLength(0);
  });
});

describe('POST /api/canvas/[id]/versions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // First call: MAX version query, Second call: INSERT
    mockQueryDB.mockResolvedValueOnce([{ max_version: 5 }]);
    mockExecuteDB.mockResolvedValueOnce({ success: true });
  });

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/canvas/c1/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotData: '{}' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(401);
  });

  it('creates version with valid body', async () => {
    const req = new Request('http://localhost/api/canvas/c1/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
      body: JSON.stringify({
        snapshotData: JSON.stringify({ nodes: [], edges: [] }),
        description: 'Initial snapshot',
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; version: unknown };
    expect(data.ok).toBe(true);
    expect(data.version).toMatchObject({
      canvasId: 'c1',
      versionNumber: 6,
      description: 'Initial snapshot',
    });
  });

  it('returns 400 when snapshotData is missing', async () => {
    const req = new Request('http://localhost/api/canvas/c1/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
      body: JSON.stringify({ description: 'No data' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(400);
  });

  it('auto-assigns version_number from MAX + 1', async () => {
    mockQueryDB.mockResolvedValueOnce([{ max_version: null }]);
    mockExecuteDB.mockResolvedValueOnce({ success: true });
    const req = new Request('http://localhost/api/canvas/c1/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
      body: JSON.stringify({ snapshotData: '{}' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }), env: {} as any });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; version: { versionNumber: number } };
    expect(data.version.versionNumber).toBe(1);
  });
});
