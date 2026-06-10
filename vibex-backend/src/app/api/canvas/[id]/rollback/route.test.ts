/**
 * route.test.ts — S85-E4: Version Rollback API
 *
 * Tests:
 * 1. POST missing snapshotId → 400
 * 2. POST missing userId → 400
 * 3. POST success → 200 + { ok: true, eventId }
 * 4. Verify executeDB was called with correct SQL and params
 */
import { NextRequest } from 'next/server';

const mockExecuteDB = jest.fn();
const mockGenerateId = jest.fn();

jest.mock('@/lib/db', () => ({
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: (...args: unknown[]) => mockGenerateId(...args),
  safeError: jest.fn(),
}));

import { POST } from './route';

describe('POST /api/canvas/[id]/rollback — S85-E4 Version Rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockReturnValue('rollback-event-id-456');
  });

  async function callRollback(canvasId: string, body: Record<string, unknown>) {
    const request = new NextRequest(`http://localhost:3000/api/canvas/${canvasId}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return POST(request, { env: {} as never, params: Promise.resolve({ id: canvasId }) } as never);
  }

  it('returns 400 when snapshotId is missing', async () => {
    const response = await callRollback('canvas-1', {
      userId: 'user-1',
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('snapshotId');
  });

  it('returns 400 when userId is missing', async () => {
    const response = await callRollback('canvas-1', {
      snapshotId: 'snap-123',
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('userId');
  });

  it('returns 200 with ok:true and eventId on success', async () => {
    mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    const response = await callRollback('canvas-rollback-test', {
      snapshotId: 'snap-abc',
      snapshotName: 'My Snapshot',
      userId: 'user-42',
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.eventId).toBe('rollback-event-id-456');
  });

  it('calls executeDB with correct SQL and params', async () => {
    mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    await callRollback('canvas-rollback-xyz', {
      snapshotId: 'snap-feature',
      snapshotName: 'Feature v2',
      userId: 'user-77',
    });

    expect(mockExecuteDB).toHaveBeenCalledTimes(1);
    const [env, sql, params] = mockExecuteDB.mock.calls[0];
    expect(env).toBeDefined();
    expect(sql).toContain('INSERT INTO rollback_events');
    expect(sql).toContain('canvas_id');
    expect(sql).toContain('snapshot_id');
    expect(sql).toContain('snapshot_name');
    expect(sql).toContain('user_id');
    expect(params).toEqual([
      'rollback-event-id-456',
      'canvas-rollback-xyz',
      'snap-feature',
      'Feature v2',
      'user-77',
    ]);
  });

  it('sets snapshotName to null when not provided', async () => {
    mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    await callRollback('canvas-1', {
      snapshotId: 'snap-123',
      userId: 'user-1',
    });

    const params = mockExecuteDB.mock.calls[0][2];
    expect(params[3]).toBeNull();
  });

  it('calls generateId once on success', async () => {
    mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    await callRollback('canvas-1', {
      snapshotId: 'snap-123',
      userId: 'user-1',
    });

    expect(mockGenerateId).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when executeDB throws', async () => {
    mockExecuteDB.mockRejectedValueOnce(new Error('DB error'));

    const response = await callRollback('canvas-1', {
      snapshotId: 'snap-123',
      userId: 'user-1',
    });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Internal server error');
  });

  it('returns 400 when both snapshotId and userId are missing', async () => {
    const response = await callRollback('canvas-1', {});
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('snapshotId');
    expect(data.error).toContain('userId');
  });
});
