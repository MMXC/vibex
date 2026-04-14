/**
 * Tests for DDS Canvas Cards & Relations API - E2
 *
 * Verifies:
 * - GET  /chapters/:chapterId/cards
 * - POST /chapters/:chapterId/cards
 * - PUT  /cards/:cardId
 * - DELETE /cards/:cardId
 * - PUT  /cards/:cardId/relations
 * - PUT  /cards/:cardId/position
 */

const mockQueryDB = jest.fn();
const mockQueryOne = jest.fn();
const mockExecuteDB = jest.fn();
const mockGenerateId = jest.fn(() => 'test-card-id-xyz');

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: () => mockGenerateId(),
}));

// Import cards and relations routes AFTER mocks
/* eslint-disable @typescript-eslint/no-require-imports */
const cardsRoutes = require('../dds/cards').default;
const relationsRoutes = require('../dds/relations').default;

const buildApp = () => {
  const { Hono } = require('hono');
  const app = new Hono();
  app.route('/', cardsRoutes);
  app.route('/', relationsRoutes);
  return app;
};

const mockEnv = { DB: {}, JWT_SECRET: 'test-secret' };

// ─── Shared test data ────────────────────────────────────────────────────────
const mockChapter = {
  id: 'chapter-1',
  project_id: 'proj-1',
  type: 'flow',
  created_at: '2026-04-10T10:00:00Z',
  updated_at: '2026-04-10T10:00:00Z',
};

const mockCardRows = [
  {
    id: 'card-1',
    chapter_id: 'chapter-1',
    type: 'user-story',
    title: 'As a user I want to login',
    data: '{"description":"Login feature"}',
    position_x: 100,
    position_y: 200,
    created_at: '2026-04-10T11:00:00Z',
    updated_at: '2026-04-10T11:00:00Z',
  },
  {
    id: 'card-2',
    chapter_id: 'chapter-1',
    type: 'flow-step',
    title: 'Step 1',
    data: '{}',
    position_x: 300,
    position_y: 400,
    created_at: '2026-04-10T12:00:00Z',
    updated_at: '2026-04-10T12:00:00Z',
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('DDS Cards API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  // ── GET /chapters/:chapterId/cards ─────────────────────────────────────────

  describe('GET /chapters/:chapterId/cards', () => {
    it('returns 404 when chapter does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const res = await app.request('/chapters/nonexistent/cards', {}, mockEnv);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns list of cards for a chapter', async () => {
      mockQueryOne.mockResolvedValueOnce(mockChapter);
      mockQueryDB.mockResolvedValueOnce(mockCardRows);

      const res = await app.request('/chapters/chapter-1/cards', {}, mockEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].id).toBe('card-1');
      expect(body.data[0].data).toEqual({ description: 'Login feature' });
      expect(body.data[0].position).toEqual({ x: 100, y: 200 });
    });

    it('returns empty array when no cards exist', async () => {
      mockQueryOne.mockResolvedValueOnce(mockChapter);
      mockQueryDB.mockResolvedValueOnce([]);

      const res = await app.request('/chapters/chapter-1/cards', {}, mockEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ── POST /chapters/:chapterId/cards ────────────────────────────────────────

  describe('POST /chapters/:chapterId/cards', () => {
    it('returns 404 when chapter does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const res = await app.request(
        '/chapters/nonexistent/cards',
        { method: 'POST', body: JSON.stringify({ type: 'user-story', title: 'Test' }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );
      expect(res.status).toBe(404);
    });

    it('returns 422 when type or title is missing', async () => {
      mockQueryOne.mockResolvedValueOnce(mockChapter);

      const res = await app.request(
        '/chapters/chapter-1/cards',
        { method: 'POST', body: JSON.stringify({ type: 'user-story' }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates a card successfully', async () => {
      // Card returned after insert should match generated ID
      const createdCard = { ...mockCardRows[0], id: 'test-card-id-xyz' };
      mockQueryOne
        .mockResolvedValueOnce(mockChapter)          // chapter existence check
        .mockResolvedValueOnce(createdCard);          // fetch created card

      const res = await app.request(
        '/chapters/chapter-1/cards',
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'user-story',
            title: 'As a user I want to login',
            data: { description: 'Login feature' },
            position: { x: 100, y: 200 },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('test-card-id-xyz');
      expect(body.data.title).toBe('As a user I want to login');
      expect(body.data.position).toEqual({ x: 100, y: 200 });
    });

    it('creates a card with default position when not provided', async () => {
      const createdCard = { ...mockCardRows[0], id: 'test-card-id-xyz', position_x: 0, position_y: 0 };
      mockQueryOne
        .mockResolvedValueOnce(mockChapter)
        .mockResolvedValueOnce(createdCard);

      const res = await app.request(
        '/chapters/chapter-1/cards',
        {
          method: 'POST',
          body: JSON.stringify({ type: 'user-story', title: 'Simple card' }),
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.position).toEqual({ x: 0, y: 0 });
    });
  });

  // ── PUT /cards/:cardId ─────────────────────────────────────────────────────

  describe('PUT /cards/:cardId', () => {
    it('returns 404 when card does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const res = await app.request(
        '/cards/nonexistent',
        { method: 'PUT', body: JSON.stringify({ title: 'Updated' }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );
      expect(res.status).toBe(404);
    });

    it('updates title only', async () => {
      mockQueryOne
        .mockResolvedValueOnce(mockCardRows[0])
        .mockResolvedValueOnce({ ...mockCardRows[0], title: 'Updated title' });

      const res = await app.request(
        '/cards/card-1',
        { method: 'PUT', body: JSON.stringify({ title: 'Updated title' }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Updated title');
    });

    it('updates position only', async () => {
      mockQueryOne
        .mockResolvedValueOnce(mockCardRows[0])
        .mockResolvedValueOnce({ ...mockCardRows[0], position_x: 500, position_y: 600 });

      const res = await app.request(
        '/cards/card-1',
        { method: 'PUT', body: JSON.stringify({ position: { x: 500, y: 600 } }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.position).toEqual({ x: 500, y: 600 });
    });

    it('updates data JSON field', async () => {
      mockQueryOne
        .mockResolvedValueOnce(mockCardRows[0])
        .mockResolvedValueOnce({ ...mockCardRows[0], data: '{"description":"updated"}' });

      const res = await app.request(
        '/cards/card-1',
        { method: 'PUT', body: JSON.stringify({ data: { description: 'updated' } }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.data).toEqual({ description: 'updated' });
    });
  });

  // ── DELETE /cards/:cardId ──────────────────────────────────────────────────

  describe('DELETE /cards/:cardId', () => {
    it('returns 404 when card does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const res = await app.request('/cards/nonexistent', { method: 'DELETE' }, mockEnv);
      expect(res.status).toBe(404);
    });

    it('deletes card and associated edges', async () => {
      mockQueryOne.mockResolvedValueOnce(mockCardRows[0]);
      mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 });
      mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 });

      const res = await app.request('/cards/card-1', { method: 'DELETE' }, mockEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // Should delete edges first, then the card
      expect(mockExecuteDB).toHaveBeenCalledTimes(2);
    });
  });
});

describe('DDS Relations & Position API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  // ── PUT /cards/:cardId/relations ────────────────────────────────────────────

  describe('PUT /cards/:cardId/relations', () => {
    it('returns 404 when card does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const res = await app.request(
        '/cards/nonexistent/relations',
        { method: 'PUT', body: JSON.stringify({ edges: [] }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );
      expect(res.status).toBe(404);
    });

    it('returns 422 when edges is not an array', async () => {
      const res = await app.request(
        '/cards/card-1/relations',
        { method: 'PUT', body: JSON.stringify({ edges: 'not-array' }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );
      expect(res.status).toBe(422);
    });

    it('replaces edges and returns updated list', async () => {
      const mockEdges = [
        { id: 'edge-1', chapter_id: 'chapter-1', source_id: 'card-1', target_id: 'card-2', type: 'smoothstep', created_at: '2026-04-10T13:00:00Z' },
      ];

      mockQueryOne.mockResolvedValueOnce(mockCardRows[0]); // card existence
      mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 0 }); // delete old edges
      mockQueryOne.mockResolvedValueOnce(mockCardRows[1]); // target card check
      mockExecuteDB.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 1 }); // insert new edge
      mockQueryDB.mockResolvedValueOnce(mockEdges); // fetch updated edges

      const res = await app.request(
        '/cards/card-1/relations',
        {
          method: 'PUT',
          body: JSON.stringify({
            edges: [{ sourceId: 'card-1', targetId: 'card-2', type: 'smoothstep' }],
          }),
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].sourceId).toBe('card-1');
    });

    it('skips edges with invalid sourceId or targetId', async () => {
      mockQueryOne.mockResolvedValueOnce(mockCardRows[0]);
      mockExecuteDB.mockResolvedValueOnce({ changes: 0, lastInsertRowid: 0 });
      mockQueryDB.mockResolvedValueOnce([]);

      const res = await app.request(
        '/cards/card-1/relations',
        {
          method: 'PUT',
          body: JSON.stringify({ edges: [{ sourceId: '', targetId: '' }] }),
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      );

      expect(res.status).toBe(200);
      expect(mockExecuteDB).toHaveBeenCalledTimes(1); // only delete, no insert
    });
  });

  // ── PUT /cards/:cardId/position ─────────────────────────────────────────────

  describe('PUT /cards/:cardId/position', () => {
    it('returns 404 when card does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const res = await app.request(
        '/cards/nonexistent/position',
        { method: 'PUT', body: JSON.stringify({ x: 100, y: 200 }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );
      expect(res.status).toBe(404);
    });

    it('returns 422 when neither x nor y is a number', async () => {
      const res = await app.request(
        '/cards/card-1/position',
        { method: 'PUT', body: JSON.stringify({ x: 'not-a-number' }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );
      expect(res.status).toBe(422);
    });

    it('updates position x only', async () => {
      mockQueryOne
        .mockResolvedValueOnce(mockCardRows[0])
        .mockResolvedValueOnce({ ...mockCardRows[0], position_x: 999, position_y: 200 });

      const res = await app.request(
        '/cards/card-1/position',
        { method: 'PUT', body: JSON.stringify({ x: 999 }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.position.x).toBe(999);
      expect(body.data.position.y).toBe(200); // unchanged
    });

    it('updates position y only', async () => {
      mockQueryOne
        .mockResolvedValueOnce(mockCardRows[0])
        .mockResolvedValueOnce({ ...mockCardRows[0], position_x: 100, position_y: 888 });

      const res = await app.request(
        '/cards/card-1/position',
        { method: 'PUT', body: JSON.stringify({ y: 888 }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.position.y).toBe(888);
    });

    it('updates both x and y', async () => {
      mockQueryOne
        .mockResolvedValueOnce(mockCardRows[0])
        .mockResolvedValueOnce({ ...mockCardRows[0], position_x: 150, position_y: 250 });

      const res = await app.request(
        '/cards/card-1/position',
        { method: 'PUT', body: JSON.stringify({ x: 150, y: 250 }), headers: { 'Content-Type': 'application/json' } },
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.position).toEqual({ x: 150, y: 250 });
    });
  });
});

// ─── Chapters API Tests ────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-require-imports */
const chaptersRoutes = require('../dds/chapters').default;

const buildChaptersApp = () => {
  const { Hono } = require('hono');
  const app = new Hono();
  app.route('/', chaptersRoutes);
  return app;
};

describe('DDS Chapters API', () => {
  let app: ReturnType<typeof buildChaptersApp>;

  beforeEach(() => {
    mockQueryDB.mockReset();
    mockQueryOne.mockReset();
    mockExecuteDB.mockReset();
    app = buildChaptersApp();
  });

  describe('GET /chapters?projectId=xxx', () => {
    it('returns 422 if projectId is missing', async () => {
      const res = await require('supertest').default(app).get('/');
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('projectId');
    });

    it('returns chapters for a project', async () => {
      mockQueryDB.mockResolvedValueOnce([
        { id: 'ch-1', project_id: 'proj-1', type: 'requirement', created_at: '2026-04-10T10:00:00Z', updated_at: '2026-04-10T10:00:00Z' },
        { id: 'ch-2', project_id: 'proj-1', type: 'context', created_at: '2026-04-10T11:00:00Z', updated_at: '2026-04-10T11:00:00Z' },
      ]);
      const res = await require('supertest').default(app).get('/?projectId=proj-1');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true });
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toMatchObject({ id: 'ch-1', type: 'requirement' });
    });

    it('returns empty array if no chapters', async () => {
      mockQueryDB.mockResolvedValueOnce([]);
      const res = await require('supertest').default(app).get('/?projectId=proj-empty');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, data: [] });
    });

    it('returns 500 on DB error', async () => {
      mockQueryDB.mockRejectedValueOnce(new Error('DB error'));
      const res = await require('supertest').default(app).get('/?projectId=proj-1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /chapters?projectId=xxx&type=xxx', () => {
    it('returns 422 if projectId or type is missing', async () => {
      const res1 = await require('supertest').default(app).post('/');
      expect(res1.status).toBe(422);
    });

    it('returns 422 for invalid type', async () => {
      const res = await require('supertest').default(app).post('/?projectId=proj-1&type=invalid');
      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('type');
    });

    it('creates a chapter with valid params', async () => {
      mockExecuteDB.mockResolvedValueOnce({ meta: {} });
      mockQueryOne.mockResolvedValueOnce({ id: 'ch-new', project_id: 'proj-1', type: 'flow', created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z' });
      const res = await require('supertest').default(app).post('/?projectId=proj-1&type=flow');
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ success: true });
      expect(res.body.data).toMatchObject({ projectId: 'proj-1', type: 'flow' });
    });
  });
});
