/**
 * /api/canvas/:id/merge — Branch Merge API
 *
 * S85-E4: 分支合并预览与回滚
 *
 * POST /api/canvas/:id/merge — Record a branch merge event in D1
 *   Body: { sourceBranch: string; targetBranch: string; userId: string; snapshotCount?: number }
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
      sourceBranch?: string;
      targetBranch?: string;
      userId?: string;
      snapshotCount?: number;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { sourceBranch, targetBranch, userId, snapshotCount = 0 } = body;

    if (!sourceBranch || !targetBranch || !userId) {
      return NextResponse.json(
        { ok: false, error: 'sourceBranch, targetBranch, and userId are required' },
        { status: 400 }
      );
    }

    if (sourceBranch === targetBranch) {
      return NextResponse.json(
        { ok: false, error: 'Source and target branches cannot be the same' },
        { status: 400 }
      );
    }

    const eventId = generateId();
    await executeDB(
      env,
      `INSERT INTO branch_events (id, canvas_id, source_branch, target_branch, user_id, snapshot_count)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [eventId, canvasId, sourceBranch, targetBranch, userId, snapshotCount]
    );

    return NextResponse.json({ ok: true, eventId }, { status: 200 });
  } catch (err) {
    safeError('[Merge POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
