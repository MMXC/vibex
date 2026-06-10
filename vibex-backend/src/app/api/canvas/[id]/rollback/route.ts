/**
 * /api/canvas/:id/rollback — Version Rollback API
 *
 * S85-E4: 分支合并预览与回滚
 *
 * POST /api/canvas/:id/rollback — Record a version rollback event in D1
 *   Body: { snapshotId: string; snapshotName?: string; userId: string }
 *   Returns: { ok: boolean; eventId?: string; error?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { executeDB, generateId, safeError, Env } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;

    if (!canvasId) {
      return NextResponse.json({ ok: false, error: 'Missing canvas ID' }, { status: 400 });
    }

    let body: {
      snapshotId?: string;
      snapshotName?: string;
      userId?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { snapshotId, snapshotName, userId } = body;

    if (!snapshotId || !userId) {
      return NextResponse.json(
        { ok: false, error: 'snapshotId and userId are required' },
        { status: 400 }
      );
    }

    const eventId = generateId();
    await executeDB(
      env,
      `INSERT INTO rollback_events (id, canvas_id, snapshot_id, snapshot_name, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [eventId, canvasId, snapshotId, snapshotName ?? null, userId]
    );

    return NextResponse.json({ ok: true, eventId }, { status: 200 });
  } catch (err) {
    safeError('[Rollback POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
