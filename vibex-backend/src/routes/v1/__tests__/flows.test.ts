/**
/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 */
 * Tests for Canvas Flows CRUD API - E1
 *
 * Verifies:
 * - GET / — list with pagination and projectId filter
 * - POST / — create flow
 * - GET /:id — get single flow
 * - PUT /:id — partial update
 * - DELETE /:id — delete
 */

const mockQueryDB = jest.fn();
const mockQueryOne = jest.fn();
const mockExecuteDB = jest.fn();
const mockGenerateId = jest.fn(() => 'test-flow-id-123');

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: () => mockGenerateId(),
}));

// Import flows AFTER mocks
const flowsRoutes = require('../flows').default;

const buildApp = () => {
  const { Hono } = require('hono');
  const app = new Hono();
  app.route('/', flowsRoutes);
  return app;
};

const mockEnv = { DB: {}, JWT_SECRET: 'test-secret' };

// ─── Test data ─────────────────────────────────────────────────────────────
const mockFlowRows = [
  {
    id: 'flow-1',
    name: 'Flow One',
    nodes: '[]',
    edges: '[]',
    projectId: 'proj-1',
    createdAt: '2026-04-05T10:00:00Z',
    updatedAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'flow-2',
    name: 'Flow Two',
    nodes: '[{"id":"n1"}]',
    edges: '[]',
    projectId: 'proj-1',
    createdAt: '2026-04-05T11:00:00Z',
    updatedAt: '2026-04-05T11:00:00Z',
  },
  {
    id: 'flow-3',
    name: 'Other Project Flow',
    nodes: '[]',
    edges: '[]',
    projectId: 'proj-2',
    createdAt: '2026-04-05T12:00:00Z',
    updatedAt: '2026-04-05T12:00:00Z',
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────
describe('Flows API - CRUD endpoints', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  describe('GET /', () => {
    it('returns paginated list of flows', async () => {
      mockQueryDB
        .mockResolvedValueOnce([{ cnt: 3 }])
        .mockResolvedValueOnce(mockFlowRows);

      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(3);
      expect(json.pagination.total).toBe(3);
      expect(json.pagination.page).toBe(1);
    });

    it('filters by projectId', async () => {
      mockQueryDB
        .mockResolvedValueOnce([{ cnt: 2 }])
        .mockResolvedValueOnce([mockFlowRows[0], mockFlowRows[1]]);

      const req = new Request('http://localhost/?projectId=proj-1');
      const res = await app.fetch(req, mockEnv);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(2);
      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['proj-1'])
      );
    });

    it('returns empty array when no flows', async () => {
      mockQueryDB
        .mockResolvedValueOnce([{ cnt: 0 }])
        .mockResolvedValueOnce([]);

      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual([]);
      expect(json.pagination.total).toBe(0);
    });

    it('handles pagination parameters', async () => {
      mockQueryDB
        .mockResolvedValueOnce([{ cnt: 50 }])
        .mockResolvedValueOnce([mockFlowRows[0]]);

      const req = new Request('http://localhost/?page=2&limit=1');
      const res = await app.fetch(req, mockEnv);
      const json = await res.json();

      expect(json.pagination.page).toBe(2);
      expect(json.pagination.limit).toBe(1);
    });
  });

  describe('POST /', () => {
    it('creates a flow with required fields', async () => {
      mockExecuteDB.mockResolvedValueOnce({ success: true });
      mockQueryOne.mockResolvedValueOnce({
        id: 'test-flow-id-123',
        name: 'New Flow',
        nodes: '[]',
        edges: '[]',
        projectId: 'proj-1',
        createdAt: '2026-04-05T10:00:00Z',
        updatedAt: '2026-04-05T10:00:00Z',
      });

      const req = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'proj-1', name: 'New Flow' }),
      });
      const res = await app.fetch(req, mockEnv);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('test-flow-id-123');
    });

    it('rejects create without projectId', async () => {
      const req = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'No Project' }),
      });
      const res = await app.fetch(req, mockEnv);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.code).toBe('VALIDATION_ERROR');
    });

    it('creates with nodes and edges arrays', async () => {
      mockExecuteDB.mockResolvedValueOnce({ success: true });
      mockQueryOne.mockResolvedValueOnce({
        id: 'test-flow-id-123',
        name: 'With Data',
        nodes: '[{"id":"node1"}]',
        edges: '[]',
        projectId: 'proj-1',
        createdAt: '2026-04-05T10:00:00Z',
        updatedAt: '2026-04-05T10:00:00Z',
      });

      const req = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'proj-1', name: 'With Data', nodes: [{ id: 'node1' }] }),
      });
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe('GET /:id', () => {
    it('returns a single flow by id', async () => {
      mockQueryOne.mockResolvedValueOnce(mockFlowRows[0]);

      const req = new Request('http://localhost/flow-1');
      const res = await app.fetch(req, mockEnv);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('flow-1');
      expect(json.data.name).toBe('Flow One');
    });

    it('returns 404 for non-existent flow', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/nonexistent');
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /:id', () => {
    it('updates flow name', async () => {
      mockQueryOne
        .mockResolvedValueOnce(mockFlowRows[0])
        .mockResolvedValueOnce({ ...mockFlowRows[0], name: 'Updated Name' });
      mockExecuteDB.mockResolvedValueOnce({ success: true });

      const req = new Request('http://localhost/flow-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('updates nodes array', async () => {
      const newNodes = [{ id: 'new-node' }];
      mockQueryOne
        .mockResolvedValueOnce(mockFlowRows[0])
        .mockResolvedValueOnce({ ...mockFlowRows[0], nodes: '[{"id":"new-node"}]' });
      mockExecuteDB.mockResolvedValueOnce({ success: true });

      const req = new Request('http://localhost/flow-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: newNodes }),
      });
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(200);
    });

    it('returns 404 when updating non-existent flow', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes an existing flow', async () => {
      mockQueryOne.mockResolvedValueOnce(mockFlowRows[0]);
      mockExecuteDB.mockResolvedValueOnce({ success: true });

      const req = new Request('http://localhost/flow-1', { method: 'DELETE' });
      const res = await app.fetch(req, mockEnv);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('returns 404 when deleting non-existent flow', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/nonexistent', { method: 'DELETE' });
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(404);
    });
  });
});
