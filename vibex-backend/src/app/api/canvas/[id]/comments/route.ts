/**
 * /api/canvas/[id]/comments — Canvas Comments API
 * Sprint86 E1: 画布评论标注系统
 *
 * GET  — List comments for a canvas (with optional node filter + pagination)
 * POST — Create a new comment on a canvas
 *
 * Frontend: commentStore.ts calls GET /api/canvas/{id}/comments?nodeId=...&limit=20&offset=0
 * and POST to create comments with author info + mentions
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

interface CommentRow {
  id: string;
  canvas_id: string;
  node_id: string | null;
  parent_id: string | null;
  author_id: string;
  author_name: string;
  content: string;
  mentions: string;
  is_resolved: number;
  created_at: string;
  updated_at: string;
}

interface ReactionRow {
  id: string;
  comment_id: string;
  user_id: string;
  type: string;
  created_at: string;
}

function rowToComment(row: CommentRow) {
  return {
    id: row.id,
    canvasId: row.canvas_id,
    nodeId: row.node_id ?? undefined,
    parentId: row.parent_id ?? undefined,
    authorId: row.author_id,
    authorName: row.author_name,
    content: row.content,
    mentions: JSON.parse(row.mentions || '[]'),
    isResolved: Boolean(row.is_resolved),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

// GET /api/canvas/[id]/comments?nodeId=...&limit=20&offset=0
export async function GET(
  request: NextRequest,
  context: { env: Env } & { params: Promise<{ id: string }> }
) {
  try {
    const { id: canvasId } = await context.params;
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const env = context.env;

    // Build query
    let sql = `SELECT id, canvas_id, node_id, parent_id, author_id, author_name,
               content, mentions, is_resolved, created_at, updated_at
        FROM comments WHERE canvas_id = ?`;
    const params: unknown[] = [canvasId];

    if (nodeId) {
      sql += ' AND node_id = ?';
      params.push(nodeId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await queryDB<CommentRow>(env, sql, params);
    const comments = rows.map(rowToComment);

    // Total count
    let countSql = 'SELECT COUNT(*) as cnt FROM comments WHERE canvas_id = ?';
    const countParams: unknown[] = [canvasId];
    if (nodeId) {
      countSql += ' AND node_id = ?';
      countParams.push(nodeId);
    }
    const countRow = await queryOne<{ cnt: number }>(env, countSql, countParams);
    const total = countRow?.cnt ?? 0;

    return NextResponse.json({ comments, total, limit, offset });
  } catch (err) {
    safeError('[canvas/comments] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/canvas/[id]/comments — Create a new comment
export async function POST(
  request: NextRequest,
  context: { env: Env } & { params: Promise<{ id: string }> }
) {
  try {
    const { id: canvasId } = await context.params;
    const body = await request.json();
    const {
      nodeId,
      parentId,
      authorId,
      authorName,
      content,
      mentions,
    } = body;

    // Validate required fields
    if (!authorId || !authorName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: authorId, authorName, content' },
        { status: 400 }
      );
    }

    const env = context.env;
    const id = generateId();
    const now = new Date().toISOString();
    const mentionsJson = Array.isArray(mentions) ? JSON.stringify(mentions) : '[]';

    await executeDB(
      env,
      `INSERT INTO comments
        (id, canvas_id, node_id, parent_id, author_id, author_name, content, mentions, is_resolved, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, canvasId, nodeId ?? null, parentId ?? null, authorId, authorName, content, mentionsJson, now, now]
    );

    return NextResponse.json({ id, created_at: now }, { status: 201 });
  } catch (err) {
    safeError('[canvas/comments] POST error:', err);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
