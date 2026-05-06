/**
 * POST /api/projects/:id/share/notify
 * 分享项目时触发通知（Slack DM 或站内通知）
 * E02: 项目分享通知系统
 */
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const body = await req.json() as {
      recipientId: string;
      recipientName: string;
      senderName: string;
      projectName: string;
      message?: string;
    };

    if (!body.recipientId || !body.senderName) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'recipientId and senderName are required' },
        { status: 400 }
      );
    }

    const { triggerNotify } = await import('@/lib/notification/NotificationService');
    const result = await triggerNotify({
      projectId,
      ...body,
    });

    return NextResponse.json({
      success: result.success,
      notificationId: result.notificationId,
      channel: result.channel,
      deliveredAt: result.deliveredAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '通知发送失败，请稍后重试' },
      { status: 500 }
    );
  }
}
