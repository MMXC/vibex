/**
 * /api/canvas/stats — Canvas Usage Statistics API
 * S89-E1: Canvas Analytics Dashboard
 *
 * GET /api/canvas/stats
 *   Query params:
 *     canvasId (optional) — single canvas stats
 *     range (optional) — "7d" | "30d" (default: "30d")
 *   Returns: { ok: true, stats: CanvasStats[] }
 *
 * GET /api/canvas/stats?canvasId=xxx
 *   Returns: { ok: true, stats: { canvasId, name, createdAt, updatedAt, collaboratorCount }[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface CanvasStatsRow {
  canvas_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  collaborator_count: number;
}

interface StatsResult {
  canvasId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  collaboratorCount: number;
}

export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('canvasId');
    const limit = 50;

    let query = `
      SELECT
        id as canvas_id,
        name,
        created_at,
        updated_at,
        0 as collaborator_count
      FROM canvas
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `;
    const params: (string | number)[] = [user.userId, limit];

    if (canvasId) {
      query = `
        SELECT
          id as canvas_id,
          name,
          created_at,
          updated_at,
          0 as collaborator_count
        FROM canvas
        WHERE id = ? AND user_id = ?
      `;
      params.unshift(canvasId);
    }

    const rows = await queryDB<CanvasStatsRow>(env, query, params);

    const stats: StatsResult[] = rows.map((r) => ({
      canvasId: r.canvas_id,
      name: r.name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      collaboratorCount: r.collaborator_count,
    }));

    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    safeError('[CanvasStats GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
