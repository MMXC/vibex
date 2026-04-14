/**
 * DDS Canvas Cards API - v1 REST Routes
 * /api/v1/dds/chapters/:chapterId/cards  — list/create cards
 * /api/v1/dds/cards/:cardId              — update/delete card
 *
 * Tables: dds_chapters, dds_cards
 * Framework: Hono + D1 via @/lib/db
 */

import { Hono } from 'hono';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { ERROR_CODES } from '@/lib/api-error';
import { safeError } from '@/lib/log-sanitizer';

const cards = new Hono<{ Bindings: Env }>();

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

interface ChapterRow {
  id: string;
  project_id: string;
  type: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// GET /chapters/:chapterId/cards — list cards in a chapter
// ============================================================

cards.get('/chapters/:chapterId/cards', async (c) => {
  try {
    const env = c.env;
    const { chapterId } = c.req.param();

    // Verify chapter exists
    const chapter = await queryOne<ChapterRow>(
      env,
      'SELECT * FROM dds_chapters WHERE id = ?',
      [chapterId]
    );
    if (!chapter) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Chapter not found' } },
        404
      );
    }

    const rows = await queryDB<CardRow>(
      env,
      'SELECT * FROM dds_cards WHERE chapter_id = ? ORDER BY created_at ASC',
      [chapterId]
    );

    // Parse data JSON for each card
    const cardsWithParsedData = rows.map((row) => {
      let parsedData: unknown = {};
      try {
        parsedData = JSON.parse(row.data || '{}');
      } catch { /* ignore */ }
      return {
        id: row.id,
        chapterId: row.chapter_id,
        type: row.type,
        title: row.title,
        data: parsedData,
        position: { x: row.position_x, y: row.position_y },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return c.json({ success: true, data: cardsWithParsedData });
  } catch (err) {
    safeError('[dds-cards] GET list error:', err);
    return c.json(
      { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to fetch cards' } },
      500
    );
  }
});

// ============================================================
// POST /chapters/:chapterId/cards — create a new card
// ============================================================

cards.post('/chapters/:chapterId/cards', async (c) => {
  try {
    const env = c.env;
    const { chapterId } = c.req.param();
    const body = await c.req.json();

    // Verify chapter exists
    const chapter = await queryOne<ChapterRow>(
      env,
      'SELECT * FROM dds_chapters WHERE id = ?',
      [chapterId]
    );
    if (!chapter) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Chapter not found' } },
        404
      );
    }

    const { type, title, data, position } = body;

    if (!type || !title) {
      return c.json(
        {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'type and title are required' },
        },
        422
      );
    }

    const id = generateId();
    const now = new Date().toISOString();
    const dataJson = typeof data === 'object' ? JSON.stringify(data) : (data ?? '{}');
    const posX = position?.x ?? 0;
    const posY = position?.y ?? 0;

    await executeDB(
      env,
      `INSERT INTO dds_cards (id, chapter_id, type, title, data, position_x, position_y, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, chapterId, type, title, dataJson, posX, posY, now, now]
    );

    const created = await queryOne<CardRow>(env, 'SELECT * FROM dds_cards WHERE id = ?', [id]);

    if (!created) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to create card' } },
        500
      );
    }

    let parsedData: unknown = {};
    try {
      parsedData = JSON.parse(created.data || '{}');
    } catch { /* ignore */ }

    return c.json(
      {
        success: true,
        data: {
          id: created.id,
          chapterId: created.chapter_id,
          type: created.type,
          title: created.title,
          data: parsedData,
          position: { x: created.position_x, y: created.position_y },
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        },
      },
      201
    );
  } catch (err) {
    safeError('[dds-cards] POST error:', err);
    return c.json(
      { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to create card' } },
      500
    );
  }
});

// ============================================================
// PUT /cards/:cardId — update a card
// ============================================================

cards.put('/cards/:cardId', async (c) => {
  try {
    const env = c.env;
    const { cardId } = c.req.param();
    const body = await c.req.json();

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

    if (body.type !== undefined) {
      updates.push('type = ?');
      values.push(body.type);
    }
    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.data !== undefined) {
      updates.push('data = ?');
      values.push(typeof body.data === 'object' ? JSON.stringify(body.data) : body.data);
    }
    if (body.position !== undefined) {
      if (body.position.x !== undefined) {
        updates.push('position_x = ?');
        values.push(body.position.x);
      }
      if (body.position.y !== undefined) {
        updates.push('position_y = ?');
        values.push(body.position.y);
      }
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
        { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to update card' } },
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
    safeError('[dds-cards] PUT error:', err);
    return c.json(
      { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to update card' } },
      500
    );
  }
});

// ============================================================
// DELETE /cards/:cardId — delete a card
// ============================================================

cards.delete('/cards/:cardId', async (c) => {
  try {
    const env = c.env;
    const { cardId } = c.req.param();

    const existing = await queryOne<CardRow>(env, 'SELECT * FROM dds_cards WHERE id = ?', [cardId]);
    if (!existing) {
      return c.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Card not found' } },
        404
      );
    }

    // Delete associated edges first
    await executeDB(env, 'DELETE FROM dds_edges WHERE source_id = ? OR target_id = ?', [cardId, cardId]);
    // Delete the card
    await executeDB(env, 'DELETE FROM dds_cards WHERE id = ?', [cardId]);

    return c.json({ success: true });
  } catch (err) {
    safeError('[dds-cards] DELETE error:', err);
    return c.json(
      { success: false, error: { code: ERROR_CODES.DATABASE_ERROR, message: 'Failed to delete card' } },
      500
    );
  }
});

export default cards;
