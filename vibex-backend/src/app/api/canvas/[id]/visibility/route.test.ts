/**
 * route.test.ts — S95-E2: Public Canvas Portal
 *
 * Jest tests for /api/canvas/[id]/visibility/route.ts
 * Auth: getAuthUserFromRequest from @/lib/authFromGateway
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQueryOne = jest.fn<(_env: unknown, sql: string, params?: unknown[]) => Promise<unknown>>();
const mockQueryDB = jest.fn<() => Promise<unknown[]>>();
const mockExecuteDB = jest.fn<() => Promise<void>>();

jest.mock('@/lib/db', () => ({
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryDB: () => mockQueryDB(),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: () => 'perm-new-id',
  slugify: (s: string) => s.toLowerCase().replace(/\s+/g, '-'),
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/logger/safeError', () => ({
  safeError: jest.fn(),
}));

const { getAuthUserFromRequest } = jest.requireMock('@/lib/authFromGateway');

function makeReq(method: string, body: unknown) {
  return {
    method,
    json: async () => body,
  } as unknown as Request;
}

function makeCtx(canvasId = 'canvas-1') {
  return {
    params: Promise.resolve({ id: canvasId }),
    env: {} as { DB: unknown },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthUserFromRequest as jest.Mock).mockReturnValue({
    success: true,
    user: { userId: 'user-001', name: 'Alice', email: 'alice@example.com' },
  });
  // Default: canvas found, no existing permission row
  mockQueryOne.mockImplementation(async (_env, sql) => {
    if (sql.startsWith('SELECT id, owner_id')) {
      return { id: 'canvas-1', owner_id: 'user-001', name: 'My Canvas' };
    }
    return null;
  });
  mockExecuteDB.mockResolvedValue();
});

describe('PATCH /api/canvas/:id/visibility', () => {
  it('returns 401 when not authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: false, user: null });
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true }), makeCtx());
    expect(res.status).toBe(401);
  });

  it('returns 404 when canvas not found', async () => {
    mockQueryOne.mockResolvedValue(null);
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true }), makeCtx('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the canvas owner', async () => {
    mockQueryOne.mockImplementation(async (_env, sql) => {
      if (sql.startsWith('SELECT id, owner_id')) {
        return { id: 'canvas-1', owner_id: 'other-user', name: 'My Canvas' };
      }
      return null;
    });
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true }), makeCtx());
    expect(res.status).toBe(403);
  });

  it('creates visibility row and makes canvas public with auto-generated slug', async () => {
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true }), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBeTruthy();
    expect(body.slug).toMatch(/^my-canvas-/);
    expect(body.public_url).toBe(`/public/${body.slug}`);
  });

  it('makes canvas public with custom valid slug', async () => {
    mockQueryOne.mockImplementation(async (_env, sql) => {
      if (sql.startsWith('SELECT id, owner_id')) {
        return { id: 'canvas-1', owner_id: 'user-001', name: 'My Canvas' };
      }
      if (sql.includes('canvas_permissions WHERE public_slug')) {
        return null; // slug not taken
      }
      return null;
    });
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true, slug: 'my-custom-slug' }), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe('my-custom-slug');
    expect(body.public_url).toBe('/public/my-custom-slug');
  });

  it('returns 400 for invalid slug format', async () => {
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true, slug: 'Invalid Slug!' }), makeCtx());
    expect(res.status).toBe(400);
  });

  it('returns 400 for slug that is too short', async () => {
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true, slug: 'ab' }), makeCtx());
    expect(res.status).toBe(400);
  });

  it('returns 409 when slug is already taken', async () => {
    mockQueryOne.mockImplementation(async (_env, sql) => {
      if (sql.startsWith('SELECT id, owner_id')) {
        return { id: 'canvas-1', owner_id: 'user-001', name: 'My Canvas' };
      }
      if (sql.includes('canvas_permissions WHERE public_slug')) {
        return { id: 'other-perm' }; // slug taken
      }
      return null;
    });
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true, slug: 'taken-slug' }), makeCtx());
    expect(res.status).toBe(409);
  });

  it('makes canvas private', async () => {
    mockQueryOne.mockImplementation(async (_env, sql) => {
      if (sql.startsWith('SELECT id, owner_id')) {
        return { id: 'canvas-1', owner_id: 'user-001', name: 'My Canvas' };
      }
      return null;
    });
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: false }), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe('');
    expect(body.public_url).toBeNull();
  });

  it('updates existing permission row to public', async () => {
    mockQueryOne.mockImplementation(async (_env, sql) => {
      if (sql.startsWith('SELECT id, owner_id')) {
        return { id: 'canvas-1', owner_id: 'user-001', name: 'My Canvas' };
      }
      if (sql.startsWith('SELECT * FROM canvas_permissions')) {
        return { id: 'perm-1', canvas_id: 'canvas-1', user_id: 'user-001', is_public: 0, public_slug: 'existing-slug' };
      }
      return null;
    });
    const { PATCH } = await import('./route');
    const res = await PATCH(makeReq('PATCH', { is_public: true }), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toMatch(/^my-canvas-/);
  });
});

describe('GET /api/canvas/:id/visibility', () => {
  it('returns 200 with visibility state for public canvas', async () => {
    mockQueryOne.mockResolvedValue({ is_public: 1, public_slug: 'my-canvas-abc' });
    const { GET } = await import('./route');
    const res = await GET(new Request('http://localhost'), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.is_public).toBe(true);
    expect(body.slug).toBe('my-canvas-abc');
    expect(body.public_url).toBe('/public/my-canvas-abc');
  });

  it('returns 200 with is_public: false when no permission row', async () => {
    mockQueryOne.mockResolvedValue(null);
    const { GET } = await import('./route');
    const res = await GET(new Request('http://localhost'), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.is_public).toBe(false);
    expect(body.slug).toBeNull();
    expect(body.public_url).toBeNull();
  });
});
