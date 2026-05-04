import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

import { POST } from './route';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const { getAuthUserFromRequest } = require('@/lib/authFromGateway');
    getAuthUserFromRequest.mockReturnValue({ success: false, user: null });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should logout successfully', async () => {
    const { getAuthUserFromRequest } = require('@/lib/authFromGateway');
    getAuthUserFromRequest.mockReturnValue({ success: true, user: { userId: 'user123', email: 'test@example.com' } });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.message).toContain('successfully');
  });

  it('should handle errors', async () => {
    const { getAuthUserFromRequest } = require('@/lib/authFromGateway');
    getAuthUserFromRequest.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
