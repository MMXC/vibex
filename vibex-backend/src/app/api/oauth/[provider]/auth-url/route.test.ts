import { NextRequest } from 'next/server';

// Mock environment variables
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    GITHUB_CLIENT_ID: 'test-github-client-id',
    FIGMA_CLIENT_ID: 'test-figma-client-id',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

import { POST } from './route';

describe('POST /api/oauth/[provider]/auth-url', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if provider is unsupported', async () => {
    const request = new NextRequest('http://localhost:3000/api/oauth/unsupported/auth-url', {
      method: 'POST',
      body: JSON.stringify({ state: 'test-state' }),
    });
    const response = await POST(request, { params: Promise.resolve({ provider: 'unsupported' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Unsupported');
  });

  it('should generate auth URL for github provider', async () => {
    const request = new NextRequest('http://localhost:3000/api/oauth/github/auth-url', {
      method: 'POST',
      body: JSON.stringify({ state: 'test-state-123', redirectUri: 'http://localhost:3000/callback' }),
    });
    const response = await POST(request, { params: Promise.resolve({ provider: 'github' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.authUrl).toContain('github.com');
    expect(data.authUrl).toContain('client_id');
    expect(data.authUrl).toContain('state=test-state-123');
  });

  it('should generate auth URL for figma provider', async () => {
    const request = new NextRequest('http://localhost:3000/api/oauth/figma/auth-url', {
      method: 'POST',
      body: JSON.stringify({ state: 'figma-state', redirectUri: 'http://localhost:3000/callback' }),
    });
    const response = await POST(request, { params: Promise.resolve({ provider: 'figma' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.authUrl).toContain('figma.com');
    expect(data.authUrl).toContain('client_id');
  });

  it('should handle missing state parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/oauth/github/auth-url', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: Promise.resolve({ provider: 'github' }) });
    const data = await response.json();

    // Should still work but without state
    expect(response.status).toBe(200);
  });
});
