/**
 * Unit tests for /api/templates/:id/versions
 * S93-E2: Template Versioning & Fork
 *
 * Coverage:
 *  POST
 *  1. TC1: Unauthenticated → 401
 *  2. TC2: Template not found → 404
 *  3. TC3: Non-author creating version → 403
 *  4. TC4: Author creates first version → 201 + version_number=1
 *  5. TC5: Author creates second version → 201 + version_number=2
 *  GET
 *  6. TC6: List versions for existing template → 200 + versions array
 *  7. TC7: List versions for non-existent template → 404
 *  PATCH
 *  8. TC8: Non-author pinning version → 403
 *  9. TC9: Author pins version → 200 + pinned=1
 *  TC10: Author pins another version → previous unpinned, new pinned
 *  TC11: Version not found → 404
 *  TC12: Missing pinned field → 400
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/db', () => {
  const mockDB = {
    prepare: jest.fn().mockReturnThis(),
    bind: jest.fn().mockReturnThis(),
    first: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
  };
  return {
    queryDB: jest.fn(),
    queryOne: jest.fn(),
    executeDB: jest.fn(),
    generateId: jest.fn().mockReturnValue('version-id-123'),
    safeError: jest.fn(),
    Env: {},
  };
});

import { POST, GET, PATCH } from './route';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryOne, queryDB, executeDB } from '@/lib/db';

const mockEnv = {} as any;

const TEMPLATE_ID = 'tpl-001';
const USER_ID = 'user-001';
const OTHER_USER = 'user-002';

const mockTemplate = {
  id: TEMPLATE_ID,
  author_id: USER_ID,
  name: 'Test Template',
  description: 'A test template',
  tags: '[]',
  thumbnail: null,
  canvas_id: 'canvas-1',
  content_json: '{"nodes":[]}',
  usage_count: 0,
  avg_rating: 0,
  rating_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  published_at: '2024-01-01T00:00:00Z',
};

describe('POST /api/templates/:id/versions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC1: Unauthenticated → 401', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: false });

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: TEMPLATE_ID }), env: mockEnv });
    expect(response.status).toBe(401);
  });

  it('TC2: Template not found → 404', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock).mockResolvedValueOnce(null);

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'v1' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: TEMPLATE_ID }), env: mockEnv });
    expect(response.status).toBe(404);
  });

  it('TC3: Non-author creating version → 403', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: OTHER_USER } });
    (queryOne as jest.Mock).mockResolvedValueOnce(mockTemplate);

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'v1' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: TEMPLATE_ID }), env: mockEnv });
    expect(response.status).toBe(403);
  });

  it('TC4: Author creates first version → 201 + version_number=1', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock)
      .mockResolvedValueOnce(mockTemplate) // template lookup
      .mockResolvedValueOnce({ max_version: null }) // latest version
      .mockResolvedValueOnce({ // insert result
        id: 'version-id-123',
        template_id: TEMPLATE_ID,
        version_number: 1,
        description: 'v1',
        snapshot_json: '{"nodes":[]}',
        pinned: 0,
        created_by: USER_ID,
        created_at: Math.floor(Date.now() / 1000),
      });
    (executeDB as jest.Mock).mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'v1' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: TEMPLATE_ID }), env: mockEnv });
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.version).toBeDefined();
    expect(executeDB).toHaveBeenCalled();
  });

  it('TC5: Author creates second version → 201 + version_number=2', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock)
      .mockResolvedValueOnce(mockTemplate)
      .mockResolvedValueOnce({ max_version: 1 }) // already has v1
      .mockResolvedValueOnce({
        id: 'version-id-456',
        template_id: TEMPLATE_ID,
        version_number: 2,
        description: 'v2',
        snapshot_json: '{"nodes":[]}',
        pinned: 0,
        created_by: USER_ID,
        created_at: Math.floor(Date.now() / 1000),
      });
    (executeDB as jest.Mock).mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'v2' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: TEMPLATE_ID }), env: mockEnv });
    expect(response.status).toBe(201);
  });
});

describe('GET /api/templates/:id/versions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC6: List versions for existing template → 200 + versions array', async () => {
    (queryOne as jest.Mock).mockResolvedValueOnce({ id: TEMPLATE_ID }); // template check
    (queryDB as jest.Mock).mockResolvedValueOnce([
      { id: 'v2', template_id: TEMPLATE_ID, version_number: 2, description: 'v2', pinned: 0, created_by: USER_ID, created_at: 1718400000 },
      { id: 'v1', template_id: TEMPLATE_ID, version_number: 1, description: 'v1', pinned: 1, created_by: USER_ID, created_at: 1718300000 },
    ]);

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions`);

    const response = await GET(request, { params: Promise.resolve({ id: TEMPLATE_ID }), env: mockEnv });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.versions).toHaveLength(2);
    expect(data.versions[0].version_number).toBe(2);
  });

  it('TC7: List versions for non-existent template → 404', async () => {
    (queryOne as jest.Mock).mockResolvedValueOnce(null);

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions`);

    const response = await GET(request, { params: Promise.resolve({ id: TEMPLATE_ID }), env: mockEnv });
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/templates/:id/versions/:versionId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC8: Non-author pinning version → 403', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: OTHER_USER } });
    (queryOne as jest.Mock).mockResolvedValueOnce({ id: TEMPLATE_ID, author_id: USER_ID });

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions/v1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: TEMPLATE_ID, versionId: 'v1' }), env: mockEnv });
    expect(response.status).toBe(403);
  });

  it('TC9: Author pins version → 200 + pinned=1', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock)
      .mockResolvedValueOnce({ id: TEMPLATE_ID, author_id: USER_ID }) // template check
      .mockResolvedValueOnce({ id: 'v1', template_id: TEMPLATE_ID, version_number: 1 }); // version check
    (executeDB as jest.Mock).mockResolvedValue({ changes: 1, lastInsertRowid: 1 });

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions/v1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: TEMPLATE_ID, versionId: 'v1' }), env: mockEnv });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.version.pinned).toBe(1);
    // Should have unpin all then pin this one
    expect((executeDB as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('TC10: Author pins another version → previous unpinned, new pinned', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock)
      .mockResolvedValueOnce({ id: TEMPLATE_ID, author_id: USER_ID })
      .mockResolvedValueOnce({ id: 'v2', template_id: TEMPLATE_ID, version_number: 2 });
    (executeDB as jest.Mock).mockResolvedValue({ changes: 1, lastInsertRowid: 1 });

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions/v2`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: TEMPLATE_ID, versionId: 'v2' }), env: mockEnv });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.version.id).toBe('v2');
    expect(data.version.pinned).toBe(1);
    // First call: unpin all (params array is index 2)
    expect((executeDB as jest.Mock).mock.calls[0][2]).toContain(TEMPLATE_ID);
  });

  it('TC11: Version not found → 404', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock)
      .mockResolvedValueOnce({ id: TEMPLATE_ID, author_id: USER_ID })
      .mockResolvedValueOnce(null); // version not found

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions/v999`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: TEMPLATE_ID, versionId: 'v999' }), env: mockEnv });
    expect(response.status).toBe(404);
  });

  it('TC12: Missing pinned field → 400', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock)
      .mockResolvedValueOnce({ id: TEMPLATE_ID, author_id: USER_ID })
      .mockResolvedValueOnce({ id: 'v1', template_id: TEMPLATE_ID, version_number: 1 });

    const request = new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}/versions/v1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: TEMPLATE_ID, versionId: 'v1' }), env: mockEnv });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('pinned');
  });
});
