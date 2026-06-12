/**
 * /api/notifications — In-app notification API
 * S92-E3: @mention notifications
 *
 * POST — create a notification (used for @mention alerts)
 * GET  — list notifications for a user
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export interface Notification {
  id: string;
  type: 'mention' | 'comment' | 'system' | 'info';
  title: string;
  message: string;
  targetUserId: string;
  senderId?: string;
  senderName?: string;
  nodeId?: string;
  canvasId?: string;
  commentId?: string;
  read: boolean;
  created_at: number;
}

declare global {
  // eslint-disable-next-line no-var
  var _notifications: Notification[] | undefined;
}

function getNotifications(): Notification[] {
  if (!global._notifications) {
    global._notifications = [];
  }
  return global._notifications;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface CreateNotificationBody {
  type: Notification['type'];
  title: string;
  message: string;
  targetUserId: string;
  senderId?: string;
  senderName?: string;
  nodeId?: string;
  canvasId?: string;
  commentId?: string;
}

/**
 * POST /api/notifications
 * Body: CreateNotificationBody
 */
export async function POST(req: NextRequest) {
  let body: CreateNotificationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, title, message, targetUserId, senderId, senderName, nodeId, canvasId, commentId } = body;

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }
  if (!targetUserId?.trim()) {
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
  }

  const notification: Notification = {
    id: generateId(),
    type: type ?? 'info',
    title: title.trim(),
    message: message.trim(),
    targetUserId,
    senderId,
    senderName,
    nodeId,
    canvasId,
    commentId,
    read: false,
    created_at: Date.now(),
  };

  const all = getNotifications();
  all.push(notification);

  return NextResponse.json({ success: true, notification }, { status: 201 });
}

/**
 * GET /api/notifications?userId=<userId>
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get('userId');

  const all = getNotifications();
  const userNotifications = userId
    ? all.filter(n => n.targetUserId === userId)
    : all;

  // Sort by created_at descending
  userNotifications.sort((a, b) => b.created_at - a.created_at);

  return NextResponse.json({
    success: true,
    notifications: userNotifications,
    unread: userNotifications.filter(n => !n.read).length,
  });
}
