'use client';
/**
 * useMentionsNotifications — hook for @mention notifications
 * S92-E3: Creates notification for each @mention when a comment is posted
 */
'use client';

import { useCallback } from 'react';

interface MentionNotificationBody {
  canvasId: string;
  commentId: string;
  content: string;
  senderId: string;
  senderName: string;
  mentions: string[];  // user IDs mentioned
  nodeId?: string;
}

export function useMentionsNotifications() {
  const sendMentionNotifications = useCallback(
    async (body: MentionNotificationBody) => {
      const { mentions, senderName, content, canvasId, commentId, senderId, nodeId } = body;

      if (!mentions || mentions.length === 0) return;

      // Create a notification for each mentioned user
      const notifications = mentions.map(targetUserId => ({
        type: 'mention' as const,
        title: `${senderName} mentioned you`,
        message: content.length > 120 ? content.slice(0, 120) + '…' : content,
        targetUserId,
        senderId,
        senderName,
        canvasId,
        commentId,
        nodeId,
      }));

      try {
        await Promise.allSettled(
          notifications.map(n =>
            fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(n),
            })
          )
        );
      } catch (e) {
        console.error('Failed to send mention notifications', e);
      }
    },
    []
  );

  return { sendMentionNotifications };
}
