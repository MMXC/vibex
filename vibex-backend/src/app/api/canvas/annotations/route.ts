/**
 * /api/canvas/annotations — Canvas Annotation Layer API
 * Sprint90 E4: 画布自由批注层
 *
 * GET  — List annotations for a canvas (canvasId via query param)
 * POST — Create a new annotation on a canvas
 *
 * Unlike /comments (which are bound to nodes), annotations are free-floating
 * marks at canvas coordinates (x, y). Rendered by AnnotationLayer which
 * inherits CSS transform from the canvas grid for pan/zoom sync.
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

export const runtime = 'edge';

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

interface ApiContext {
  env: Env;
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

// GET /api/canvas/annotations?canvasId=...&status=active&limit=50&offset=0
export async function GET(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('canvasId');
    const status = searchParams.get('status') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!canvasId) {
      return NextResponse.json(
        { error: 'canvasId query parameter is required' },
        { status: 400 }
      );
    }

    const env = context.env;

    let sql = `SELECT id, canvas_id, content, x, y, type, author_id, author_name,
               color, status, created_at, updated_at
        FROM annotations WHERE canvas_id = ?`;
    const params: unknown[] = [canvasId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await queryDB<AnnotationRow>(env, sql, params);
    const annotations = rows.map(rowToAnnotation);

    let countSql = 'SELECT COUNT(*) as cnt FROM annotations WHERE canvas_id = ?';
    const countParams: unknown[] = [canvasId];
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    const countRow = await queryOne<{ cnt: number }>(env, countSql, countParams);
    const total = countRow?.cnt ?? 0;

    return NextResponse.json({ annotations, total, limit, offset });
  } catch (err) {
    safeError('[canvas/annotations] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch annotations' }, { status: 500 });
  }
}

// POST /api/canvas/annotations — Create a new annotation
export async function POST(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const body = await request.json();
    const { canvasId, content, x, y, type, authorName, color } = body;

    // Validate required fields
    if (!canvasId || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Missing required fields: canvasId, content' },
        { status: 400 }
      );
    }
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
      return NextResponse.json(
        { error: 'x and y must be finite numbers' },
        { status: 400 }
      );
    }

    // Auth: prefer gateway-injected user, fall back to body fields for offline-first flows
    const auth = getAuthUserFromRequest(request);
    const authorId = auth.success && auth.user ? auth.user.userId : (body.authorId ?? 'anonymous');
    const resolvedAuthorName = authorName ?? auth.user?.name ?? auth.user?.email ?? 'Anonymous';
    const resolvedColor = color ?? null;

    const env = context.env;
    const id = generateId();
    const now = new Date().toISOString();
    const resolvedType = type ?? 'point';

    await executeDB(
      env,
      `INSERT INTO annotations
        (id, canvas_id, content, x, y, type, author_id, author_name, color, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [id, canvasId, content, x, y, resolvedType, authorId, resolvedAuthorName, resolvedColor, now, now]
    );

    return NextResponse.json(
      {
        id,
        canvasId,
        content,
        x,
        y,
        type: resolvedType,
        authorId,
        authorName: resolvedAuthorName,
        color: resolvedColor,
        status: 'active',
        createdAt: new Date(now).getTime(),
        updatedAt: new Date(now).getTime(),
      },
      { status: 201 }
    );
  } catch (err) {
    safeError('[canvas/annotations] POST error:', err);
    return NextResponse.json({ error: 'Failed to create annotation' }, { status: 500 });
  }
}