/**
 * /api/canvas/annotations/[id] — Single annotation operations
 * Sprint90 E4: 画布自由批注层
 *
 * PATCH  — Update an annotation (content, status, position)
 * DELETE — Remove an annotation
 *
 * Used by AnnotationLayer to resolve (mark status='resolved') and delete marks.
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, executeDB, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

interface ApiContext {
  env: Env;
  params: Promise<{ id: string }>;
}

interface AnnotationRow {
  id: string;
  canvas_id: string;
  content: string;
  x: number;
  y: number;
  type: string;
  author_id: string;
  author_name: string | null;
  color: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToAnnotation(row: AnnotationRow) {
  return {
    id: row.id,
    canvasId: row.canvas_id,
    content: row.content,
    x: row.x,
    y: row.y,
    type: row.type,
    authorId: row.author_id,
    authorName: row.author_name ?? undefined,
    color: row.color ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

// PATCH /api/canvas/annotations/[id] — update content/status/position
export async function PATCH(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { content, status, x, y } = body;

    // Validate: at least one updatable field must be present
    if (
      content === undefined &&
      status === undefined &&
      x === undefined &&
      y === undefined
    ) {
      return NextResponse.json(
        { error: 'No updatable fields provided (content, status, x, y)' },
        { status: 400 }
      );
    }

    // Validate status enum
    if (status !== undefined && status !== 'active' && status !== 'resolved') {
      return NextResponse.json(
        { error: 'status must be "active" or "resolved"' },
        { status: 400 }
      );
    }

    // Validate coordinates if provided
    if (x !== undefined && (typeof x !== 'number' || !Number.isFinite(x))) {
      return NextResponse.json({ error: 'x must be a finite number' }, { status: 400 });
    }
    if (y !== undefined && (typeof y !== 'number' || !Number.isFinite(y))) {
      return NextResponse.json({ error: 'y must be a finite number' }, { status: 400 });
    }

    const env = context.env;

    // Build dynamic SET clause
    const sets: string[] = [];
    const params: unknown[] = [];

    if (content !== undefined) {
      sets.push('content = ?');
      params.push(String(content));
    }
    if (status !== undefined) {
      sets.push('status = ?');
      params.push(status);
    }
    if (x !== undefined) {
      sets.push('x = ?');
      params.push(x);
    }
    if (y !== undefined) {
      sets.push('y = ?');
      params.push(y);
    }
    sets.push('updated_at = ?');
    const now = new Date().toISOString();
    params.push(now);
    params.push(id);

    const result = await executeDB(
      env,
      `UPDATE annotations SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    // Return updated row
    const row = await queryOne<AnnotationRow>(
      env,
      `SELECT id, canvas_id, content, x, y, type, author_id, author_name,
              color, status, created_at, updated_at
       FROM annotations WHERE id = ?`,
      [id]
    );
    if (!row) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    return NextResponse.json(rowToAnnotation(row));
  } catch (err) {
    safeError('[canvas/annotations/:id] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update annotation' }, { status: 500 });
  }
}

// DELETE /api/canvas/annotations/[id]
export async function DELETE(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const { id } = await context.params;
    const env = context.env;
    const result = await executeDB(env, 'DELETE FROM annotations WHERE id = ?', [id]);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    safeError('[canvas/annotations/:id] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete annotation' }, { status: 500 });
  }
}