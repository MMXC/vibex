/**
 * /api/canvas/[id]/access-history — Canvas Access History API
 * Sprint89 E1: Canvas Analytics Dashboard
 *
 * GET  — Get the last N access records for a canvas (default: 5)
 * POST — Record a new access event
 *
 * GET /api/canvas/[id]/access-history?limit=5
 *   Auth: required
 *   Returns: { ok: true, records: AccessRecord[] }
 *
 * POST /api/canvas/[id]/access-history
 *   Auth: required
 *   Body: { userId: string; userName: string; avatarUrl?: string }
 *   Returns: { ok: true }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, executeDB, generateId, safeError, Env } from '@/lib/db';

export const runtime = 'edge';

interface AccessHistoryRow {
  id: string;
  canvas_id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  accessed_at: string;
}

interface AccessRecord {
  id: string;
  canvasId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  accessedAt: string;
}

function rowToRecord(row: AccessHistoryRow): AccessRecord {
  return {
    id: row.id,
    canvasId: row.canvas_id,
    userId: row.user_id,
    userName: row.user_name,
    avatarUrl: row.avatar_url ?? undefined,
    accessedAt: row.accessed_at,
  };
}

// GET /api/canvas/[id]/access-history
export async function GET(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 50);

    const rows = await queryDB<AccessHistoryRow>(
      env,
      `SELECT id, canvas_id, user_id, user_name, avatar_url, accessed_at
       FROM canvas_access_history
       WHERE canvas_id = ?
       ORDER BY accessed_at DESC
       LIMIT ?`,
      [canvasId, limit]
    );

    const records: AccessRecord[] = rows.map(rowToRecord);

    return NextResponse.json({ ok: true, records });
  } catch (err) {
    safeError('[CanvasAccessHistory GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/canvas/[id]/access-history
export async function POST(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;
    const body = await request.json() as {
      userId: string;
      userName: string;
      avatarUrl?: string;
    };

    if (!body.userId || !body.userName) {
      return NextResponse.json({ ok: false, error: 'userId and userName are required' }, { status: 400 });
    }

    // Upsert: delete existing entry for this user + canvas, then insert new one
    // This ensures only the most recent access is stored per user per canvas
    const historyId = generateId();

    await executeDB(
      env,
      `DELETE FROM canvas_access_history WHERE canvas_id = ? AND user_id = ?`,
      [canvasId, body.userId]
    );

    await executeDB(
      env,
      `INSERT INTO canvas_access_history (id, canvas_id, user_id, user_name, avatar_url, accessed_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [historyId, canvasId, body.userId, body.userName, body.avatarUrl ?? null]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    safeError('[CanvasAccessHistory POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
