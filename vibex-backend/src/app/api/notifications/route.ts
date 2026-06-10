/**
 * /api/notifications — System-wide Notification Center API
 * Sprint85 E3: 通知中心面板
 *
 * GET  — List notifications for a user (with filter + pagination)
 * POST — Create a new notification (server-to-server or internal use)
 *
 * Frontend: notificationStore.ts calls GET /api/notifications?unread=true&userId=...
 * and POST is used by internal services (WebSocket handler, other APIs)
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  sender_id: string;
  sender_name: string;
  target_user_id: string;
  node_id: string | null;
  canvas_id: string | null;
  template_id: string | null;
  author_id: string | null;
  thumbnail: string | null;
  comment_id: string | null;
  reply_id: string | null;
  is_read: number;
  created_at: string;
}

function rowToNotification(row: NotificationRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    senderId: row.sender_id,
    senderName: row.sender_name,
    targetUserId: row.target_user_id,
    nodeId: row.node_id ?? undefined,
    canvasId: row.canvas_id ?? undefined,
    templateId: row.template_id ?? undefined,
    authorId: row.author_id ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    commentId: row.comment_id ?? undefined,
    replyId: row.reply_id ?? undefined,
    isRead: Boolean(row.is_read),
    timestamp: new Date(row.created_at).getTime(),
  };
}

// GET /api/notifications?userId=...&unread=true&type=...&limit=20&offset=0
export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'Missing required param: userId' }, { status: 400 });
    }

    const env = context.env;

    // Build query
    let sql = `SELECT id, user_id, type, title, message, sender_id, sender_name,
               target_user_id, node_id, canvas_id, template_id, author_id,
               thumbnail, comment_id, reply_id, is_read, created_at
        FROM notifications WHERE user_id = ?`;
    const params: unknown[] = [userId];

    if (unreadOnly) {
      sql += ' AND is_read = 0';
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await queryDB<NotificationRow>(env, sql, params);
    const notifications = rows.map(rowToNotification);

    // Total count
    let countSql = 'SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ?';
    const countParams: unknown[] = [userId];
    if (unreadOnly) countSql += ' AND is_read = 0';
    if (type) { countSql += ' AND type = ?'; countParams.push(type); }
    const countRow = await queryOne<{ cnt: number }>(env, countSql, countParams);
    const total = countRow?.cnt ?? 0;

    return NextResponse.json({ notifications, total, limit, offset });
  } catch (err) {
    safeError('[notifications] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications — Create a new notification
export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      title,
      message,
      senderId,
      senderName,
      targetUserId,
      nodeId,
      canvasId,
      templateId,
      authorId,
      thumbnail,
      commentId,
      replyId,
    } = body;

    // Validate required fields
    if (!userId || !type || !title || !message || !senderId || !senderName || !targetUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const env = context.env;
    const id = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      `INSERT INTO notifications
        (id, user_id, type, title, message, sender_id, sender_name, target_user_id,
         node_id, canvas_id, template_id, author_id, thumbnail, comment_id, reply_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, userId, type, title, message, senderId, senderName, targetUserId,
       nodeId ?? null, canvasId ?? null, templateId ?? null, authorId ?? null,
       thumbnail ?? null, commentId ?? null, replyId ?? null, now]
    );

    return NextResponse.json({ id, created_at: now }, { status: 201 });
  } catch (err) {
    safeError('[notifications] POST error:', err);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
