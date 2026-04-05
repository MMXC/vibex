/**
 * Canvas Flows API - v1 REST Routes
 * /api/v1/flows — CRUD for FlowData (React Flow canvas data)
 *
 * Endpoints:
 * GET    /api/v1/flows              — list flows (optionally filter by projectId)
 * POST   /api/v1/flows              — create a new flow
 * GET    /api/v1/flows/:id          — get a single flow by id
 * PUT    /api/v1/flows/:id          — update a flow
 * DELETE /api/v1/flows/:id          — delete a flow
 *
 * Based on: FlowData model (nodes TEXT, edges TEXT, projectId TEXT)
 * Framework: Hono + D1 (Cloudflare Workers) via @/lib/db
 */

import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

const flows = new Hono<{ Bindings: Env }>();

// ============================================================
// Type Definitions
// ============================================================

interface FlowDataRow {
  id: string;
  name: string | null;
  nodes: string;
  edges: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface FlowWithParsed extends Omit<FlowDataRow, 'nodes' | 'edges'> {
  nodes: unknown;
  edges: unknown;
}

// ============================================================
// Helper: parse flow row (deserialize JSON columns)
// ============================================================

function parseFlowRow(row: FlowDataRow): FlowWithParsed {
  let parsedNodes: unknown = [];
  let parsedEdges: unknown = [];
  try {
    parsedNodes = JSON.parse(row.nodes || '[]');
  } catch { /* ignore parse errors */ }
  try {
    parsedEdges = JSON.parse(row.edges || '[]');
  } catch { /* ignore parse errors */ }
  return {
    ...row,
    nodes: parsedNodes,
    edges: parsedEdges,
  };
}

// ============================================================
// GET /api/v1/flows — list flows with optional projectId filter + pagination
// ============================================================

flows.get('/', async (c) => {
  try {
    const env = c.env;
    const projectId = c.req.query('projectId');
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: (string | number)[] = [];

    if (projectId) {
      whereClause = 'WHERE projectId = ?';
      params.push(projectId);
    }

    // Get total count
    const countResult = await queryDB<{ cnt: number }>(
      env,
      `SELECT COUNT(*) as cnt FROM FlowData ${whereClause}`,
      params
    );
    const total = countResult[0]?.cnt ?? 0;

    // Get paginated rows
    const rows = await queryDB<FlowDataRow>(
      env,
      `SELECT * FROM FlowData ${whereClause} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return c.json({
      success: true,
      data: rows.map(parseFlowRow),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[flows] GET error:', err);
    return c.json(
      { success: false, error: 'Failed to fetch flows', code: 'FETCH_ERROR', statusCode: 500 },
      500
    );
  }
});

// ============================================================
// POST /api/v1/flows — create a new flow
// ============================================================

flows.post('/', async (c) => {
  try {
    const env = c.env;
    const body = await c.req.json();
    const { projectId, name, nodes, edges } = body;

    if (!projectId) {
      return c.json(
        { success: false, error: 'projectId is required', code: 'VALIDATION_ERROR', statusCode: 400 },
        400
      );
    }

    const id = generateId();
    const now = new Date().toISOString();
    const nodesJson = Array.isArray(nodes) ? JSON.stringify(nodes) : (nodes ?? '[]');
    const edgesJson = Array.isArray(edges) ? JSON.stringify(edges) : (edges ?? '[]');

    await executeDB(
      env,
      `INSERT INTO FlowData (id, name, nodes, edges, projectId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name ?? null, nodesJson, edgesJson, projectId, now, now]
    );

    const created = await queryOne<FlowDataRow>(env, 'SELECT * FROM FlowData WHERE id = ?', [id]);

    return c.json(
      { success: true, data: created ? parseFlowRow(created) : null },
      201
    );
  } catch (err) {
    console.error('[flows] POST error:', err);
    return c.json(
      { success: false, error: 'Failed to create flow', code: 'CREATE_ERROR', statusCode: 500 },
      500
    );
  }
});

// ============================================================
// GET /api/v1/flows/:id — get a single flow by id
// ============================================================

flows.get('/:id', async (c) => {
  try {
    const env = c.env;
    const { id } = c.req.param();

    const row = await queryOne<FlowDataRow>(env, 'SELECT * FROM FlowData WHERE id = ?', [id]);

    if (!row) {
      return c.json(
        { success: false, error: 'Flow not found', code: 'NOT_FOUND', statusCode: 404 },
        404
      );
    }

    return c.json({ success: true, data: parseFlowRow(row) });
  } catch (err) {
    console.error('[flows] GET/:id error:', err);
    return c.json(
      { success: false, error: 'Failed to fetch flow', code: 'FETCH_ERROR', statusCode: 500 },
      500
    );
  }
});

// ============================================================
// PUT /api/v1/flows/:id — update a flow
// ============================================================

flows.put('/:id', async (c) => {
  try {
    const env = c.env;
    const { id } = c.req.param();
    const body = await c.req.json();
    const { name, nodes, edges } = body;

    // Check existence first
    const existing = await queryOne<FlowDataRow>(env, 'SELECT * FROM FlowData WHERE id = ?', [id]);
    if (!existing) {
      return c.json(
        { success: false, error: 'Flow not found', code: 'NOT_FOUND', statusCode: 404 },
        404
      );
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: string[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (nodes !== undefined) {
      updates.push('nodes = ?');
      values.push(Array.isArray(nodes) ? JSON.stringify(nodes) : nodes);
    }
    if (edges !== undefined) {
      updates.push('edges = ?');
      values.push(Array.isArray(edges) ? JSON.stringify(edges) : edges);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id);
      await executeDB(
        env,
        `UPDATE FlowData SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updated = await queryOne<FlowDataRow>(env, 'SELECT * FROM FlowData WHERE id = ?', [id]);

    return c.json({ success: true, data: updated ? parseFlowRow(updated) : null });
  } catch (err) {
    console.error('[flows] PUT error:', err);
    return c.json(
      { success: false, error: 'Failed to update flow', code: 'UPDATE_ERROR', statusCode: 500 },
      500
    );
  }
});

// ============================================================
// DELETE /api/v1/flows/:id — delete a flow
// ============================================================

flows.delete('/:id', async (c) => {
  try {
    const env = c.env;
    const { id } = c.req.param();

    const existing = await queryOne<FlowDataRow>(env, 'SELECT * FROM FlowData WHERE id = ?', [id]);
    if (!existing) {
      return c.json(
        { success: false, error: 'Flow not found', code: 'NOT_FOUND', statusCode: 404 },
        404
      );
    }

    await executeDB(env, 'DELETE FROM FlowData WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (err) {
    console.error('[flows] DELETE error:', err);
    return c.json(
      { success: false, error: 'Failed to delete flow', code: 'DELETE_ERROR', statusCode: 500 },
      500
    );
  }
});

export default flows;
