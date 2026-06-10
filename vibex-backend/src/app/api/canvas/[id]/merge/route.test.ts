/**
 * route.test.ts — S85-E4: Branch Merge API
 *
 * Tests:
 * 1. POST missing sourceBranch → 400
 * 2. POST missing targetBranch → 400
 * 3. POST source === target → 400
 * 4. POST success → 200 + { ok: true, eventId }
 * 5. Verify executeDB called with correct SQL and params
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

describe('POST /api/canvas/[id]/merge — S85-E4 Branch Merge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockReturnValue('mock-event-id-123');
  });

  async function callMerge(canvasId: string, body: Record<string, unknown>) {
    const request = new NextRequest(`http://localhost:3000/api/canvas/${canvasId}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return POST(request, { env: {} as never, params: Promise.resolve({ id: canvasId }) } as never);
  }

  it('returns 400 when sourceBranch is missing', async () => {
    const response = await callMerge('canvas-1', {
      targetBranch: 'main',
      userId: 'user-1',
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('sourceBranch');
  });

  it('returns 400 when targetBranch is missing', async () => {
    const response = await callMerge('canvas-1', {
      sourceBranch: 'feature-1',
      userId: 'user-1',
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('targetBranch');
  });

  it('returns 400 when sourceBranch === targetBranch', async () => {
    const response = await callMerge('canvas-1', {
      sourceBranch: 'main',
      targetBranch: 'main',
      userId: 'user-1',
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('cannot be the same');
  });

  it('returns 200 with ok:true and eventId on success', async () => {
    mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    const response = await callMerge('canvas-abc', {
      sourceBranch: 'feature-1',
      targetBranch: 'main',
      userId: 'user-42',
      snapshotCount: 3,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.eventId).toBe('mock-event-id-123');
  });

  it('calls executeDB with correct SQL and params', async () => {
    mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    await callMerge('canvas-xyz', {
      sourceBranch: 'feature-branch',
      targetBranch: 'main',
      userId: 'user-99',
      snapshotCount: 5,
    });

    expect(mockExecuteDB).toHaveBeenCalledTimes(1);
    const [env, sql, params] = mockExecuteDB.mock.calls[0];
    expect(env).toBeDefined();
    expect(sql).toContain('INSERT INTO branch_events');
    expect(sql).toContain('canvas_id');
    expect(sql).toContain('source_branch');
    expect(sql).toContain('target_branch');
    expect(sql).toContain('user_id');
    expect(sql).toContain('snapshot_count');
    expect(params).toEqual([
      'mock-event-id-123',
      'canvas-xyz',
      'feature-branch',
      'main',
      'user-99',
      5,
    ]);
  });

  it('calls generateId once on success', async () => {
    mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    await callMerge('canvas-1', {
      sourceBranch: 'feature-1',
      targetBranch: 'main',
      userId: 'user-1',
    });

    expect(mockGenerateId).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when executeDB throws', async () => {
    mockExecuteDB.mockRejectedValueOnce(new Error('DB error'));

    const response = await callMerge('canvas-1', {
      sourceBranch: 'feature-1',
      targetBranch: 'main',
      userId: 'user-1',
    });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Internal server error');
  });

  it('defaults snapshotCount to 0 when not provided', async () => {
    mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    await callMerge('canvas-1', {
      sourceBranch: 'feature-1',
      targetBranch: 'main',
      userId: 'user-1',
    });

    const params = mockExecuteDB.mock.calls[0][2];
    expect(params[5]).toBe(0);
  });
});
