/**
 * S92-E3: Notification types
 */

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
