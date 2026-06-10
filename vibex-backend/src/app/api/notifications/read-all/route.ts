/**
 * /api/notifications/read-all — Mark all notifications as read for a user
 * Sprint85 E3: 通知中心面板
 */
import { NextRequest, NextResponse } from 'next/server';
import { executeDB, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

// POST /api/notifications/read-all?userId=... — Mark all as read
export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing required param: userId' }, { status: 400 });
    }

    const env = context.env;
    const result = await executeDB(
      env,
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return NextResponse.json({ success: true, markedCount: result.meta?.changes ?? 0 });
  } catch (err) {
    safeError('[notifications/read-all] POST error:', err);
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
  }
}
