/**
 * notificationStore — S68-E2: @提及通知系统
 * 扩展 S73-E3: 通知偏好设置
 * 扩展 S77-E1: IndexedDB 持久化 + 后端 REST API 同步
 * 扩展 S78-E2: 模板订阅通知 — 'template_update' 通知类型
 * 扩展 S79-E3: 评论回复通知 comment_reply 显示
 * 扩展 E1 (Sprint80): 统一 setPreference/getPreference + IndexedDB notification_prefs 表
 *
 * 职责：
 * - 管理通用通知列表（mention / reply / system / info 类型）
 * - 持久化到 IndexedDB（notifications + preferences）
 * - 未读计数 + 广播事件
 * - 通知偏好设置（推送渠道开关 + 类型开关）
 *
 * E1 (Sprint80) 架构决策：
 * - 统一 setPreference(key, enabled) / getPreference(key) 接口
 * - IndexedDB notification_prefs 表持久化偏好设置
 * - setPreference 保存时同步写 IndexedDB
 * - loadPreferencesFromIndexedDB 在 app init 时调用
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  saveNotificationToDB,
  getNotificationsFromDB,
  markAsReadInDB,
  getUnreadCountFromDB,
  saveNotificationsFromServer,
  clearNotificationsFromDB,
  savePreferencesToDB,
  getPreferencesFromDB,
} from '@/lib/canvas/historyDB';

export type NotificationType = 'mention' | 'reply' | 'system' | 'info' | 'template_update' | 'comment_reply';

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
  /** S78-E2: 模板订阅通知 — 关联的模板 ID */
  templateId?: string;
  /** S78-E2: 模板订阅通知 — 关联的作者 ID */
  authorId?: string;
  /** S78-E2: 模板订阅通知 — 模板缩略图 */
  thumbnail?: string;
  /** S79-E3: 评论回复通知 — 关联的评论 ID */
  commentId?: string;
  /** S79-E3: 评论回复通知 — 关联的回复 ID */
  replyId?: string;
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
    template_update: boolean;   // S78-E2: 模板订阅通知开关
    comment_reply: boolean;      // S79-E3: 评论回复通知开关
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  channels: { inApp: true, browser: true },
  types: { mention: true, reply: true, system: true, info: true, template_update: true, comment_reply: true },
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
  /** E1 (Sprint77): server-side unread count (merged with local count) */
  _serverUnreadCount: number;

  // Actions
  addNotification: (data: Omit<Notification, 'id' | 'isRead'>) => Notification;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;

  // E1 (Sprint77): IndexedDB persistence
  /** E1: Load notifications from IndexedDB on app init */
  loadFromIndexedDB: (userId?: string) => Promise<void>;
  /** E1: Fetch unread notifications from backend REST API */
  fetchUnreadFromServer: (userId: string) => Promise<Notification[]>;
  /** E1: Aggregate local + server unread count */
  getUnreadCountWithServer: () => number;

  // Queries
  getUnreadCount: () => number;
  getByCanvas: (canvasId: string) => Notification[];
  getByType: (type: NotificationType) => Notification[];

  // S73-E3: Preference actions
  setChannelEnabled: (channel: keyof NotificationPreferences['channels'], enabled: boolean) => void;
  setTypeEnabled: (type: keyof NotificationPreferences['types'], enabled: boolean) => void;
  resetPreferences: () => void;

  // E1 (Sprint80): Unified preference interface
  /** E1 (Sprint80): Set preference for a channel or type. Persists to IndexedDB. */
  setPreference: (key: string, enabled: boolean) => void;
  /** E1 (Sprint80): Get preference enabled status for a channel or type. */
  getPreference: (key: string) => { enabled: boolean } | undefined;
  /** E1 (Sprint80): Load preferences from IndexedDB on app init. */
  loadPreferencesFromIndexedDB: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: DEFAULT_PREFERENCES,
      _serverUnreadCount: 0,

      addNotification: (data) => {
        // E1 (Sprint80): respect type toggle via unified getPreference
        const pref = get().getPreference(data.type);
        if (pref !== undefined && !pref.enabled) {
          // Type is disabled — return dummy for compatibility but don't store
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
        // E1 (Sprint77): Persist to IndexedDB
        saveNotificationToDB(notification).catch(err => {
          console.error('[notificationStore] saveNotificationToDB failed:', err);
        });
        return notification;
      },

      markAsRead: async (id) => {
        // E1 (Sprint77): Update local state first (optimistic)
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
        emitNotificationEvent({ type: 'notification:read' });
        // E1 (Sprint77): Update IndexedDB + call backend PATCH API
        markAsReadInDB(id).catch(err => {
          console.error('[notificationStore] markAsReadInDB failed:', err);
        });
        // Call backend API — fire and forget; UI already updated
        fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        }).catch(err => {
          console.error('[notificationStore] PATCH /api/notifications failed:', err);
        });
      },

      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          _serverUnreadCount: 0,
        }));
        emitNotificationEvent({ type: 'notification:cleared', count: 0 });
      },

      clearNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearAll: () => {
        set({ notifications: [], _serverUnreadCount: 0 });
        emitNotificationEvent({ type: 'notification:cleared', count: 0 });
        clearNotificationsFromDB().catch(err => {
          console.error('[notificationStore] clearNotificationsFromDB failed:', err);
        });
      },

      // E1 (Sprint77): IndexedDB — load on app init
      loadFromIndexedDB: async (userId?: string) => {
        try {
          const idbNotifications = await getNotificationsFromDB(userId);
          // Merge: server-side notifications take precedence on id collision
          const existingIds = new Set(get().notifications.map(n => n.id));
          const newFromIDB = idbNotifications.filter(n => !existingIds.has(n.id));
          if (newFromIDB.length > 0) {
            set(state => ({
              notifications: [...newFromIDB, ...state.notifications].sort(
                (a, b) => b.timestamp - a.timestamp
              ),
            }));
          }
        } catch (err) {
          console.error('[notificationStore] loadFromIndexedDB failed:', err);
        }
      },

      // E1 (Sprint77): Fetch unread notifications from backend REST API
      fetchUnreadFromServer: async (userId: string): Promise<Notification[]> => {
        try {
          const res = await fetch(`/api/notifications?unread=true&userId=${encodeURIComponent(userId)}`);
          if (!res.ok) throw new Error(`fetchUnreadFromServer: ${res.status}`);
          const serverNotifications: Notification[] = await res.json();
          // Merge server notifications into local IndexedDB
          await saveNotificationsFromServer(serverNotifications);
          // Update local state
          set(state => {
            const existingIds = new Set(state.notifications.map(n => n.id));
            const newNotifs = serverNotifications.filter(n => !existingIds.has(n.id));
            return {
              notifications: [...newNotifs, ...state.notifications].sort(
                (a, b) => b.timestamp - a.timestamp
              ),
              _serverUnreadCount: serverNotifications.filter(n => !n.isRead).length,
            };
          });
          return serverNotifications;
        } catch (err) {
          console.error('[notificationStore] fetchUnreadFromServer failed:', err);
          return [];
        }
      },

      // E1 (Sprint77): Aggregate local + server unread count
      getUnreadCountWithServer: () => {
        return get().getUnreadCount() + get()._serverUnreadCount;
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
        // E1 (Sprint80): Persist to IndexedDB
        savePreferencesToDB(DEFAULT_PREFERENCES).catch(err => {
          console.error('[notificationStore] savePreferencesToDB (reset) failed:', err);
        });
      },

      // E1 (Sprint80): Unified preference interface
      setPreference: (key, enabled) => {
        const { preferences } = get();
        // Check if key is a channel
        if (key in preferences.channels) {
          const channel = key as keyof NotificationPreferences['channels'];
          const updated: NotificationPreferences = {
            ...preferences,
            channels: { ...preferences.channels, [channel]: enabled },
          };
          set({ preferences: updated });
          savePreferencesToDB(updated).catch(err => {
            console.error('[notificationStore] savePreferencesToDB (channel) failed:', err);
          });
          return;
        }
        // Check if key is a type
        if (key in preferences.types) {
          const type = key as keyof NotificationPreferences['types'];
          const updated: NotificationPreferences = {
            ...preferences,
            types: { ...preferences.types, [type]: enabled },
          };
          set({ preferences: updated });
          savePreferencesToDB(updated).catch(err => {
            console.error('[notificationStore] savePreferencesToDB (type) failed:', err);
          });
          return;
        }
        // Unknown key — no-op
        console.warn(`[notificationStore] setPreference: unknown key "${key}"`);
      },

      getPreference: (key) => {
        const { preferences } = get();
        // Check channels
        if (key in preferences.channels) {
          return { enabled: preferences.channels[key as keyof NotificationPreferences['channels']] };
        }
        // Check types
        if (key in preferences.types) {
          return { enabled: preferences.types[key as keyof NotificationPreferences['types']] };
        }
        return undefined;
      },

      // E1 (Sprint80): Load preferences from IndexedDB on app init
      loadPreferencesFromIndexedDB: async () => {
        try {
          const prefs = await getPreferencesFromDB();
          if (prefs) {
            set({ preferences: prefs });
          }
        } catch (err) {
          console.error('[notificationStore] loadPreferencesFromIndexedDB failed:', err);
        }
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
