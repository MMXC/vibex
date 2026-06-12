/**
 * route.test.ts — /api/canvas/macros Jest Tests
 * S92-E1: Canvas Workflow Automation
 *
 * Tests:
 * 1. GET without auth → 401
 * 2. GET with auth (empty) → 200, empty macros array
 * 3. GET with auth (with macros) → 200, macros array
 * 4. POST without auth → 401
 * 5. POST with auth, valid body → 201, macro returned
 * 6. POST with auth, missing name → 400
 * 7. POST with auth, steps not array → 400
 * 8. GET with auth, DB error → 500
 */

const mockQueryDB = jest.fn();

jest.mock('@/lib/db', () => ({
  generateId: () => 'macro-test-id',
  Env: {},
}));

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

// Mock D1 Database
const mockDB = {
  prepare: jest.fn().mockReturnThis(),
  bind: jest.fn().mockReturnThis(),
  all: jest.fn(),
  run: jest.fn(),
  first: jest.fn(),
};

const mockEnv = { DB: mockDB };

import { GET, POST } from './route';

describe('GET /api/canvas/macros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/canvas/macros');
    const res = await GET(req, { env: mockEnv as any });
    expect(res.status).toBe(401);
  });

  it('returns 200 with empty macros array for new user', async () => {
    mockDB.prepare.mockReturnThis();
    mockDB.bind.mockReturnThis();
    mockDB.all.mockResolvedValue({ results: [] });

    const req = new Request('http://localhost/api/canvas/macros', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { env: mockEnv as any });
    expect(res.status).toBe(200);
    const data = await res.json() as { ok: boolean; macros: unknown[] };
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.macros)).toBe(true);
    expect(data.macros).toHaveLength(0);
  });

  it('returns 200 with macros array for user with macros', async () => {
    const mockRows = [
      {
        id: 'macro-1',
        user_id: 'user-001',
        name: 'My Macro',
        description: 'Test description',
        steps_json: JSON.stringify([{ type: 'create-node', timestamp: 1000, data: {} }]),
        share_token: null,
        created_at: '1700000000000',
        updated_at: '1700000000000',
        step_count: 1,
      },
    ];
    mockDB.prepare.mockReturnThis();
    mockDB.bind.mockReturnThis();
    mockDB.all.mockResolvedValue({ results: mockRows });

    const req = new Request('http://localhost/api/canvas/macros', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { env: mockEnv as any });
    expect(res.status).toBe(200);
    const data = await res.json() as { ok: boolean; macros: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.macros).toHaveLength(1);
    expect((data.macros[0] as any).id).toBe('macro-1');
    expect((data.macros[0] as any).name).toBe('My Macro');
    expect((data.macros[0] as any).stepCount).toBe(1);
  });

  it('returns 500 when DB is not configured', async () => {
    const req = new Request('http://localhost/api/canvas/macros', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, { env: { DB: undefined } as any });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/canvas/macros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/canvas/macros', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', steps: [] }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(401);
  });

  it('returns 201 with valid macro creation', async () => {
    mockDB.prepare.mockReturnThis();
    mockDB.bind.mockReturnThis();
    mockDB.run.mockResolvedValue({ meta: {} });

    const req = new Request('http://localhost/api/canvas/macros', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Macro',
        description: 'A test macro',
        steps: [{ type: 'create-node', timestamp: 1000, data: { type: 'rect' } }],
      }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(201);
    const data = await res.json() as { ok: boolean; macro: any };
    expect(data.ok).toBe(true);
    expect(data.macro.id).toBe('macro-test-id');
    expect(data.macro.name).toBe('New Macro');
    expect(data.macro.stepCount).toBe(1);
  });

  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/canvas/macros', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: [] }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toContain('name');
  });

  it('returns 400 when name is empty string', async () => {
    const req = new Request('http://localhost/api/canvas/macros', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ', steps: [] }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(400);
  });

  it('returns 400 when steps is not an array', async () => {
    const req = new Request('http://localhost/api/canvas/macros', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', steps: 'not-an-array' }),
    });
    const res = await POST(req, { env: mockEnv as any });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toContain('steps');
  });

  it('returns 500 when DB is not configured', async () => {
    const req = new Request('http://localhost/api/canvas/macros', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', steps: [] }),
    });
    const res = await POST(req, { env: { DB: undefined } as any });
    expect(res.status).toBe(500);
  });
});
