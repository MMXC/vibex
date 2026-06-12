/**
 * Unit tests for POST /api/templates/:id/fork
 * S93-E2: Template Versioning & Fork
 *
 * Coverage:
 *  1. TC1: Unauthenticated → 401
 *  2. TC2: Template not found → 404
 *  3. TC3: Missing name → 400
 *  4. TC4: Author forks own template → 200 + forked_from_id set
 *  5. TC5: User forks another user's template → 200 + forked_from_id set
 *  6. TC6: Name too long → 400
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/db', () => {
  return {
    queryDB: jest.fn(),
    queryOne: jest.fn(),
    executeDB: jest.fn(),
    generateId: jest.fn().mockReturnValue('forked-tpl-id-456'),
    safeError: jest.fn(),
    Env: {},
  };
});

import { POST } from './route';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryOne, executeDB } from '@/lib/db';

const mockEnv = {} as any;

const SOURCE_ID = 'tpl-source-001';
const USER_ID = 'user-001';

const mockSourceTemplate = {
  id: SOURCE_ID,
  name: 'Source Template',
  description: 'Original template',
  author_id: USER_ID,
  author_name: 'Original Author',
  tags: '["design"]',
  thumbnail: null,
  canvas_id: 'canvas-001',
  content_json: '{"nodes":[]}',
  usage_count: 10,
  avg_rating: 4.5,
  rating_count: 5,
  created_at: '2024-01-01T00:00:00Z',
  published_at: '2024-01-01T00:00:00Z',
  forked_from_id: null,
};

const mockForkedTemplate = {
  id: 'forked-tpl-id-456',
  name: 'Forked Template',
  description: 'Original template',
  author_id: USER_ID,
  author_name: 'Original Author',
  tags: '["design"]',
  thumbnail: null,
  canvas_id: 'canvas-001',
  content_json: '{"nodes":[]}',
  usage_count: 0,
  avg_rating: 0,
  rating_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  published_at: '2024-01-01T00:00:00Z',
  forked_from_id: SOURCE_ID,
};

describe('POST /api/templates/:id/fork', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC1: Unauthenticated → 401', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: false });

    const request = new NextRequest(`http://localhost/api/templates/${SOURCE_ID}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Fork' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: SOURCE_ID }), env: mockEnv });
    expect(response.status).toBe(401);
  });

  it('TC2: Template not found → 404', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock).mockResolvedValueOnce(null);

    const request = new NextRequest(`http://localhost/api/templates/${SOURCE_ID}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Fork' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: SOURCE_ID }), env: mockEnv });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  it('TC3: Missing name → 400', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });

    const request = new NextRequest(`http://localhost/api/templates/${SOURCE_ID}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: SOURCE_ID }), env: mockEnv });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('name');
  });

  it('TC4: Author forks own template → 200 + forked_from_id set', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });
    (queryOne as jest.Mock)
      .mockResolvedValueOnce(mockSourceTemplate) // source lookup
      .mockResolvedValueOnce(mockForkedTemplate); // insert lookup
    (executeDB as jest.Mock).mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    const request = new NextRequest(`http://localhost/api/templates/${SOURCE_ID}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Fork' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: SOURCE_ID }), env: mockEnv });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.template).toBeDefined();
    expect(data.template.forked_from_id).toBe(SOURCE_ID);

    // Verify executeDB was called with forked_from_id in params (at index 2)
    expect(executeDB).toHaveBeenCalled();
    const insertCall = (executeDB as jest.Mock).mock.calls[0];
    expect(insertCall[2]).toContain(SOURCE_ID); // forked_from_id is in the params array
  });

  it('TC5: User forks another user template → 200 + forked_from_id set', async () => {
    const OTHER_USER = 'user-other';
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: OTHER_USER } });
    (queryOne as jest.Mock)
      .mockResolvedValueOnce({ ...mockSourceTemplate, author_id: USER_ID }) // source
      .mockResolvedValueOnce({ ...mockForkedTemplate, author_id: OTHER_USER, forked_from_id: SOURCE_ID }); // result
    (executeDB as jest.Mock).mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 });

    const request = new NextRequest(`http://localhost/api/templates/${SOURCE_ID}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Another Fork' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: SOURCE_ID }), env: mockEnv });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.template.forked_from_id).toBe(SOURCE_ID);
  });

  it('TC6: Name too long → 400', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: USER_ID } });

    const longName = 'A'.repeat(201);
    const request = new NextRequest(`http://localhost/api/templates/${SOURCE_ID}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: longName }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: SOURCE_ID }), env: mockEnv });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('too long');
  });
});
