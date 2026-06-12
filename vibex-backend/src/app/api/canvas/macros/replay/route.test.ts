/**
 * route.test.ts — /api/canvas/macros/replay Jest Tests
 * S92-E1: Canvas Workflow Automation
 *
 * Tests:
 * 1. POST without auth → 401
 * 2. POST without macroId → 400
 * 3. POST without canvasId → 400
 * 4. POST with non-existent macroId → 404
 * 5. POST with forbidden macroId (other user) → 403
 * 6. POST with valid macro → 200, resolved steps returned
 * 7. POST with params → params substituted in step data
 */

jest.mock('@/lib/logger/safeError', () => ({
  safeError: jest.fn(),
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn((request: Request) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return { success: false as const, user: undefined };
    return { success: true as const, user: { userId: 'user-001', name: 'Test User' } };
  }),
}));

const mockDB = {
  prepare: jest.fn().mockReturnThis(),
  bind: jest.fn().mockReturnThis(),
  first: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
};

const mockEnv = { DB: mockDB };

import { POST } from './route';

describe('POST /api/canvas/macros/replay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/canvas/macros/replay', {
      method: 'POST',
      body: JSON.stringify({ macroId: 'm1', canvasId: 'c1' }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(401);
  });

  it('returns 400 when macroId is missing', async () => {
    const req = new Request('http://localhost/api/canvas/macros/replay', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasId: 'c1' }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(400);
  });

  it('returns 400 when canvasId is missing', async () => {
    const req = new Request('http://localhost/api/canvas/macros/replay', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroId: 'm1' }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(400);
  });

  it('returns 404 when macro not found', async () => {
    mockDB.prepare.mockReturnThis();
    mockDB.bind.mockReturnThis();
    mockDB.first.mockResolvedValue(null);

    const req = new Request('http://localhost/api/canvas/macros/replay', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroId: 'nonexistent', canvasId: 'c1' }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(404);
  });

  it('returns 403 when macro belongs to another user', async () => {
    mockDB.prepare.mockReturnThis();
    mockDB.bind.mockReturnThis();
    mockDB.first.mockResolvedValue({
      id: 'macro-other',
      user_id: 'other-user',
      steps_json: '[]',
    });

    const req = new Request('http://localhost/api/canvas/macros/replay', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroId: 'macro-other', canvasId: 'c1' }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(403);
  });

  it('returns 200 with resolved steps for valid macro', async () => {
    const steps = [
      { type: 'create-node', timestamp: 1000, data: { nodeType: 'rect', width: 100 } },
      { type: 'move-node', timestamp: 2000, data: { x: 10, y: 20 } },
    ];
    mockDB.prepare.mockReturnThis();
    mockDB.bind.mockReturnThis();
    mockDB.first.mockResolvedValue({
      id: 'macro-1',
      user_id: 'user-001',
      steps_json: JSON.stringify(steps),
    });

    const req = new Request('http://localhost/api/canvas/macros/replay', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroId: 'macro-1', canvasId: 'canvas-123' }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(200);
    const data = await res.json() as { ok: boolean; canvasId: string; results: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.canvasId).toBe('canvas-123');
    expect(data.results).toHaveLength(2);
    expect((data.results[0] as any).type).toBe('create-node');
    expect((data.results[0] as any).resolved.canvasId).toBe('canvas-123');
  });

  it('substitutes params in step data', async () => {
    const steps = [
      { type: 'create-node', timestamp: 1000, data: { label: '{{param.label}}', width: 50 } },
    ];
    mockDB.prepare.mockReturnThis();
    mockDB.bind.mockReturnThis();
    mockDB.first.mockResolvedValue({
      id: 'macro-param',
      user_id: 'user-001',
      steps_json: JSON.stringify(steps),
    });

    const req = new Request('http://localhost/api/canvas/macros/replay', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroId: 'macro-param',
        canvasId: 'canvas-123',
        params: { label: 'Hello World' },
      }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(200);
    const data = await res.json() as { results: unknown[] };
    expect((data.results[0] as any).resolved.label).toBe('Hello World');
    expect((data.results[0] as any).resolved.width).toBe(50);
  });
});
