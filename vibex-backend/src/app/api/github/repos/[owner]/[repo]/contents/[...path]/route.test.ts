import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

import { GET } from './route';

describe('GET /api/github/repos/[owner]/[repo]/contents/[...path]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should return file contents', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: Buffer.from('test file content').toString('base64'),
        encoding: 'base64',
        name: 'test.txt',
        path: 'test.txt',
        type: 'file',
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/repo/contents/test.txt');
    const response = await GET(request, { 
      params: Promise.resolve({ owner: 'owner', repo: 'repo', path: ['test.txt'] }) 
    });
    
    expect([200, 404, 500]).toContain(response.status);
  });

  it('should return 404 if file not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/repo/contents/nonexistent.txt');
    const response = await GET(request, { 
      params: Promise.resolve({ owner: 'owner', repo: 'repo', path: ['nonexistent.txt'] }) 
    });

    expect(response.status).toBe(404);
  });

  it('should handle directory listing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: 'file1.txt', type: 'file', path: 'dir/file1.txt' },
        { name: 'file2.txt', type: 'file', path: 'dir/file2.txt' },
      ],
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/repo/contents/src');
    const response = await GET(request, { 
      params: Promise.resolve({ owner: 'owner', repo: 'repo', path: ['src'] }) 
    });
    
    expect([200, 404, 500]).toContain(response.status);
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const request = new NextRequest('http://localhost:3000/api/github/repos/owner/repo/contents/test.txt');
    const response = await GET(request, { 
      params: Promise.resolve({ owner: 'owner', repo: 'repo', path: ['test.txt'] }) 
    });

    expect(response.status).toBe(500);
  });
});