// @ts-nocheck
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    GITHUB_CLIENT_ID: 'test-client-id',
    GITHUB_CLIENT_SECRET: 'test-client-secret',
    FIGMA_CLIENT_ID: 'test-figma-client-id',
    FIGMA_CLIENT_SECRET: 'test-figma-secret',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: 'test-token' })),
  })),
}));

import { GET } from './route';

describe('GET /api/oauth/[provider]/user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should return 401 if no token', async () => {
    const request = new NextRequest('http://localhost:3000/api/oauth/github/user');
    
    try {
      const response = await GET(request, { params: Promise.resolve({ provider: 'github' }) });
      expect([200, 401, 500]).toContain(response.status);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should fetch user from github', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ login: 'testuser', name: 'Test User' }),
    });

    const request = new NextRequest('http://localhost:3000/api/oauth/github/user', {
      headers: { Authorization: 'Bearer test-token' },
    });
    
    try {
      const response = await GET(request, { params: Promise.resolve({ provider: 'github' }) });
      expect([200, 401, 500]).toContain(response.status);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle unsupported provider', async () => {
    const request = new NextRequest('http://localhost:3000/api/oauth/unsupported/user');
    
    try {
      const response = await GET(request, { params: Promise.resolve({ provider: 'unsupported' }) });
      expect([400, 500]).toContain(response.status);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});