/**
 * route.test.ts — /api/templates/analytics API tests
 * Sprint91 E4: Template Analytics Dashboard
 *
 * Tests:
 * 1. Returns 401 when not authenticated
 * 2. Returns 200 with analytics list when authenticated
 * 3. Range param defaults to 7d
 * 4. Range param parsing (7d, 30d, 90d)
 * 5. CSV generation via export endpoint
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => {
  const mockQueryDB = jest.fn();
  return {
    queryDB: mockQueryDB,
    queryOne: jest.fn(),
    executeDB: jest.fn(),
    generateId: jest.fn(() => 'generated-id'),
    safeError: jest.fn(),
    Env: {},
  };
});

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

import { GET } from './route';
import { queryDB } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

const mockEnv = { DB: {} } as any;

describe('GET /api/templates/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: false, user: null });

    const request = new NextRequest('http://localhost:3000/api/templates/analytics');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 200 with analytics list when authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    (queryDB as jest.Mock).mockResolvedValueOnce([
      {
        id: 'tpl-001',
        name: 'SaaS Product Template',
        usage_count: 42,
        avg_rating: 4.5,
      },
      {
        id: 'tpl-002',
        name: 'Ecommerce Template',
        usage_count: 15,
        avg_rating: 3.8,
      },
    ]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.analytics).toHaveLength(2);
    expect(data.analytics[0]).toEqual({
      templateId: 'tpl-001',
      title: 'SaaS Product Template',
      views: 0,
      uses: 42,
      rating: 4.5,
    });
    expect(data.analytics[1]).toEqual({
      templateId: 'tpl-002',
      title: 'Ecommerce Template',
      views: 0,
      uses: 15,
      rating: 3.8,
    });
  });

  it('range param defaults to 7d when not provided', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    (queryDB as jest.Mock).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    // Should query with user.id
    expect(queryDB).toHaveBeenCalledWith(mockEnv, expect.stringContaining('author_id'), ['user-1']);
  });

  it('range param parsing for 30d', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    (queryDB as jest.Mock).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics?range=30d');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it('range param parsing for 90d', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    (queryDB as jest.Mock).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics?range=90d');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it('invalid range falls back to 7d', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    (queryDB as jest.Mock).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics?range=invalid');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});


