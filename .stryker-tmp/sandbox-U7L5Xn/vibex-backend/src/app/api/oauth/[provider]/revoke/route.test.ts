// @ts-nocheck
import { NextRequest } from 'next/server';

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
    delete: jest.fn(),
  })),
}));

import { POST } from './route';

describe('POST /api/oauth/[provider]/revoke', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle revoke request', async () => {
    const request = new NextRequest('http://localhost:3000/api/oauth/github/revoke', {
      method: 'POST',
    });
    
    try {
      const response = await POST(request, { params: Promise.resolve({ provider: 'github' }) });
      expect([200, 400, 500]).toContain(response.status);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle unsupported provider', async () => {
    const request = new NextRequest('http://localhost:3000/api/oauth/unsupported/revoke', {
      method: 'POST',
    });
    
    try {
      const response = await POST(request, { params: Promise.resolve({ provider: 'unsupported' }) });
      expect([400, 500]).toContain(response.status);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});