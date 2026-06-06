/**
 * notificationStore — S68-E2: @提及通知系统
 *
 * 职责：
 * - 管理通用通知列表（mention / reply / system 类型）
 * - 持久化到 localStorage（IndexedDB 未来扩展）
 * - 未读计数 + 广播事件
 *
 * 设计决策（来自 PRD E2 架构决策 1）：
 * - 与 mentionsStore.ts 分离：mentionsStore 仅负责 @输入时用户列表 UI 状态
 * - notificationStore 负责后端数据持久化
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'mention' | 'reply' | 'system' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  senderId: string;
  senderName: string;
  /** 被 @提及的目标用户 */
  targetUserId: string;
  /** 关联的节点 ID */
  nodeId?: string;
  /** 关联的画布 ID */
  canvasId?: string;
  /** 是否已读 */
  isRead: boolean;
  /** 创建时间戳 */
  timestamp: number;
}

// Module-level listeners for cross-component notification events
const _notificationListeners: Set<(event: NotificationEvent) => void> = new Set();

export interface NotificationEvent {
  type: 'notification:new' | 'notification:read' | 'notification:cleared';
  notification?: Notification;
  count?: number;
}

function emitNotificationEvent(event: NotificationEvent): void {
  _notificationListeners.forEach(listener => {
    try {
      listener(event);
    } catch (err) {
      console.error('[notificationStore] Listener error:', err);
    }
  });
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface NotificationStoreState {
  notifications: Notification[];

  // Actions
  addNotification: (data: Omit<Notification, 'id' | 'isRead'>) => Notification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;

  // Queries
  getUnreadCount: () => number;
  getByCanvas: (canvasId: string) => Notification[];
  getByType: (type: NotificationType) => Notification[];
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (data) => {
        const notification: Notification = {
          ...data,
          id: generateId(),
          isRead: false,
        };
        set(state => ({
          notifications: [notification, ...state.notifications],
        }));
        emitNotificationEvent({ type: 'notification:new', notification });
        emitNotificationEvent({ type: 'notification:new', count: get().getUnreadCount() });
        return notification;
      },

      markAsRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
        emitNotificationEvent({ type: 'notification:read' });
      },

      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        }));
        emitNotificationEvent({ type: 'notification:cleared', count: 0 });
      },

      clearNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
        emitNotificationEvent({ type: 'notification:cleared', count: 0 });
      },

      getUnreadCount: () => {
        return get().notifications.filter(n => !n.isRead).length;
      },

      getByCanvas: (canvasId) => {
        return get().notifications.filter(n => n.canvasId === canvasId);
      },

      getByType: (type) => {
        return get().notifications.filter(n => n.type === type);
      },
    }),
    {
      name: 'vibex-notifications',
      // Only persist essential fields
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

// Export for direct module-level access (e.g., WS handler)
export const notificationStore = useNotificationStore;
