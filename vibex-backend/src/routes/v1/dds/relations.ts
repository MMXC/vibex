/**
 * DDS Canvas Relations & Position API - v1 REST Routes
 * /api/v1/dds/cards/:cardId/relations — manage card edges
 * /api/v1/dds/cards/:cardId/position   — update card position
 *
 * Tables: dds_cards, dds_edges
 * Framework: Hono + D1 via @/lib/db
 */

import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { ERROR_CODES } from '@/lib/api-error';
import { safeError } from '@/lib/log-sanitizer';

const relations = new Hono<{ Bindings: Env }>();

// ============================================================
// Type Definitions
// ============================================================

interface CardRow {
  id: string;
  chapter_id: string;
  type: string;
  title: string;
  data: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

interface EdgeRow {
  id: string;
  chapter_id: string;
  source_id: string;
  target_id: string;
  type: string;
  created_at: string;
}

// ============================================================
// Helper: parse edge row
// ============================================================

function parseEdgeRow(row: EdgeRow) {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    sourceId: row.source_id,
    targetId: row.target_id,
    type: row.type,
    createdAt: row.created_at,
  };
}

// ============================================================
// PUT /cards/:cardId/relations — replace card's outgoing edges
// ============================================================
// Body: { edges: EdgeInput[] }
// Strategy: DELETE all existing edges for this card, then INSERT new ones

relations.put('/cards/:cardId/relations', async (c) => {
  try {
    const env = c.env;
    const { cardId } = c.req.param();
    const body = await c.req.json();
    const { edges } = body;

    if (!Array.isArray(edges)) {
      return c.json(
        {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'edges must be an array' },
        },
        422
      );
    }

    // Verify card exists
    const card = await queryOne<CardRow>(env, 'SELECT * FROM dds_cards WHERE id = ?', [cardId]);
    if (!card) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Card not found' } },
        404
      );
    }

    const now = new Date().toISOString();
    const chapterId = card.chapter_id;

    // Delete all existing edges where this card is the source
    await executeDB(
      env,
      'DELETE FROM dds_edges WHERE source_id = ?',
      [cardId]
    );

    // Validate and insert new edges
    const createdEdges: ReturnType<typeof parseEdgeRow>[] = [];
    for (const edge of edges) {
      if (!edge.sourceId || !edge.targetId) {
        continue; // skip invalid entries
      }

      // Verify target card exists
      const targetCard = await queryOne<CardRow>(
        env,
        'SELECT * FROM dds_cards WHERE id = ?',
        [edge.targetId]
      );
      if (!targetCard) {
        continue; // skip dangling edges
      }

      const edgeId = edge.id ?? generateId();
      const edgeType = edge.type ?? 'smoothstep';

      await executeDB(
        env,
        `INSERT INTO dds_edges (id, chapter_id, source_id, target_id, type, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [edgeId, chapterId, edge.sourceId, edge.targetId, edgeType, now]
      );

      createdEdges.push({
        id: edgeId,
        chapterId,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        type: edgeType,
        createdAt: now,
      });
    }

    // Fetch updated edges for this card
    const allEdges = await queryDB<EdgeRow>(
      env,
      'SELECT * FROM dds_edges WHERE source_id = ? ORDER BY created_at ASC',
      [cardId]
    );

    return c.json({
      success: true,
      data: allEdges.map(parseEdgeRow),
    });
  } catch (err) {
    safeError('[dds-relations] PUT error:', err);
    return c.json(
      {
        success: false,
        error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to update relations' },
      },
      500
    );
  }
});

// ============================================================
// PUT /cards/:cardId/position — update card position only
// ============================================================

relations.put('/cards/:cardId/position', async (c) => {
  try {
    const env = c.env;
    const { cardId } = c.req.param();
    const body = await c.req.json();
    const { x, y } = body;

    if (typeof x !== 'number' && typeof y !== 'number') {
      return c.json(
        {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'x and/or y must be numbers' },
        },
        422
      );
    }

    // Check existence
    const existing = await queryOne<CardRow>(env, 'SELECT * FROM dds_cards WHERE id = ?', [cardId]);
    if (!existing) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Card not found' } },
        404
      );
    }

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const values: (string | number)[] = [now];

    if (typeof x === 'number') {
      updates.push('position_x = ?');
      values.push(x);
    }
    if (typeof y === 'number') {
      updates.push('position_y = ?');
      values.push(y);
    }

    values.push(cardId);
    await executeDB(
      env,
      `UPDATE dds_cards SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updated = await queryOne<CardRow>(env, 'SELECT * FROM dds_cards WHERE id = ?', [cardId]);

    if (!updated) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to update position' } },
        500
      );
    }

    let parsedData: unknown = {};
    try {
      parsedData = JSON.parse(updated.data || '{}');
    } catch { /* ignore */ }

    return c.json({
      success: true,
      data: {
        id: updated.id,
        chapterId: updated.chapter_id,
        type: updated.type,
        title: updated.title,
        data: parsedData,
        position: { x: updated.position_x, y: updated.position_y },
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (err) {
    safeError('[dds-relations] PUT position error:', err);
    return c.json(
      {
        success: false,
        error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to update position' },
      },
      500
    );
  }
});

export default relations;
