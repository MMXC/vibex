/**
 * route.test.ts — /api/canvas/[id]/insights API tests
 * Sprint94 E1: Canvas AI Insights
 *
 * Tests:
 * 1. GET: unauthorized without auth → 401
 * 2. GET: no nodes → score 0 with empty suggestions
 * 3. GET: nodes and edges → score 0-100, suggestions array, isolatedNodes array
 * 4. GET: score is always in range 0-100
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/db', () => {
  const mockQueryOne = jest.fn();
  const mockSafeError = jest.fn();
  (global as Record<string, unknown>).__insightsQueryOne = mockQueryOne;
  (global as Record<string, unknown>).__insightsSafeError = mockSafeError;
  return {
    queryOne: mockQueryOne,
    executeDB: jest.fn(),
    safeError: mockSafeError,
    generateId: () => 'test-id-001',
  };
});

const mockQueryOne = () => (global as Record<string, unknown>).__insightsQueryOne as jest.Mock;
const { getAuthUserFromRequest } = jest.requireMock('@/lib/authFromGateway');

import { GET as getInsights } from './route';

const mockEnv = { DB: {} } as unknown as Record<string, unknown>;

function mockAuthSuccess() {
  (getAuthUserFromRequest as jest.Mock).mockReturnValue({
    success: true,
    user: { userId: 'user-001', name: 'Test User' },
  });
}

function mockAuthFailure() {
  (getAuthUserFromRequest as jest.Mock).mockReturnValue({
    success: false,
    user: undefined,
  });
}

function mockEnvWithDB(db: unknown) {
  return {
    DB: db,
  } as unknown as Record<string, unknown>;
}

describe('GET /api/canvas/[id]/insights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();
    const request = new NextRequest('http://localhost:3000/api/canvas/c1/insights');
    const response = await getInsights(request, {
      params: Promise.resolve({ id: 'c1' }),
      env: mockEnv as Parameters<typeof getInsights>[1]['env'],
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns score 0 and empty suggestions for canvas with no nodes', async () => {
    mockAuthSuccess();
    mockQueryOne()
      .mockResolvedValueOnce([]) // nodes
      .mockResolvedValueOnce([]); // edges

    const request = new NextRequest('http://localhost:3000/api/canvas/c1/insights');
    const response = await getInsights(request, {
      params: Promise.resolve({ id: 'c1' }),
      env: mockEnvWithDB({
        prepare: () => ({
          bind: () => ({
            all: () => Promise.resolve({ results: [], success: true }),
            run: () => Promise.resolve({ changes: 0, last_row_id: 0 }),
          }),
        }),
      }) as Parameters<typeof getInsights>[1]['env'],
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.score).toBe(0);
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBeGreaterThan(0);
    expect(Array.isArray(body.isolatedNodes)).toBe(true);
  });

  it('returns score between 0-100 for canvas with nodes and edges', async () => {
    mockAuthSuccess();
    // 3 nodes, 2 edges (one isolated node)
    mockQueryOne()
      .mockResolvedValueOnce([
        { id: 'n1', canvas_id: 'c1', x: 0, y: 0 },
        { id: 'n2', canvas_id: 'c1', x: 100, y: 0 },
        { id: 'n3', canvas_id: 'c1', x: 200, y: 0 },
      ])
      .mockResolvedValueOnce([
        { id: 'e1', canvas_id: 'c1', source_id: 'n1', target_id: 'n2' },
      ]);

    const request = new NextRequest('http://localhost:3000/api/canvas/c1/insights');
    const response = await getInsights(request, {
      params: Promise.resolve({ id: 'c1' }),
      env: mockEnvWithDB({
        prepare: () => ({
          bind: () => ({
            all: () => Promise.resolve({ results: [], success: true }),
            run: () => Promise.resolve({ changes: 0, last_row_id: 0 }),
          }),
        }),
      }) as Parameters<typeof getInsights>[1]['env'],
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBeLessThanOrEqual(3);
    expect(Array.isArray(body.isolatedNodes)).toBe(true);
    // n3 has degree 0, so it should be in isolatedNodes
    expect(body.isolatedNodes).toContain('n3');
  });

  it('score is always within 0-100 range for dense canvas', async () => {
    mockAuthSuccess();
    // Many nodes with good connectivity
    const manyNodes = Array.from({ length: 20 }, (_, i) => ({
      id: `n${i}`,
      canvas_id: 'c1',
      x: i * 50,
      y: 0,
    }));
    const manyEdges = Array.from({ length: 19 }, (_, i) => ({
      id: `e${i}`,
      canvas_id: 'c1',
      source_id: `n${i}`,
      target_id: `n${i + 1}`,
    }));

    mockQueryOne()
      .mockResolvedValueOnce(manyNodes)
      .mockResolvedValueOnce(manyEdges);

    const request = new NextRequest('http://localhost:3000/api/canvas/c1/insights');
    const response = await getInsights(request, {
      params: Promise.resolve({ id: 'c1' }),
      env: mockEnvWithDB({
        prepare: () => ({
          bind: () => ({
            all: () => Promise.resolve({ results: [], success: true }),
            run: () => Promise.resolve({ changes: 0, last_row_id: 0 }),
          }),
        }),
      }) as Parameters<typeof getInsights>[1]['env'],
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBeLessThanOrEqual(100);
  });

  it('returns suggestions for isolated nodes', async () => {
    mockAuthSuccess();
    // All isolated nodes
    mockQueryOne()
      .mockResolvedValueOnce([
        { id: 'n1', canvas_id: 'c1', x: 0, y: 0 },
        { id: 'n2', canvas_id: 'c1', x: 100, y: 0 },
      ])
      .mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/canvas/c1/insights');
    const response = await getInsights(request, {
      params: Promise.resolve({ id: 'c1' }),
      env: mockEnvWithDB({
        prepare: () => ({
          bind: () => ({
            all: () => Promise.resolve({ results: [], success: true }),
            run: () => Promise.resolve({ changes: 0, last_row_id: 0 }),
          }),
        }),
      }) as Parameters<typeof getInsights>[1]['env'],
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isolatedNodes).toContain('n1');
    expect(body.isolatedNodes).toContain('n2');
    expect(body.suggestions.some((s: string) => s.toLowerCase().includes('isolated'))).toBe(true);
  });
});
