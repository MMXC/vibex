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
    getAuthUserFromRequest.mockReturnValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    // AC-1.3.4: Unauthenticated logout should not set cookies
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie || '').not.toMatch(/auth_token=/i);
  });

  // AC-1.3.1: auth_token cleared with Max-Age=0
  it('should clear auth_token cookie on successful logout', async () => {
    const { getAuthUserFromRequest } = require('@/lib/authFromGateway');
    getAuthUserFromRequest.mockReturnValue({ userId: 'user123', email: 'test@example.com' });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.message).toContain('successfully');

    const setCookies = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''].filter(Boolean);
    const allCookies = setCookies.join('; ');
    expect(allCookies).toMatch(/auth_token=;/i);
    expect(allCookies).toMatch(/Max-Age=0/i);
  });

  // AC-1.3.2: auth_session cleared with Max-Age=0
  it('should clear auth_session cookie on successful logout', async () => {
    const { getAuthUserFromRequest } = require('@/lib/authFromGateway');
    getAuthUserFromRequest.mockReturnValue({ userId: 'user123', email: 'test@example.com' });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
    const response = await POST(request);

    const setCookies = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''].filter(Boolean);
    const allCookies = setCookies.join('; ');
    expect(allCookies).toMatch(/auth_session=;/i);
    expect(allCookies).toMatch(/Max-Age=0/i);
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
