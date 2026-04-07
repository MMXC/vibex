/**
 * route.test.ts — E4-SyncProtocol: Canvas Snapshots API + Optimistic Locking
 *
 * Tests:
 * 1. GET: list snapshots, missing projectId
 * 2. POST: optimistic lock success (no version → v1)
 * 3. POST: version conflict 409 (version = server max → stale)
 * 4. POST: version conflict 409 (version < server max)
 * 5. POST: successful save with valid projectId
 * 6. Error handling: 500 on DB errors
 */
import { NextRequest } from 'next/server';

// Mock DB functions
const mockQueryDB = jest.fn();
const mockQueryOne = jest.fn();
const mockExecuteDB = jest.fn();
const mockGenerateId = jest.fn();

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: (...args: unknown[]) => mockGenerateId(...args),
}));

// Import handlers after mocks are set up
import { GET as listSnapshots, POST as createSnapshot } from './route';

describe('GET /api/canvas/snapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when projectId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/canvas/snapshots');
    const response = await listSnapshots(request, { env: {} as never });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('projectId');
  });

  it('returns list of snapshots', async () => {
    mockQueryDB
      .mockResolvedValueOnce([
        { id: 'snap-1', projectId: 'proj-1', version: 2, name: 'Auto', description: 'auto', data: '{"contexts":[],"flows":[],"components":[]}', createdAt: '2026-04-01T00:00:00Z', createdBy: null, isAutoSave: 1 },
        { id: 'snap-2', projectId: 'proj-1', version: 1, name: 'Manual', description: 'manual', data: '{"contexts":[],"flows":[],"components":[]}', createdAt: '2026-03-31T00:00:00Z', createdBy: null, isAutoSave: 0 },
      ])
      .mockResolvedValueOnce([{ cnt: 2 }]);

    const request = new NextRequest('http://localhost:3000/api/canvas/snapshots?projectId=proj-1');
    const response = await listSnapshots(request, { env: {} as never });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.snapshots).toHaveLength(2);
    expect(data.snapshots[0].version).toBe(2);
    expect(data.snapshots[0].isAutoSave).toBe(true);
    expect(data.total).toBe(2);
  });
});

describe('POST /api/canvas/snapshots — Optimistic Locking (E4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockReturnValue('snap-new-123');
  });

  it('creates first snapshot when no version provided (version 1)', async () => {
    // queryDB gets max version (returns [{ maxVersion: null }] = 0)
    mockQueryDB.mockResolvedValueOnce([{ maxVersion: null }]);
    // executeDB inserts the row
    mockExecuteDB.mockResolvedValueOnce({});
    // queryOne gets the created row
    mockQueryOne.mockResolvedValueOnce({
      id: 'snap-new-123',
      projectId: 'proj-1',
      version: 1,
      name: 'Auto',
      description: 'auto',
      data: '{"contexts":[],"flows":[],"components":[]}',
      createdAt: '2026-04-01T00:00:00Z',
      createdBy: null,
      isAutoSave: 1,
    });

    const body = { projectId: 'proj-1', label: 'Auto', trigger: 'auto', contextNodes: [], flowNodes: [], componentNodes: [] };
    const request = new NextRequest('http://localhost:3000/api/canvas/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await createSnapshot(request, { env: {} as never });
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.version).toBe(1);
    expect(data.snapshot.version).toBe(1);
    expect(data.snapshot.snapshotId).toBe('snap-new-123');
  });

  it('returns 409 when client version matches server max (stale snapshot loaded)', async () => {
    // Server has max version 1, client sends version 1 (same as server → conflict)
    mockQueryDB.mockResolvedValueOnce([{ maxVersion: 1 }]);
    mockQueryOne.mockResolvedValueOnce({
      id: 'snap-latest',
      projectId: 'proj-1',
      version: 1,
      name: 'Auto',
      description: 'auto',
      data: '{"contexts":[],"flows":[],"components":[]}',
      createdAt: '2026-04-01T00:00:00Z',
      createdBy: null,
      isAutoSave: 1,
    });

    const body = { projectId: 'proj-1', version: 1, label: 'Auto', trigger: 'auto', contextNodes: [], flowNodes: [], componentNodes: [] };
    const request = new NextRequest('http://localhost:3000/api/canvas/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await createSnapshot(request, { env: {} as never });
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe('VERSION_CONFLICT');
    expect(data.serverVersion).toBe(1);
    expect(data.clientVersion).toBe(1);
    expect(data.serverSnapshot).toBeDefined();
    expect(data.serverSnapshot.version).toBe(1);
  });

  it('returns 409 when client version is behind (version < server max)', async () => {
    // Server has max version 3, client sends version 1 (behind → conflict)
    mockQueryDB.mockResolvedValueOnce([{ maxVersion: 3 }]);
    mockQueryOne.mockResolvedValueOnce({
      id: 'snap-server-latest',
      projectId: 'proj-1',
      version: 3,
      name: 'Auto',
      description: 'auto',
      data: '{"contexts":[{"id":"c1"}],"flows":[],"components":[]}',
      createdAt: '2026-04-01T12:00:00Z',
      createdBy: null,
      isAutoSave: 1,
    });

    const body = { projectId: 'proj-1', version: 1, label: 'Auto', trigger: 'auto', contextNodes: [{ id: 'c2' }], flowNodes: [], componentNodes: [] };
    const request = new NextRequest('http://localhost:3000/api/canvas/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await createSnapshot(request, { env: {} as never });
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('VERSION_CONFLICT');
    expect(data.serverVersion).toBe(3);
    expect(data.clientVersion).toBe(1);
    expect(data.serverSnapshot).toBeDefined();
    expect(data.serverSnapshot.version).toBe(3);
    expect(data.serverSnapshot.snapshotId).toBe('snap-server-latest');
    expect(data.serverSnapshot.data.contexts).toEqual([{ id: 'c1' }]);
  });

  it('creates snapshot with valid projectId', async () => {
    // queryDB gets max version = null (no existing snapshots)
    mockQueryDB.mockResolvedValueOnce([{ maxVersion: null }]);
    // executeDB inserts the row
    mockExecuteDB.mockResolvedValueOnce({});
    // queryOne gets the created row
    mockQueryOne.mockResolvedValueOnce({
      id: 'snap-new-123',
      projectId: 'proj-1',
      version: 1,
      name: 'Auto',
      description: 'auto',
      data: '{"contexts":[],"flows":[],"components":[]}',
      createdAt: '2026-04-01T00:00:00Z',
      createdBy: null,
      isAutoSave: 1,
    });

    const body = { projectId: 'proj-1', label: 'Auto', trigger: 'auto', contextNodes: [], flowNodes: [], componentNodes: [] };
    const request = new NextRequest('http://localhost:3000/api/canvas/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await createSnapshot(request, { env: {} as never });
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 on database error during list', async () => {
    mockQueryDB.mockRejectedValueOnce(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/canvas/snapshots?projectId=proj-1');
    const response = await listSnapshots(request, { env: {} as never });
    expect(response.status).toBe(500);
  });

  it('returns 500 on database error during create', async () => {
    mockQueryDB.mockRejectedValueOnce(new Error('DB error'));

    const body = { projectId: 'proj-1', label: 'Auto', trigger: 'auto', contextNodes: [], flowNodes: [], componentNodes: [] };
    const request = new NextRequest('http://localhost:3000/api/canvas/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await createSnapshot(request, { env: {} as never });
    expect(response.status).toBe(500);
  });
});
