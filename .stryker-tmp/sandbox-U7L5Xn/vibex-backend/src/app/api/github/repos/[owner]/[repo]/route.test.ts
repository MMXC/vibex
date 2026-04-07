// @ts-nocheck
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

import { GET } from './route';

describe('GET /api/github/repos/[owner]/[repo]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should return 404 if repository not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/notexist');
    const response = await GET(request, { params: Promise.resolve({ owner: 'owner', repo: 'notexist' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('should return repository data on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: 'test-repo',
        full_name: 'owner/test-repo',
        description: 'A test repository',
        owner: { login: 'owner', avatar_url: 'https://example.com/avatar.png' },
        stargazers_count: 100,
        forks_count: 20,
        language: 'TypeScript',
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-06-01T00:00:00Z',
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/test-repo');
    const response = await GET(request, { params: Promise.resolve({ owner: 'owner', repo: 'test-repo' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('test-repo');
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/test-repo');
    const response = await GET(request, { params: Promise.resolve({ owner: 'owner', repo: 'test-repo' }) });

    expect(response.status).toBe(500);
  });
});
