import { NextRequest } from 'next/server';

// Mock fetch for external API calls
global.fetch = jest.fn();

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
}));

import { GET as ChatStatusGET } from './route';

describe('GET /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return API status', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat');
    const response = await ChatStatusGET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });
});
