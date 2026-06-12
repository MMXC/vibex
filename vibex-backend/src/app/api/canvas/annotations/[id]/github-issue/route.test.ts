/**
 * route.test.ts — /api/canvas/annotations/[id]/github-issue API tests
 * Sprint91 E2: GitHub Design Review Loop
 *
 * Tests:
 * 1. POST: unauthorized without auth → 401
 * 2. POST: annotation not found → 404
 * 3. POST: missing owner/repo → 400
 * 4. POST: GITHUB_TOKEN not set → 503
 * 5. POST: GitHub API failure → 502
 * 6. POST: successful issue creation → 200 with issueUrl and issueNumber
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/db', () => {
  const mockQueryOne = jest.fn();
  const mockExecuteDB = jest.fn();
  const mockSafeError = jest.fn();
  (global as Record<string, unknown>).__ghIssueQueryOne = mockQueryOne;
  (global as Record<string, unknown>).__ghIssueExecuteDB = mockExecuteDB;
  (global as Record<string, unknown>).__ghIssueSafeError = mockSafeError;
  return {
    queryOne: mockQueryOne,
    executeDB: mockExecuteDB,
    safeError: mockSafeError,
  };
});

const mockQueryOne = () => (global as Record<string, unknown>).__ghIssueQueryOne as jest.Mock;
const mockExecuteDB = () => (global as Record<string, unknown>).__ghIssueExecuteDB as jest.Mock;
const mockSafeError = () => (global as Record<string, unknown>).__ghIssueSafeError as jest.Mock;
const { getAuthUserFromRequest } = jest.requireMock('@/lib/authFromGateway');

import { POST as createGitHubIssue } from './route';

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

describe('POST /api/canvas/annotations/[id]/github-issue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();
    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/github-issue', {
      method: 'POST',
      body: JSON.stringify({ owner: 'owner', repo: 'repo' }),
    });
    const response = await createGitHubIssue(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof createGitHubIssue>[1]['env'],
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when annotation not found', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/github-issue', {
      method: 'POST',
      body: JSON.stringify({ owner: 'owner', repo: 'repo' }),
    });
    const response = await createGitHubIssue(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof createGitHubIssue>[1]['env'],
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Annotation not found');
  });

  it('returns 400 when owner or repo is missing', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({
      id: 'ann-1',
      canvas_id: 'canvas-1',
      content: 'Test annotation',
      x: 100,
      y: 200,
      type: 'text',
      author_id: 'user-1',
      author_name: 'Test User',
      status: 'active',
      github_issue_url: null,
      github_issue_number: null,
      github_commit_sha: null,
    });

    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/github-issue', {
      method: 'POST',
      body: JSON.stringify({ owner: '', repo: 'repo' }),
    });
    const response = await createGitHubIssue(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: mockEnv as Parameters<typeof createGitHubIssue>[1]['env'],
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('owner and repo are required');
  });

  it('returns 503 when GITHUB_TOKEN is not set', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({
      id: 'ann-1',
      canvas_id: 'canvas-1',
      content: 'Test annotation',
      x: 100,
      y: 200,
      type: 'text',
      author_id: 'user-1',
      author_name: 'Test User',
      status: 'active',
      github_issue_url: null,
      github_issue_number: null,
      github_commit_sha: null,
    });

    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/github-issue', {
      method: 'POST',
      body: JSON.stringify({ owner: 'owner', repo: 'repo' }),
    });
    // env without GITHUB_TOKEN
    const envWithoutToken = { DB: {}, GITHUB_TOKEN: undefined } as unknown as Parameters<typeof createGitHubIssue>[1]['env'];
    const response = await createGitHubIssue(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: envWithoutToken,
    });
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain('GITHUB_TOKEN');
  });

  it('returns 200 and issue info on successful creation', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({
      id: 'ann-1',
      canvas_id: 'canvas-1',
      content: 'Test annotation',
      x: 100,
      y: 200,
      type: 'text',
      author_id: 'user-1',
      author_name: 'Test User',
      status: 'active',
      github_issue_url: null,
      github_issue_number: null,
      github_commit_sha: null,
    });
    mockExecuteDB().mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 });

    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/github-issue', {
      method: 'POST',
      body: JSON.stringify({ owner: 'myowner', repo: 'myrepo' }),
    });
    const envWithToken = {
      DB: {},
      GITHUB_TOKEN: 'ghp_test_token',
    } as unknown as Parameters<typeof createGitHubIssue>[1]['env'];

    // Mock the global fetch to simulate GitHub API response
    const originalFetch = global.fetch;
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ html_url: 'https://github.com/myowner/myrepo/issues/42', number: 42 }),
    });

    const response = await createGitHubIssue(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: envWithToken,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.issueUrl).toBe('https://github.com/myowner/myrepo/issues/42');
    expect(body.issueNumber).toBe(42);

    // Restore global fetch
    global.fetch = originalFetch;
  });

  it('returns 502 when GitHub API returns an error', async () => {
    mockAuthSuccess();
    mockQueryOne().mockResolvedValueOnce({
      id: 'ann-1',
      canvas_id: 'canvas-1',
      content: 'Test annotation',
      x: 100,
      y: 200,
      type: 'text',
      author_id: 'user-1',
      author_name: 'Test User',
      status: 'active',
      github_issue_url: null,
      github_issue_number: null,
      github_commit_sha: null,
    });

    const request = new NextRequest('http://localhost:3000/api/canvas/annotations/ann-1/github-issue', {
      method: 'POST',
      body: JSON.stringify({ owner: 'owner', repo: 'repo' }),
    });
    const envWithToken = {
      DB: {},
      GITHUB_TOKEN: 'ghp_test_token',
    } as unknown as Parameters<typeof createGitHubIssue>[1]['env'];

    // Mock GitHub API failure
    const originalFetch = global.fetch;
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.resolve({ message: 'Resource not accessible by integration' }),
    });

    const response = await createGitHubIssue(request, {
      params: Promise.resolve({ id: 'ann-1' }),
      env: envWithToken,
    });

    expect(response.status).toBe(403);
    global.fetch = originalFetch;
  });
});
