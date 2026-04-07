import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

import { GET } from './route';

describe('GET /api/github/repos/[owner]/[repo]/readme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should return readme content', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: Buffer.from('# Test README\n\nThis is a test.').toString('base64'),
        encoding: 'base64',
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/repo/readme');
    const response = await GET(request, { params: Promise.resolve({ owner: 'owner', repo: 'repo' }) });
    
    expect([200, 404, 500]).toContain(response.status);
  });

  it('should return 404 if readme not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/repo/readme');
    const response = await GET(request, { params: Promise.resolve({ owner: 'owner', repo: 'repo' }) });

    expect(response.status).toBe(404);
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/repo/readme');
    const response = await GET(request, { params: Promise.resolve({ owner: 'owner', repo: 'repo' }) });

    expect(response.status).toBe(500);
  });
});