/**
 * route.test.ts — /api/templates/analytics/export API tests
 * Sprint91 E4: Template Analytics Dashboard
 *
 * Tests:
 * 1. Returns 401 when not authenticated
 * 2. Generates CSV with correct headers
 * 3. CSV includes comment counts
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  queryDB: jest.fn(),
  queryOne: jest.fn(),
  executeDB: jest.fn(),
  generateId: jest.fn(() => 'generated-id'),
  safeError: jest.fn(),
  Env: {},
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

import { GET } from './route';
import { queryDB } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

const mockEnv = { DB: {} } as any;

describe('GET /api/templates/analytics/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: false, user: null });

    const request = new NextRequest('http://localhost:3000/api/templates/analytics/export');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('generates CSV with correct headers', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    // Templates query
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'tpl-001',
          name: 'SaaS Template',
          usage_count: 10,
          avg_rating: 4.0,
          rating_count: 5,
        },
      ])
      // Comments query
      .mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics/export');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv');
    const disposition = response.headers.get('Content-Disposition') ?? '';
    expect(disposition).toMatch(/attachment; filename=template-analytics-\d{4}-\d{2}-\d{2}\.csv/);

    const csvText = await response.text();
    expect(csvText).toContain('templateId,title,views,uses,rating,comments');
    expect(csvText).toContain('tpl-001');
    expect(csvText).toContain('SaaS Template');
    expect(csvText).toContain('0'); // views (not in schema)
    expect(csvText).toContain('10'); // uses
    expect(csvText).toContain('4'); // rating
  });

  it('CSV includes comment counts', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    // Templates query
    (queryDB as jest.Mock).mockResolvedValueOnce([
      {
        id: 'tpl-001',
        name: 'Test Template',
        usage_count: 5,
        avg_rating: 3.5,
        rating_count: 2,
      },
    ]);
    // Comments query
    (queryDB as jest.Mock).mockResolvedValueOnce([
      { template_id: 'tpl-001', comment_cnt: 3 },
    ]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics/export');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    expect(lines[1]).toContain('tpl-001');
    expect(lines[1]).toContain('3'); // comment count
  });

  it('handles multiple templates', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'tpl-001', name: 'Template One', usage_count: 10, avg_rating: 4.5, rating_count: 5 },
        { id: 'tpl-002', name: 'Template Two', usage_count: 5, avg_rating: 3.0, rating_count: 2 },
      ])
      .mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics/export');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(csvText).toContain('tpl-001');
    expect(csvText).toContain('tpl-002');
  });

  it('escapes quotes in title', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({
      success: true,
      user: { id: 'user-1', name: 'Alice' },
    });
    (queryDB as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'tpl-001', name: 'Template "with" quotes', usage_count: 5, avg_rating: 4.0, rating_count: 1 },
      ])
      .mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/templates/analytics/export');
    const response = await GET(request, { env: mockEnv });

    expect(response.status).toBe(200);
    const csvText = await response.text();
    // Quotes should be escaped as double quotes
    expect(csvText).toContain('Template ""with"" quotes');
  });
});
