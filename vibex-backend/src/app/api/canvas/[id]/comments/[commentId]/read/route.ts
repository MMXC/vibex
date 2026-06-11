/**
 * /api/canvas/[id]/comments/[commentId]/read — Mark comment as resolved
 * Sprint86 E1: 画布评论标注系统
 */
import { NextRequest, NextResponse } from 'next/server';
import { executeDB, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

type RouteParams = { params: Promise<{ id: string; commentId: string }> };

// POST /api/canvas/[id]/comments/[commentId]/read — Mark a comment as resolved
export async function POST(
  _request: NextRequest,
  context: { env: Env } & RouteParams
) {
  try {
    const { id: _canvasId, commentId } = await context.params;
    const env = context.env;

    const now = new Date().toISOString();
    const result = await executeDB(
      env,
      'UPDATE comments SET is_resolved = 1, updated_at = ? WHERE id = ?',
      [now, commentId]
    );

    if (!result.meta?.changes) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    safeError('[canvas/comments/read] POST error:', err);
    return NextResponse.json({ error: 'Failed to mark comment as read' }, { status: 500 });
  }
}
