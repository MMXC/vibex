/**
 * route.test.ts — /api/canvas/[id]/github API tests
 * Sprint89 E4: GitHub Integration Deep Link
 *
 * Tests:
 * 1. GET: unauthorized without auth → 401
 * 2. GET: returns null when no github_pr_url set → 200 { ok: true, githubPrUrl: null }
 * 3. GET: returns githubPrUrl when set → 200
 * 4. POST: unauthorized without auth → 401
 * 5. POST: invalid URL format → 400
 * 6. POST: valid URL saves successfully → 200
 * 7. POST: null URL clears the field → 200
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/db', () => {
  const mockQueryOne = jest.fn();
  const mockExecuteDB = jest.fn();
  const mockSafeError = jest.fn();
  (global as Record<string, unknown>).__githubQueryOne = mockQueryOne;
  (global as Record<string, unknown>).__githubExecuteDB = mockExecuteDB;
  (global as Record<string, unknown>).__githubSafeError = mockSafeError;
  return {
    queryOne: mockQueryOne,
    executeDB: mockExecuteDB,
    safeError: mockSafeError,
  };
});

const mockQueryOne = () => (global as Record<string, unknown>).__githubQueryOne as jest.Mock;
const mockExecuteDB = () => (global as Record<string, unknown>).__githubExecuteDB as jest.Mock;
const mockSafeError = () => (global as Record<string, unknown>).__githubSafeError as jest.Mock;
const { getAuthUserFromRequest } = jest.requireMock('@/lib/authFromGateway');

import { GET as getGithub, POST as saveGithub } from './route';

const mockEnv = { DB: {} };

function mockAuthSuccess() {
  (getAuthUserFromRequest as jest.Mock).mockReturnValue({
    success: true,
    user: { userId: 'user-001', name: 'Test User' },
  });
}

function mockAuthFailure() {
  (getAuthUserFromRequest as jest.Mock).mockReturnValue({
    success: false,
    user: undefined,
  });
}

describe('GET /api/canvas/[id]/github', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();
    const request = new NextRequest('http://localhost:3000/api/canvas/canvas-1/github');
    const response = await getGithub(request, { params: Promise.resolve({ id: 'canvas-1' }), env: mockEnv });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns null githubPrUrl when field is not set', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({ github_pr_url: null });

    const request = new NextRequest('http://localhost:3000/api/canvas/canvas-1/github');
    const response = await getGithub(request, { params: Promise.resolve({ id: 'canvas-1' }), env: mockEnv });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.githubPrUrl).toBeNull();
  });

  it('returns githubPrUrl when field is set', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({
      github_pr_url: 'https://github.com/owner/repo/pull/42',
    });

    const request = new NextRequest('http://localhost:3000/api/canvas/canvas-1/github');
    const response = await getGithub(request, { params: Promise.resolve({ id: 'canvas-1' }), env: mockEnv });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.githubPrUrl).toBe('https://github.com/owner/repo/pull/42');
  });
});

describe('POST /api/canvas/[id]/github', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();
    const request = new NextRequest('http://localhost:3000/api/canvas/canvas-1/github', {
      method: 'POST',
      body: JSON.stringify({ githubPrUrl: 'https://github.com/owner/repo/pull/1' }),
    });
    const response = await saveGithub(request, { params: Promise.resolve({ id: 'canvas-1' }), env: mockEnv });
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid GitHub URL', async () => {
    mockAuthSuccess();
    const request = new NextRequest('http://localhost:3000/api/canvas/canvas-1/github', {
      method: 'POST',
      body: JSON.stringify({ githubPrUrl: 'not-a-valid-url' }),
    });
    const response = await saveGithub(request, { params: Promise.resolve({ id: 'canvas-1' }), env: mockEnv });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid GitHub URL');
  });

  it('returns 400 for PR URL with wrong domain', async () => {
    mockAuthSuccess();
    const request = new NextRequest('http://localhost:3000/api/canvas/canvas-1/github', {
      method: 'POST',
      body: JSON.stringify({ githubPrUrl: 'https://gitlab.com/owner/repo/pull/1' }),
    });
    const response = await saveGithub(request, { params: Promise.resolve({ id: 'canvas-1' }), env: mockEnv });
    expect(response.status).toBe(400);
  });

  it('saves valid PR URL successfully', async () => {
    mockAuthSuccess();
    mockExecuteDB().mockResolvedValueOnce({ success: true, meta: { changes: 1 } });

    const request = new NextRequest('http://localhost:3000/api/canvas/canvas-1/github', {
      method: 'POST',
      body: JSON.stringify({ githubPrUrl: 'https://github.com/owner/repo/pull/42' }),
    });
    const response = await saveGithub(request, { params: Promise.resolve({ id: 'canvas-1' }), env: mockEnv });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(mockExecuteDB()).toHaveBeenCalledWith(
      mockEnv,
      'UPDATE canvas SET github_pr_url = ? WHERE id = ?',
      ['https://github.com/owner/repo/pull/42', 'canvas-1']
    );
  });

  it('clears github_pr_url when null is passed', async () => {
    mockAuthSuccess();
    mockExecuteDB().mockResolvedValueOnce({ success: true, meta: { changes: 1 } });

    const request = new NextRequest('http://localhost:3000/api/canvas/canvas-1/github', {
      method: 'POST',
      body: JSON.stringify({ githubPrUrl: null }),
    });
    const response = await saveGithub(request, { params: Promise.resolve({ id: 'canvas-1' }), env: mockEnv });
    expect(response.status).toBe(200);
    expect(mockExecuteDB()).toHaveBeenCalledWith(
      mockEnv,
      'UPDATE canvas SET github_pr_url = ? WHERE id = ?',
      [null, 'canvas-1']
    );
  });
});
