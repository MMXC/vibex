/**
 * Unit tests for POST /api/templates/:id/publish
 * S90-E3: Template Sharing & Public Gallery
 *
 * Coverage:
 *  1. TC1: Unauthenticated → 401
 *  2. TC2: Template not found → 404
 *  3. TC3: Non-author trying to publish → 403
 *  4. TC4: Author makes template public → 200 + returns shareToken
 *  5. TC5: Author makes template private again → 200 + isPublic=false
 *  6. TC6: Missing isPublic in body → 400
 *  7. TC7: Second publish (token already set) → 200 + same token
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
    generateId: jest.fn().mockReturnValue('test-id-123'),
    safeError: jest.fn(),
    Env: {},
  };
});

import { POST } from './route';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryOne, executeDB } from '@/lib/db';

const mockEnv = {} as any;

describe('POST /api/templates/:id/publish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC1: Unauthenticated → 401', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: false });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-1/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'tpl-1' }), env: mockEnv });
    expect(response.status).toBe(401);
  });

  it('TC2: Template not found → 404', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: 'user-1' } });
    (queryOne as jest.Mock).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-1/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'tpl-1' }), env: mockEnv });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  it('TC3: Non-author trying to publish → 403', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: 'user-2' } });
    (queryOne as jest.Mock).mockResolvedValueOnce({
      id: 'tpl-1',
      author_id: 'user-1',
      is_public: 0,
      share_token: null,
      name: 'Test Template',
    });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-1/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'tpl-1' }), env: mockEnv });
    expect(response.status).toBe(403);
  });

  it('TC4: Author makes template public → 200 + returns shareToken', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: 'user-1' } });
    (queryOne as jest.Mock).mockResolvedValueOnce({
      id: 'tpl-1',
      author_id: 'user-1',
      is_public: 0,
      share_token: null,
      name: 'Test Template',
    });
    (executeDB as jest.Mock).mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-1/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'tpl-1' }), env: mockEnv });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.isPublic).toBe(true);
    expect(data.shareToken).toBeDefined();
    expect(data.shareToken.length).toBe(32);
  });

  it('TC5: Author makes template private → 200 + isPublic=false', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: 'user-1' } });
    (queryOne as jest.Mock).mockResolvedValueOnce({
      id: 'tpl-1',
      author_id: 'user-1',
      is_public: 1,
      share_token: 'existing-token-1234567890123456789012345678',
      name: 'Test Template',
    });
    (executeDB as jest.Mock).mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-1/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: false }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'tpl-1' }), env: mockEnv });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.isPublic).toBe(false);
  });

  it('TC6: Missing isPublic in body → 400', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: 'user-1' } });
    (queryOne as jest.Mock).mockResolvedValueOnce({
      id: 'tpl-1',
      author_id: 'user-1',
      is_public: 0,
      share_token: null,
      name: 'Test Template',
    });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-1/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'tpl-1' }), env: mockEnv });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('isPublic');
  });

  it('TC7: Second publish (token already set) → 200 + same token', async () => {
    const existingToken = 'abc123def456abc123def456abc123de';
    (getAuthUserFromRequest as jest.Mock).mockReturnValueOnce({ success: true, user: { userId: 'user-1' } });
    (queryOne as jest.Mock).mockResolvedValueOnce({
      id: 'tpl-1',
      author_id: 'user-1',
      is_public: 0,
      share_token: existingToken,
      name: 'Test Template',
    });
    (executeDB as jest.Mock).mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 });

    const request = new NextRequest('http://localhost:3000/api/templates/tpl-1/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'tpl-1' }), env: mockEnv });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.shareToken).toBe(existingToken);
  });
});
