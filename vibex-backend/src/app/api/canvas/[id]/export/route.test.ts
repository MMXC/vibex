/**
 * route.test.ts — /api/canvas/[id]/export Jest Tests
 * Sprint94 E4: Canvas Export as Code
 *
 * Tests:
 * 1. GET without auth → 401 Unauthorized
 * 2. GET with valid auth + format=react → returns JSX string with component
 * 3. GET with valid auth + format=svg → returns SVG XML string
 * 4. GET with valid auth + format=md → returns Markdown string
 * 5. GET with valid auth + format=json → returns JSON object
 * 6. GET with invalid format → 400 Bad Request
 * 7. GET with non-existent canvas → 404 Not Found
 */

const mockQueryDB = jest.fn();

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  safeError: (...args: unknown[]) => {
    console.error('[safeError]', ...args);
  },
  Env: {},
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn((request: Request) => {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return { success: false, user: null };
    }
    // Use userId to match auth pattern: canvas.owner_id !== user.userId → 403
    return { success: true, user: { userId: 'user-001', email: 'test@example.com' } };
  }),
}));

const MOCK_CANVAS = {
  id: 'canvas-001',
  name: 'Test Canvas',
  owner_id: 'user-001',
};

const MOCK_CARDS = [
  {
    id: 'card-001',
    canvas_id: 'canvas-001',
    chapter_id: 'chapter-1',
    title: 'Bounded Context A',
    description: 'Core domain context',
    content: null,
    type: 'context',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    metadata: null,
  },
  {
    id: 'card-002',
    canvas_id: 'canvas-001',
    chapter_id: 'chapter-1',
    title: 'Bounded Context B',
    description: 'Supporting domain',
    content: null,
    type: 'context',
    x: 400,
    y: 100,
    width: 200,
    height: 100,
    metadata: null,
  },
];

const MOCK_EDGES = [
  {
    id: 'edge-001',
    canvas_id: 'canvas-001',
    source_card_id: 'card-001',
    target_card_id: 'card-002',
    source_chapter_id: 'chapter-1',
    target_chapter_id: 'chapter-1',
    label: '上游依赖',
    type: 'dependency',
  },
];

// Import the route module
import { GET } from './route';
import { NextRequest } from 'next/server';

function makeRequest(canvasId: string, format?: string): NextRequest {
  const url = new URL(`http://localhost/api/canvas/${canvasId}/export`);
  if (format) url.searchParams.set('format', format);
  return new NextRequest(url, {
    headers: {
      Authorization: 'Bearer valid-token',
    },
  });
}

function makeUnauthorizedRequest(canvasId: string, format?: string): NextRequest {
  const url = new URL(`http://localhost/api/canvas/${canvasId}/export`);
  if (format) url.searchParams.set('format', format);
  return new NextRequest(url);
}

describe('GET /api/canvas/[id]/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryDB.mockImplementation((_env: unknown, sql: string) => {
      if (sql.includes('FROM canvases')) return [MOCK_CANVAS];
      if (sql.includes('FROM canvas_cards')) return MOCK_CARDS;
      if (sql.includes('FROM canvas_edges')) return MOCK_EDGES;
      return [];
    });
  });

  describe('Auth', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const req = makeUnauthorizedRequest('canvas-001', 'json');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Format: JSON', () => {
    it('returns JSON export with correct structure', async () => {
      const req = makeRequest('canvas-001', 'json');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.filename).toMatch(/\.json$/);
      expect(body.mimeType).toBe('application/json');
      const parsed = JSON.parse(body.data);
      expect(parsed.canvas.id).toBe('canvas-001');
      expect(parsed.cards).toHaveLength(2);
      expect(parsed.edges).toHaveLength(1);
      expect(parsed.stats.totalCards).toBe(2);
      expect(parsed.stats.totalEdges).toBe(1);
    });

    it('returns 404 when canvas does not exist', async () => {
      mockQueryDB.mockImplementationOnce(() => []);
      const req = makeRequest('nonexistent', 'json');
      const response = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }), env: {} as never });
      expect(response.status).toBe(404);
    });
  });

  describe('Format: React', () => {
    it('returns JSX string with CanvasDiagram component', async () => {
      const req = makeRequest('canvas-001', 'react');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.filename).toMatch(/\.jsx$/);
      expect(body.mimeType).toBe('text/javascript');
      expect(body.data).toContain('CanvasDiagram');
      expect(body.data).toContain('export function CanvasDiagram');
      expect(body.data).toContain('Bounded Context A');
      expect(body.data).toContain('foreignObject');
      expect(body.data).toContain('{/* Edges */}');
    });

    it('includes card edges in React export', async () => {
      const req = makeRequest('canvas-001', 'react');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      const body = await response.json();
      expect(body.data).toContain('card-001');
      expect(body.data).toContain('card-002');
    });
  });

  describe('Format: SVG', () => {
    it('returns SVG XML string with proper structure', async () => {
      const req = makeRequest('canvas-001', 'svg');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.filename).toMatch(/\.svg$/);
      expect(body.mimeType).toBe('image/svg+xml');
      expect(body.data).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(body.data).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(body.data).toContain('<!-- Nodes -->');
      expect(body.data).toContain('<!-- Edges -->');
      expect(body.data).toContain('marker-end="url(#arrowhead)"');
    });

    it('escapes XML special characters in edge labels', async () => {
      // Override edge mock to return label with special chars
      const edgeWithSpecialChars = {
        ...MOCK_EDGES[0],
        label: 'A & B <C> "D"',
      };
      mockQueryDB.mockImplementation((_env: unknown, sql: string) => {
        if (sql.includes('FROM canvas_cards')) return MOCK_CARDS;
        if (sql.includes('FROM canvases')) return [MOCK_CANVAS];
        if (sql.includes('FROM canvas_edges')) return [edgeWithSpecialChars];
        return [];
      });
      const req = makeRequest('canvas-001', 'svg');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      const body = await response.json();
      // Edge labels are escaped; the SVG output should contain &amp; &lt; &gt; &quot;
      expect(body.data).toContain('&amp;');
      expect(body.data).toContain('&lt;');
      expect(body.data).toContain('&quot;');
    });
  });

  describe('Format: Markdown', () => {
    it('returns Markdown string with proper structure', async () => {
      const req = makeRequest('canvas-001', 'md');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.filename).toMatch(/\.md$/);
      expect(body.mimeType).toBe('text/markdown');
      expect(body.data).toContain('# Test Canvas');
      expect(body.data).toContain('## chapter-1');
      expect(body.data).toContain('### ✅ Bounded Context A');
      expect(body.data).toContain('**Type:** `context`');
      expect(body.data).toContain('## Connections');
      expect(body.data).toContain('Bounded Context A');
    });

    it('includes edge connections in Markdown export', async () => {
      const req = makeRequest('canvas-001', 'md');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      const body = await response.json();
      expect(body.data).toContain('上游依赖');
      expect(body.data).toContain('dependency');
      expect(body.data).toContain('card-001');
      expect(body.data).toContain('card-002');
    });
  });

  describe('Validation', () => {
    it('returns 400 when format is invalid', async () => {
      const req = makeRequest('canvas-001', 'invalid-format');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid format');
    });

    it('defaults to json format when format param is missing', async () => {
      const req = makeRequest('canvas-001');
      const response = await GET(req, { params: Promise.resolve({ id: 'canvas-001' }), env: {} as never });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.mimeType).toBe('application/json');
    });
  });
});
