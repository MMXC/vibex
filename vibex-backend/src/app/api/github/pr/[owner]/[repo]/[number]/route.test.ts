/**
 * route.test.ts — /api/github/pr/[owner]/[repo]/[number] API tests
 * Sprint89 E4: GitHub Integration Deep Link
 *
 * Tests:
 * 1. GET: 401 without Authorization header
 * 2. GET: 400 for non-numeric PR number
 * 3. GET: returns open PR status
 * 4. GET: returns merged PR status (merged_at set)
 * 5. GET: 404 when PR not found
 * 6. GET: 401 when GitHub token is invalid
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => {
  const mockSafeError = jest.fn();
  (global as Record<string, unknown>).__prSafeError = mockSafeError;
  return { safeError: mockSafeError };
});

const mockSafeError = () => (global as Record<string, unknown>).__prSafeError as jest.Mock;
const globalFetch = jest.spyOn(global, 'fetch');

import { GET as getPRStatus } from './route';

const mockEnv = {};

describe('GET /api/github/pr/[owner]/[repo]/[number]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without Authorization header', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/github/pr/owner/repo/42'
    );
    const response = await getPRStatus(
      request,
      { params: Promise.resolve({ owner: 'owner', repo: 'repo', number: '42' }), env: mockEnv }
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('GitHub token required');
  });

  it('returns 401 for non-Bearer Authorization', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/github/pr/owner/repo/42',
      { headers: { Authorization: 'Basic abc123' } }
    );
    const response = await getPRStatus(
      request,
      { params: Promise.resolve({ owner: 'owner', repo: 'repo', number: '42' }), env: mockEnv }
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 for non-numeric PR number', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/github/pr/owner/repo/abc',
      { headers: { Authorization: 'Bearer ghp_token' } }
    );
    const response = await getPRStatus(
      request,
      { params: Promise.resolve({ owner: 'owner', repo: 'repo', number: 'abc' }), env: mockEnv }
    );
    expect(response.status).toBe(400);
  });

  it('returns open PR status', async () => {
    globalFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          number: 42,
          title: 'Add new feature',
          state: 'open',
          html_url: 'https://github.com/owner/repo/pull/42',
          user: { login: 'alice', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
          created_at: '2026-06-01T10:00:00Z',
          updated_at: '2026-06-02T10:00:00Z',
          merged_at: null,
          closed_at: null,
          additions: 50,
          deletions: 10,
          draft: false,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    const request = new NextRequest(
      'http://localhost:3000/api/github/pr/owner/repo/42',
      { headers: { Authorization: 'Bearer ghp_token' } }
    );
    const response = await getPRStatus(
      request,
      { params: Promise.resolve({ owner: 'owner', repo: 'repo', number: '42' }), env: mockEnv }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.pr.state).toBe('open');
    expect(body.pr.title).toBe('Add new feature');
    expect(body.pr.number).toBe(42);
    expect(body.pr.mergedAt).toBeNull();
  });

  it('returns merged PR state when merged_at is set', async () => {
    globalFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          number: 99,
          title: 'Merged Feature',
          state: 'closed',
          html_url: 'https://github.com/owner/repo/pull/99',
          user: { login: 'bob', avatar_url: 'https://avatars.githubusercontent.com/u/2' },
          created_at: '2026-05-01T10:00:00Z',
          updated_at: '2026-05-15T10:00:00Z',
          merged_at: '2026-05-15T09:55:00Z',
          closed_at: '2026-05-15T09:55:00Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    const request = new NextRequest(
      'http://localhost:3000/api/github/pr/owner/repo/99',
      { headers: { Authorization: 'Bearer ghp_token' } }
    );
    const response = await getPRStatus(
      request,
      { params: Promise.resolve({ owner: 'owner', repo: 'repo', number: '99' }), env: mockEnv }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.pr.state).toBe('merged');
    expect(body.pr.mergedAt).toBe('2026-05-15T09:55:00Z');
  });

  it('returns 404 when PR not found', async () => {
    globalFetch.mockResolvedValueOnce(
      new Response(null, { status: 404 })
    );

    const request = new NextRequest(
      'http://localhost:3000/api/github/pr/owner/repo/999',
      { headers: { Authorization: 'Bearer ghp_token' } }
    );
    const response = await getPRStatus(
      request,
      { params: Promise.resolve({ owner: 'owner', repo: 'repo', number: '999' }), env: mockEnv }
    );
    expect(response.status).toBe(404);
  });

  it('returns 401 when GitHub token is invalid', async () => {
    globalFetch.mockResolvedValueOnce(
      new Response(null, { status: 401 })
    );

    const request = new NextRequest(
      'http://localhost:3000/api/github/pr/owner/repo/1',
      { headers: { Authorization: 'Bearer invalid_token' } }
    );
    const response = await getPRStatus(
      request,
      { params: Promise.resolve({ owner: 'owner', repo: 'repo', number: '1' }), env: mockEnv }
    );
    expect(response.status).toBe(401);
  });
});
