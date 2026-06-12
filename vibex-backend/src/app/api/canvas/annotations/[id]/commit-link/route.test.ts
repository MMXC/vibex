/**
 * route.test.ts — /api/canvas/annotations/[id]/commit-link API tests
 * Sprint91 E2: GitHub Design Review Loop
 *
 * Tests:
 * 1. POST: unauthorized without auth → 401
 * 2. POST: annotation not found → 404
 * 3. POST: invalid commitSha format → 400
 * 4. POST: valid commitSha → 200 with commitSha
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/db', () => {
  const mockQueryOne = jest.fn();
  const mockExecuteDB = jest.fn();
  const mockSafeError = jest.fn();
  (global as Record<string, unknown>).__commitLinkQueryOne = mockQueryOne;
  (global as Record<string, unknown>).__commitLinkExecuteDB = mockExecuteDB;
  (global as Record<string, unknown>).__commitLinkSafeError = mockSafeError;
  return {
    queryOne: mockQueryOne,
    executeDB: mockExecuteDB,
    safeError: mockSafeError,
  };
});

const mockQueryOne = () => (global as Record<string, unknown>).__commitLinkQueryOne as jest.Mock;
const mockExecuteDB = () => (global as Record<string, unknown>).__commitLinkExecuteDB as jest.Mock;
const { getAuthUserFromRequest } = jest.requireMock('@/lib/authFromGateway');

import { POST as linkCommit } from './route';

const mockEnv = { DB: {} } as unknown as Record<string, unknown>;

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

describe('POST /api/canvas/annotations/[id]/commit-link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();
    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/commit-link', {
      method: 'POST',
      body: JSON.stringify({ commitSha: 'a'.repeat(40) }),
    });
    const response = await linkCommit(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof linkCommit>[1]['env'],
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when annotation not found', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/commit-link', {
      method: 'POST',
      body: JSON.stringify({ commitSha: 'a'.repeat(40) }),
    });
    const response = await linkCommit(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof linkCommit>[1]['env'],
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Annotation not found');
  });

  it('returns 400 for invalid commitSha format (too short)', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({ id: 'ann-1', github_commit_sha: null });

    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/commit-link', {
      method: 'POST',
      body: JSON.stringify({ commitSha: 'abc123' }),
    });
    const response = await linkCommit(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof linkCommit>[1]['env'],
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid commit SHA format');
  });

  it('returns 400 for invalid commitSha format (non-hex)', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({ id: 'ann-1', github_commit_sha: null });

    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/commit-link', {
      method: 'POST',
      body: JSON.stringify({ commitSha: 'g'.repeat(40) }),
    });
    const response = await linkCommit(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof linkCommit>[1]['env'],
    });
    expect(response.status).toBe(400);
  });

  it('returns 200 and updates annotation with valid commitSha', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({ id: 'ann-1', github_commit_sha: null });
    mockExecuteDB().mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 });

    const validSha = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/commit-link', {
      method: 'POST',
      body: JSON.stringify({ commitSha: validSha }),
    });
    const response = await linkCommit(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof linkCommit>[1]['env'],
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.commitSha).toBe(validSha);
  });

  it('returns 200 and updates annotation with uppercase SHA (normalized to lowercase)', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({ id: 'ann-1', github_commit_sha: null });
    mockExecuteDB().mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 });

    const uppercaseSha = 'ABCDEF0123456789ABCDEF0123456789ABCDEF01';
    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/commit-link', {
      method: 'POST',
      body: JSON.stringify({ commitSha: uppercaseSha }),
    });
    const response = await linkCommit(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof linkCommit>[1]['env'],
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.commitSha).toBe(uppercaseSha.toLowerCase());
  });
});
