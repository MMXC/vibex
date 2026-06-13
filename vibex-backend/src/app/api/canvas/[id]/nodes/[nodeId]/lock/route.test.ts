/**
 * /api/canvas/[id]/nodes/[nodeId]/lock — Node Edit Lock API Jest Tests
 * Sprint95 E3: Node Edit Locking
 *
 * Tests:
 * 1. POST without auth → 401
 * 2. POST — acquires lock when no existing lock
 * 3. POST — returns acquired=false when locked by another
 * 4. POST — extends lock when re-acquiring own lock
 * 5. DELETE without auth → 401
 * 6. DELETE — releases own lock
 */

const mockExecuteDB = jest.fn();
const mockQueryDB = jest.fn();
const mockGenerateId = jest.fn();

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: () => mockGenerateId(),
  safeError: (e: unknown) => String(e),
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn((request: Request) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return { success: false as const, user: undefined };
    return { success: true as const, user: { userId: 'user-001', name: 'Test User', avatar: null } };
  }),
}));

import { POST, DELETE } from './route';

describe('Node Edit Lock API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockReturnValue('lock-001');
  });

  describe('POST — Acquire lock', () => {
    it('acquires lock when no existing lock', async () => {
      mockExecuteDB.mockResolvedValueOnce(undefined); // deleteExpiredLock
      mockQueryDB.mockResolvedValueOnce([]); // getExistingLock → no row
      mockExecuteDB.mockResolvedValueOnce({ meta: { changes: 1 } }); // insert

      const req = new Request('http://localhost/api/canvas/canvas-001/nodes/node-001/lock', {
        method: 'POST',
        headers: { Authorization: 'Bearer test' },
      });
      const res = await POST(req as unknown as import('next/server').NextRequest, {
        params: Promise.resolve({ id: 'canvas-001', nodeId: 'node-001' }),
        env: {},
      } as Parameters<typeof POST>[1]);

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.acquired).toBe(true);
      expect(json.locked_by).toBe('user-001');
      expect(typeof json.expires_at).toBe('number');
    });

    it('returns acquired=false when node is locked by another user', async () => {
      mockExecuteDB.mockResolvedValueOnce(undefined); // deleteExpiredLock
      mockQueryDB.mockResolvedValueOnce([{
        id: 'lock-other',
        canvas_id: 'canvas-001',
        node_id: 'node-001',
        user_id: 'user-other',
        user_name: 'Other User',
        avatar: null,
        expires_at: Date.now() + 30_000,
      }]);

      const req = new Request('http://localhost/api/canvas/canvas-001/nodes/node-001/lock', {
        method: 'POST',
        headers: { Authorization: 'Bearer test' },
      });
      const res = await POST(req as unknown as import('next/server').NextRequest, {
        params: Promise.resolve({ id: 'canvas-001', nodeId: 'node-001' }),
        env: {},
      } as Parameters<typeof POST>[1]);

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.acquired).toBe(false);
      expect(json.locked_by).toBe('user-other');
    });

    it('extends lock when re-acquiring own lock', async () => {
      mockExecuteDB.mockResolvedValueOnce(undefined); // deleteExpiredLock
      mockQueryDB.mockResolvedValueOnce([{
        id: 'lock-self',
        canvas_id: 'canvas-001',
        node_id: 'node-001',
        user_id: 'user-001',
        user_name: 'Test User',
        avatar: null,
        expires_at: Date.now() + 30_000,
      }]);
      mockExecuteDB.mockResolvedValueOnce({ meta: { changes: 1 } }); // update

      const req = new Request('http://localhost/api/canvas/canvas-001/nodes/node-001/lock', {
        method: 'POST',
        headers: { Authorization: 'Bearer test' },
      });
      const res = await POST(req as unknown as import('next/server').NextRequest, {
        params: Promise.resolve({ id: 'canvas-001', nodeId: 'node-001' }),
        env: {},
      } as Parameters<typeof POST>[1]);

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.acquired).toBe(true);
      expect(json.locked_by).toBe('user-001');
    });

    it('returns 401 when unauthenticated', async () => {
      const req = new Request('http://localhost/api/canvas/canvas-001/nodes/node-001/lock', { method: 'POST' });
      const res = await POST(req as unknown as import('next/server').NextRequest, {
        params: Promise.resolve({ id: 'canvas-001', nodeId: 'node-001' }),
        env: {},
      } as Parameters<typeof POST>[1]);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE — Release lock', () => {
    it('releases lock successfully', async () => {
      mockExecuteDB.mockResolvedValueOnce({ meta: { changes: 1 } });

      const req = new Request('http://localhost/api/canvas/canvas-001/nodes/node-001/lock', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test' },
      });
      const res = await DELETE(req as unknown as import('next/server').NextRequest, {
        params: Promise.resolve({ id: 'canvas-001', nodeId: 'node-001' }),
        env: {},
      } as Parameters<typeof DELETE>[1]);

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
    });

    it('returns 401 when unauthenticated', async () => {
      const req = new Request('http://localhost/api/canvas/canvas-001/nodes/node-001/lock', { method: 'DELETE' });
      const res = await DELETE(req as unknown as import('next/server').NextRequest, {
        params: Promise.resolve({ id: 'canvas-001', nodeId: 'node-001' }),
        env: {},
      } as Parameters<typeof DELETE>[1]);

      expect(res.status).toBe(401);
    });
  });
});
