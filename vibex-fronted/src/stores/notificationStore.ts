/**
 * notificationStore — S68-E2: @提及通知系统
 * 扩展 S73-E3: 通知偏好设置
 *
 * 职责：
 * - 管理通用通知列表（mention / reply / system / info 类型）
 * - 持久化到 localStorage（notifications + preferences）
 * - 未读计数 + 广播事件
 * - 通知偏好设置（推送渠道开关 + 类型开关）
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

/** S73-E3: 通知偏好设置 */
export interface NotificationPreferences {
  /** 推送渠道开关 */
  channels: {
    inApp: boolean;   // 应用内通知
    browser: boolean; // 浏览器推送
  };
  /** 通知类型开关 */
  types: {
    mention: boolean;
    reply: boolean;
    system: boolean;
    info: boolean;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  channels: { inApp: true, browser: true },
  types: { mention: true, reply: true, system: true, info: true },
};

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
  /** S73-E3: 通知偏好设置 */
  preferences: NotificationPreferences;

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

  // S73-E3: Preference actions
  setChannelEnabled: (channel: keyof NotificationPreferences['channels'], enabled: boolean) => void;
  setTypeEnabled: (type: keyof NotificationPreferences['types'], enabled: boolean) => void;
  resetPreferences: () => void;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: DEFAULT_PREFERENCES,

      addNotification: (data) => {
        // S73-E3: respect type toggle — skip if type is disabled
        const typeEnabled = get().preferences.types[data.type] ?? true;
        if (!typeEnabled) {
          // Return a dummy notification for compatibility but don't store
          return {
            ...data,
            id: generateId(),
            isRead: true,
          } as Notification;
        }
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

      // S73-E3: Preference actions
      setChannelEnabled: (channel, enabled) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            channels: { ...state.preferences.channels, [channel]: enabled },
          },
        }));
      },

      setTypeEnabled: (type, enabled) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            types: { ...state.preferences.types, [type]: enabled },
          },
        }));
      },

      resetPreferences: () => {
        set({ preferences: DEFAULT_PREFERENCES });
      },
    }),
    {
      name: 'vibex-notifications',
      // Persist both notifications and preferences
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    }
  )
);

// Export for direct module-level access (e.g., WS handler)
export const notificationStore = useNotificationStore;
