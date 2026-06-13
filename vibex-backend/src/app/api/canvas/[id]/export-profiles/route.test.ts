/**
 * route.test.ts — /api/canvas/[id]/export-profiles Jest Tests
 * Sprint95 E4: Export Profile Templates
 *
 * Tests flat-column API: format, scale, includeNodes, includeEdges (NOT nested settings object)
 *
 * Tests:
 * 1. GET without auth → 401 Unauthorized
 * 2. GET with auth, no profiles → empty list
 * 3. GET with auth, returns profiles list (flat fields)
 * 4. POST without auth → 401 Unauthorized
 * 5. POST with valid body → creates profile, returns 201 (flat fields)
 * 6. POST with missing name → 400
 * 7. POST with empty name → 400
 * 8. POST with name > 100 chars → 400
 * 9. DELETE without auth → 401 Unauthorized
 * 10. DELETE with valid profileId → 204 No Content
 * 11. DELETE with non-existent profileId → 404
 * 12. DELETE with profile belonging to another user → 404
 * 13. DELETE returns 500 on DB error
 */

const mockQueryDB = jest.fn();
const mockExecuteDB = jest.fn();
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
    return { success: true as const, user: { userId: 'user-001', name: 'Test User', email: 'test@test.com' } };
  }),
}));

import { GET, POST, DELETE } from './route';
import { NextRequest } from 'next/server';

function makeCtx(params: Record<string, string>) {
  return {
    params: Promise.resolve(params),
    env: {},
  };
}

describe('GET /api/canvas/[id]/export-profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles');
    const res = await GET(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(401);
  });

  it('returns empty list when no profiles exist', async () => {
    mockQueryDB.mockResolvedValue([]);
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; profiles: unknown[] };
    expect(body.ok).toBe(true);
    expect(body.profiles).toEqual([]);
  });

  it('returns profiles list mapped correctly with flat fields', async () => {
    const ts = Date.now();
    mockQueryDB.mockResolvedValue([
      {
        id: 'profile-001',
        canvas_id: 'c1',
        user_id: 'user-001',
        name: 'My Profile',
        format: 'png',
        scale: 200,
        include_nodes: 1,
        include_edges: 0,
        created_at: ts,
        updated_at: ts,
      },
    ]);
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles', {
      headers: { Authorization: 'Bearer test' },
    });
    const res = await GET(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; profiles: any[] };
    expect(body.ok).toBe(true);
    expect(body.profiles).toHaveLength(1);
    expect(body.profiles[0].id).toBe('profile-001');
    expect(body.profiles[0].name).toBe('My Profile');
    expect(body.profiles[0].format).toBe('png');
    expect(body.profiles[0].scale).toBe(200);
    expect(body.profiles[0].includeNodes).toBe(true);
    expect(body.profiles[0].includeEdges).toBe(false);
  });
});

describe('POST /api/canvas/[id]/export-profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockReturnValue('profile-new-001');
    mockExecuteDB.mockResolvedValue({});
  });

  it('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', format: 'react', scale: 100 }),
    });
    const res = await POST(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(401);
  });

  it('creates profile with valid body and returns 201 with flat fields', async () => {
    mockExecuteDB.mockResolvedValue({});
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
      body: JSON.stringify({ name: 'My Export Profile', format: 'png', scale: 200, includeNodes: true, includeEdges: false }),
    });
    const res = await POST(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(201);
    const body = await res.json() as { ok: boolean; profile: any };
    expect(body.ok).toBe(true);
    expect(body.profile.id).toBe('profile-new-001');
    expect(body.profile.name).toBe('My Export Profile');
    expect(body.profile.canvasId).toBe('c1');
    expect(body.profile.format).toBe('png');
    expect(body.profile.scale).toBe(200);
    expect(body.profile.includeNodes).toBe(true);
    expect(body.profile.includeEdges).toBe(false);
  });

  it('returns 400 when name is missing', async () => {
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
      body: JSON.stringify({ format: 'react', scale: 100 }),
    });
    const res = await POST(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json() as { ok: boolean; error: string };
    expect(body.error).toContain('name is required');
  });

  it('returns 400 when name is an empty string', async () => {
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
      body: JSON.stringify({ name: '   ', format: 'react', scale: 100 }),
    });
    const res = await POST(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json() as { ok: boolean; error: string };
    expect(body.error).toContain('name is required');
  });

  it('returns 400 when name exceeds 100 characters', async () => {
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
      body: JSON.stringify({ name: 'a'.repeat(101), format: 'react', scale: 100 }),
    });
    const res = await POST(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json() as { ok: boolean; error: string };
    expect(body.error).toContain('at most 100 characters');
  });
});

describe('DELETE /api/canvas/[id]/export-profiles?profileId=', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles?profileId=profile-001', {
      method: 'DELETE',
    });
    const res = await DELETE(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(401);
  });

  it('deletes own profile and returns 204', async () => {
    mockQueryDB.mockResolvedValue([{ id: 'profile-001', canvas_id: 'c1', user_id: 'user-001' }]);
    mockExecuteDB.mockResolvedValue({});
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles?profileId=profile-001', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test' },
    });
    const res = await DELETE(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(204);
  });

  it('returns 404 when profile does not exist', async () => {
    mockQueryDB.mockResolvedValue([]);
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles?profileId=nonexistent', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test' },
    });
    const res = await DELETE(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(404);
    const body = await res.json() as { ok: boolean; error: string };
    expect(body.error).toBe('Not found');
  });

  it('returns 404 when profile belongs to another user', async () => {
    mockQueryDB.mockResolvedValue([{ id: 'profile-001', canvas_id: 'c1', user_id: 'other-user' }]);
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles?profileId=profile-001', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test' },
    });
    const res = await DELETE(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(404);
  });

  it('returns 500 on DB error during delete', async () => {
    mockQueryDB.mockRejectedValue(new Error('DB error'));
    const req = new NextRequest('http://localhost/api/canvas/c1/export-profiles?profileId=profile-001', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test' },
    });
    const res = await DELETE(req, makeCtx({ id: 'c1' }) as any);
    expect(res.status).toBe(500);
  });
});
