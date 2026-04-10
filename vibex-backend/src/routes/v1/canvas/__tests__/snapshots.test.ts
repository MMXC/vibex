/**
/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 */
 * Tests for Canvas Snapshots API - E2
 *
 * Verifies:
 * - GET  /               — list snapshots with projectId filter, pagination, empty result
 * - POST /               — create snapshot, validation, version conflict
 * - GET  /:id            — get single snapshot, 404
 * - POST /:id/restore    — restore to snapshot, 404
 * - GET  /latest         — latest version info, 0 when no snapshots
 */

const mockQueryDB = jest.fn();
const mockQueryOne = jest.fn();
const mockExecuteDB = jest.fn();
const mockGenerateId = jest.fn(() => 'snapshot-test-id');

jest.mock('@/lib/db', () => ({
      queryDB: (...args: unknown[]) => mockQueryDB(...args),
      queryOne: (...args: unknown[]) => mockQueryOne(...args),
      executeDB: (...args: unknown[]) => mockExecuteDB(...args),
      generateId: () => mockGenerateId(),
}));

// Import route AFTER mocks
const snapshots = require('../snapshots').default;

const buildApp = () => {
      const { Hono } = require('hono');
      const app = new Hono();
      app.route('/', snapshots);
      return app;
};

const mockEnv = { DB: {}, JWT_SECRET: 'test' };

// ─── Test data ─────────────────────────────────────────────────────────────
const mockSnapshotRow = {
      id: 'snap-1',
      projectId: 'proj-1',
      version: 3,
      name: 'Test Snapshot',
      description: 'manual',
      data: JSON.stringify({
            contexts: [{ id: 'ctx-1' }],
            flows: [{ id: 'flow-1' }],
            components: [{ id: 'comp-1' }],
            _trigger: 'manual',
            _label: 'Test Snapshot',
      }),
      createdAt: '2026-04-05T10:00:00Z',
      createdBy: null,
      isAutoSave: 0,
};

const mockSnapshotRow2 = {
      id: 'snap-2',
      projectId: 'proj-1',
      version: 2,
      name: 'Earlier Snapshot',
      description: 'auto',
      data: JSON.stringify({
            contexts: [],
            flows: [],
            components: [],
            _trigger: 'auto',
            _label: 'Earlier Snapshot',
      }),
      createdAt: '2026-04-05T09:00:00Z',
      createdBy: null,
      isAutoSave: 1,
};

// ─── Tests ───────────────────────────────────────────────────────────────
describe('Snapshots API - E2 endpoints', () => {
      let app: ReturnType<typeof buildApp>;

      beforeEach(() => {
            jest.clearAllMocks();
            app = buildApp();
      });

      // ── GET / ────────────────────────────────────────────────────────────────

      describe('GET /', () => {
            it('returns 400 when projectId is missing', async () => {
                  const req = new Request('http://localhost/');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(400);
                  expect(json.error).toContain('projectId');
            });

            it('returns paginated list of snapshots with projectId filter', async () => {
                  mockQueryDB.mockImplementation((_env: unknown, sql: string) => {
                        if (sql.includes('COUNT')) return Promise.resolve([{ cnt: 2 }]);
                        return Promise.resolve([mockSnapshotRow, mockSnapshotRow2]);
                  });

                  const req = new Request('http://localhost/?projectId=proj-1');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(200);
                  expect(json.snapshots).toHaveLength(2);
                  expect(json.total).toBe(2);
                  expect(json.limit).toBe(50);
                  expect(json.offset).toBe(0);
                  expect(json.snapshots[0].id).toBe('snap-1');
                  expect(json.snapshots[0].data.contexts).toEqual([{ id: 'ctx-1' }]);
                  expect(json.snapshots[0].isAutoSave).toBe(false);
            });

            it('respects pagination limit and offset', async () => {
                  mockQueryDB.mockImplementation((_env: unknown, sql: string) => {
                        if (sql.includes('COUNT')) return Promise.resolve([{ cnt: 100 }]);
                        return Promise.resolve([mockSnapshotRow]);
                  });

                  const req = new Request('http://localhost/?projectId=proj-1&limit=1&offset=0');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(200);
                  expect(json.snapshots).toHaveLength(1);
                  expect(json.limit).toBe(1);
                  expect(json.offset).toBe(0);
            });

            it('returns empty array when no snapshots exist', async () => {
                  mockQueryDB.mockImplementation((_env: unknown, sql: string) => {
                        if (sql.includes('COUNT')) return Promise.resolve([{ cnt: 0 }]);
                        return Promise.resolve([]);
                  });

                  const req = new Request('http://localhost/?projectId=proj-empty');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(200);
                  expect(json.snapshots).toEqual([]);
                  expect(json.total).toBe(0);
            });
      });

      // ── POST / ───────────────────────────────────────────────────────────────

      describe('POST /', () => {
            it('creates a snapshot with valid data', async () => {
                  mockQueryDB.mockResolvedValueOnce([{ maxVersion: 2 }]);
                  mockExecuteDB.mockResolvedValueOnce({ success: true });
                  mockQueryOne.mockResolvedValueOnce({
                        ...mockSnapshotRow,
                        id: 'snapshot-test-id',
                        version: 3,
                  });

                  const body = {
                        projectId: 'proj-1',
                        label: 'My Snapshot',
                        trigger: 'manual',
                        contextNodes: [{ id: 'ctx-1' }],
                        flowNodes: [{ id: 'flow-1' }],
                        componentNodes: [{ id: 'comp-1' }],
                  };

                  const req = new Request('http://localhost/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                  });
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(201);
                  expect(json.success).toBe(true);
                  expect(json.snapshot.snapshotId).toBe('snapshot-test-id');
                  expect(json.snapshot.version).toBe(3);
                  expect(json.snapshot.contextNodes).toEqual([{ id: 'ctx-1' }]);
            });

            it('creates snapshot with isAutoSave flag', async () => {
                  mockQueryDB.mockResolvedValueOnce([{ maxVersion: 0 }]);
                  mockExecuteDB.mockResolvedValueOnce({ success: true });
                  mockQueryOne.mockResolvedValueOnce({
                        ...mockSnapshotRow,
                        id: 'snapshot-test-id',
                        version: 1,
                        isAutoSave: 1,
                        data: JSON.stringify({ contexts: [], flows: [], components: [] }),
                  });

                  const req = new Request('http://localhost/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId: 'proj-1', isAutoSave: true }),
                  });
                  const res = await app.fetch(req, mockEnv);

                  expect(res.status).toBe(201);
            });

            it('returns 400 when projectId is missing', async () => {
                  const req = new Request('http://localhost/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ label: 'No Project' }),
                  });
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(400);
                  expect(json.error).toContain('projectId');
            });

            it('returns 400 for invalid body', async () => {
                  const req = new Request('http://localhost/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId: 'proj-1', trigger: 'invalid_trigger' }),
                  });
                  const res = await app.fetch(req, mockEnv);

                  expect(res.status).toBe(400);
            });

            it('returns 409 version conflict when client version is stale', async () => {
                  mockQueryDB.mockResolvedValueOnce([{ maxVersion: 5 }]); // server has version 5
                  mockQueryOne.mockResolvedValueOnce({
                        ...mockSnapshotRow,
                        version: 5,
                        data: JSON.stringify({ contexts: [], flows: [], components: [] }),
                  });

                  const req = new Request('http://localhost/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId: 'proj-1', version: 3 }), // client only has version 3
                  });
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(409);
                  expect(json.success).toBe(false);
                  expect(json.error).toBe('VERSION_CONFLICT');
                  expect(json.serverVersion).toBe(5);
                  expect(json.clientVersion).toBe(3);
            });

            it('allows save when client version is ahead (no conflict)', async () => {
                  // client version 1, server has 1 → no conflict, proceed normally
                  mockQueryDB.mockResolvedValueOnce([{ maxVersion: 1 }]);
                  mockExecuteDB.mockResolvedValueOnce({ success: true });
                  mockQueryOne.mockResolvedValueOnce({
                        ...mockSnapshotRow,
                        id: 'snapshot-test-id',
                        version: 2,
                        data: JSON.stringify({ contexts: [], flows: [], components: [] }),
                  });

                  const req = new Request('http://localhost/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId: 'proj-1', version: 1 }),
                  });
                  const res = await app.fetch(req, mockEnv);

                  expect(res.status).toBe(201);
                  expect(mockExecuteDB).toHaveBeenCalled();
            });
      });

      // ── GET /:id ─────────────────────────────────────────────────────────────

      describe('GET /:id', () => {
            it('returns a snapshot by id', async () => {
                  mockQueryOne.mockResolvedValueOnce(mockSnapshotRow);

                  const req = new Request('http://localhost/snap-1');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(200);
                  expect(json.success).toBe(true);
                  expect(json.snapshot.snapshotId).toBe('snap-1');
                  expect(json.snapshot.version).toBe(3);
                  expect(json.snapshot.contextNodes).toEqual([{ id: 'ctx-1' }]);
                  expect(json.snapshot.flowNodes).toEqual([{ id: 'flow-1' }]);
                  expect(json.snapshot.componentNodes).toEqual([{ id: 'comp-1' }]);
            });

            it('returns 404 for non-existent snapshot', async () => {
                  mockQueryOne.mockResolvedValueOnce(null);

                  const req = new Request('http://localhost/nonexistent-id');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(404);
                  expect(json.error).toBe('Snapshot not found');
            });
      });

      // ── POST /:id/restore ────────────────────────────────────────────────────

      describe('POST /:id/restore', () => {
            it('restores an existing snapshot', async () => {
                  // 1. queryOne for target snapshot
                  mockQueryOne.mockResolvedValueOnce(mockSnapshotRow);
                  // 2. queryDB for current max version
                  mockQueryDB.mockResolvedValueOnce([{ maxVersion: 5 }]);
                  // 3. queryOne for latest snapshot (for backup)
                  mockQueryOne.mockResolvedValueOnce({
                        ...mockSnapshotRow,
                        id: 'snap-latest',
                        version: 5,
                        data: JSON.stringify({ contexts: [{ id: 'new-ctx' }], flows: [], components: [] }),
                  });
                  // 4. executeDB for backup
                  mockExecuteDB.mockResolvedValueOnce({ success: true });
                  // 5. executeDB for restore
                  mockExecuteDB.mockResolvedValueOnce({ success: true });
                  // 6. queryOne for created restore snapshot
                  mockQueryOne.mockResolvedValueOnce({
                        ...mockSnapshotRow,
                        id: 'snapshot-test-id',
                        version: 6,
                        data: mockSnapshotRow.data,
                  });

                  const req = new Request('http://localhost/snap-1/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                  });
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(201);
                  expect(json.success).toBe(true);
                  expect(json.contextNodes).toEqual([{ id: 'ctx-1' }]);
                  expect(json.flowNodes).toEqual([{ id: 'flow-1' }]);
                  expect(json.componentNodes).toEqual([{ id: 'comp-1' }]);
            });

            it('creates a backup snapshot before restoring', async () => {
                  mockQueryOne
                        .mockResolvedValueOnce(mockSnapshotRow) // target
                        .mockResolvedValueOnce({ ...mockSnapshotRow, version: 5 }); // latest for backup
                  mockQueryDB.mockResolvedValueOnce([{ maxVersion: 5 }]);
                  mockExecuteDB
                        .mockResolvedValueOnce({ success: true }) // backup insert
                        .mockResolvedValueOnce({ success: true }); // restore insert
                  mockQueryOne.mockResolvedValueOnce({ ...mockSnapshotRow, id: 'snapshot-test-id', version: 6 });

                  const req = new Request('http://localhost/snap-1/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                  });
                  const res = await app.fetch(req, mockEnv);

                  expect(res.status).toBe(201);
                  // Backup is inserted before restore
                  expect(mockExecuteDB).toHaveBeenCalledTimes(2);
            });

            it('returns 404 when snapshot to restore does not exist', async () => {
                  mockQueryOne.mockResolvedValueOnce(null);

                  const req = new Request('http://localhost/nonexistent-id/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                  });
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(404);
                  expect(json.error).toBe('Snapshot not found');
            });
      });

      // ── GET /latest ──────────────────────────────────────────────────────────

      describe('GET /latest', () => {
            it('returns latest version info for a project', async () => {
                  mockQueryOne.mockResolvedValueOnce({
                        version: 7,
                        createdAt: '2026-04-05T14:00:00Z',
                  });

                  const req = new Request('http://localhost/latest?projectId=proj-1');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(200);
                  expect(json.success).toBe(true);
                  expect(json.latestVersion).toBe(7);
                  expect(json.updatedAt).toBe('2026-04-05T14:00:00Z');
            });

            it('returns 0 when no snapshots exist for project', async () => {
                  mockQueryOne.mockResolvedValueOnce(null);

                  const req = new Request('http://localhost/latest?projectId=proj-new');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(200);
                  expect(json.success).toBe(true);
                  expect(json.latestVersion).toBe(0);
                  expect(json.updatedAt).toBe(null);
            });

            it('returns 400 when projectId is missing', async () => {
                  const req = new Request('http://localhost/latest');
                  const res = await app.fetch(req, mockEnv);
                  const json = await res.json();

                  expect(res.status).toBe(400);
                  expect(json.error).toContain('projectId');
            });
      });
});
