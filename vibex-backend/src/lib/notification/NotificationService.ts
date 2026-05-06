/**
 * NotificationService — 统一通知服务
 * E02: 项目分享通知系统
 *
 * 支持 Slack DM + 站内通知降级
 */

import { debug, warn } from '@/lib/logger';

export interface NotificationPayload {
  projectId: string;
  recipientId: string;
  recipientName: string;
  senderName: string;
  projectName: string;
  message?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: 'slack' | 'inapp';
  notificationId?: string;
  deliveredAt?: string;
  error?: string;
}

// 站内通知存储（内存 Map，生产环境替换为 DB）
const inappNotifications = new Map<string, { id: string; read: boolean; createdAt: string }[]>();

export async function triggerNotify(payload: NotificationPayload): Promise<NotificationResult> {
  const { projectId, recipientId, recipientName, senderName, projectName } = payload;
  const now = new Date().toISOString();
  const notificationId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // 1. 尝试 Slack DM
  const slackToken = process.env.SLACK_BOT_TOKEN ?? process.env.SLACK_TOKEN;
  if (slackToken && slackToken.startsWith('xox')) {
    try {
      const text = `📎 *${senderName}* 分享了项目「${projectName}」给你${payload.message ? `\n💬 ${payload.message}` : ''}`;

      const slackResult = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: recipientId,
          text,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `📎 *${senderName}* 分享了项目「${projectName}」给你`,
              },
            },
            ...(payload.message ? [{
              type: 'section',
              text: { type: 'mrkdwn', text: payload.message },
            }] : []),
            {
              type: 'actions',
              elements: [{
                type: 'button',
                text: { type: 'plain_text', text: '查看项目' },
                url: `${process.env.APP_URL ?? 'https://vibex.app'}/canvas/${projectId}`,
              }],
            },
          ],
        }),
      });

      const slackData = await slackResult.json() as { ok: boolean; error?: string; ts?: string };
      if (slackData.ok) {
        return {
          success: true,
          channel: 'slack',
          notificationId,
          deliveredAt: now,
        };
      } else {
        warn('[NotificationService] Slack API error: ' + slackData.error);
      }
    } catch (err) {
      warn('[NotificationService] Slack DM failed, falling back to in-app: ' + String(err));
    }
  }

  // 2. 降级到站内通知
  if (!inappNotifications.has(recipientId)) {
    inappNotifications.set(recipientId, []);
  }
  inappNotifications.get(recipientId)!.push({
    id: notificationId,
    read: false,
    createdAt: now,
  });

  return {
    success: true,
    channel: 'inapp',
    notificationId,
    deliveredAt: now,
  };
}

export async function getInappNotifications(userId: string): Promise<Array<{ id: string; read: boolean; createdAt: string }>> {
  return inappNotifications.get(userId) ?? [];
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const notifications = inappNotifications.get(userId);
  if (notifications) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const notifications = inappNotifications.get(userId) ?? [];
  return notifications.filter(n => !n.read).length;
}
