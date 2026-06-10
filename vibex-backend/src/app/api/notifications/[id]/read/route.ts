/**
 * /api/notifications/[id]/read — Mark notification as read
 * Sprint85 E3: 通知中心面板
 */
import { NextRequest, NextResponse } from 'next/server';
import { executeDB, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/notifications/[id]/read — Mark a single notification as read
export async function POST(
  _request: NextRequest,
  context: { env: Env } & RouteParams
) {
  try {
    const { id } = await context.params;
    const env = context.env;

    const result = await executeDB(
      env,
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );

    if (!result.meta?.changes) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    safeError('[notifications/read] POST error:', err);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
