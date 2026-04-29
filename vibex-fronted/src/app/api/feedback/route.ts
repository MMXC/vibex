
/**
 * /api/feedback — 用户反馈提交接口
 * E3 S3.3: 接收前端反馈并转发到 Slack #coord 频道
 *
 * 请求: POST { title: string, content: string, timestamp: number }
 * 响应: { ok: true } | { error: string }
 */
import { NextRequest, NextResponse } from 'next/server';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

const SLACK_WEBHOOK_URL = process.env.SLACK_FEEDBACK_WEBHOOK;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, timestamp } = body as {
      title?: string;
      content?: string;
      timestamp?: number;
    };

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
    }

    if (!SLACK_WEBHOOK_URL) {
      // Fallback: log to console when webhook not configured
      canvasLogger.default.warn('[feedback] SLACK_FEEDBACK_WEBHOOK not configured. Feedback received:', {
        title,
        content,
        timestamp,
      });
      return NextResponse.json({ ok: true, warn: 'webhook not configured' });
    }

    // Format timestamp
    const dateStr = timestamp
      ? new Date(timestamp).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    const slackBody = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `💬 用户反馈: ${title.trim()}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*时间:*\n${dateStr}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*反馈内容:*\n${content.trim()}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `来自 VibeX 用户反馈表单 | ${dateStr}`,
            },
          ],
        },
      ],
    };

    const webhookResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackBody),
    });

    if (!webhookResponse.ok) {
      const text = await webhookResponse.text().catch(() => '');
      canvasLogger.default.error('[feedback] Slack webhook error:', webhookResponse.status, text);
      return NextResponse.json(
        { error: `Slack webhook failed: ${webhookResponse.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    canvasLogger.default.error('[feedback] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
