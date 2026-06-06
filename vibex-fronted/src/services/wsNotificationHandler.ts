/**
 * wsNotificationHandler — S68-E2: @提及通知系统
 *
 * 职责：
 * - 处理 WebSocket `notification:*` 消息
 * - 消息类型：notification:new / notification:read / notification:clear
 * - 调用 notificationStore 对应 action
 *
 * 设计决策（来自 PRD E2 架构决策 2）：
 * - WebSocket 消息协议：{ type, payload }
 * - 与 commentWSHandler.ts 模式一致
 */
import { notificationStore } from '@/stores/notificationStore';
import type { Notification, NotificationType } from '@/stores/notificationStore';

export interface WsNotificationPayload {
  id?: string;
  senderId: string;
  senderName: string;
  message: string;
  title?: string;
  type?: NotificationType;
  targetUserId: string;
  nodeId?: string;
  canvasId?: string;
  timestamp: number;
}

export type WsNotificationMessage =
  | { type: 'notification:new'; payload: WsNotificationPayload }
  | { type: 'notification:read'; payload: { id: string; userId: string } }
  | { type: 'notification:clear'; payload: { userId: string } };

/** Whether the handler is currently active */
let _active = false;

/** Module-level WebSocket message handler
 *  Call wsNotificationHandler.handleMessage(raw) from your WS onMessage callback
 */
export const wsNotificationHandler = {
  /**
   * Activate the global handler.
   * Called once when the WS connection is established.
   */
  activate(): void {
    _active = true;
    console.info('[wsNotificationHandler] activated');
  },

  /**
   * Deactivate — clear all pending listeners.
   */
  deactivate(): void {
    _active = false;
    console.info('[wsNotificationHandler] deactivated');
  },

  /**
   * Handle an incoming WebSocket message.
   * Returns true if the message was handled, false otherwise.
   */
  handleMessage(raw: unknown): boolean {
    if (!_active) return false;

    const msg = raw as WsNotificationMessage;
    if (!msg || typeof msg !== 'object') return false;

    try {
      switch (msg.type) {
        case 'notification:new': {
          const payload = msg.payload as WsNotificationPayload;
          notificationStore.getState().addNotification({
            type: payload.type ?? 'mention',
            title: payload.title ?? payload.message.slice(0, 60),
            message: payload.message,
            senderId: payload.senderId,
            senderName: payload.senderName,
            targetUserId: payload.targetUserId,
            nodeId: payload.nodeId,
            canvasId: payload.canvasId,
            timestamp: payload.timestamp,
          });
          return true;
        }

        case 'notification:read': {
          const payload = msg.payload as { id: string };
          notificationStore.getState().markAsRead(payload.id);
          return true;
        }

        case 'notification:clear': {
          notificationStore.getState().markAllAsRead();
          return true;
        }

        default:
          return false;
      }
    } catch (err) {
      console.error('[wsNotificationHandler] handleMessage error:', err);
      return false;
    }
  },
};
