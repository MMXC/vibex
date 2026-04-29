/**
 * Firebase Presence — Real-time user presence tracking
 * EpicE2: Firebase Presence 真实接入
 *
 * 实现方案：Firebase Realtime Database REST API
 * - 禁止导入 firebase/app（完整 SDK，bundle 过大）
 * - 禁止导入 firebase/database（包含 app 依赖）
 * - 使用原生 fetch + EventSource 实现 RTDB 实时同步
 */

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ============================================================================
// Types
// ============================================================================

export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

// ============================================================================
// Firebase Configuration（仅环境变量注入）
// ============================================================================

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 检查 Firebase 是否已配置
export function isFirebaseConfigured(): boolean {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.databaseURL &&
    FIREBASE_CONFIG.apiKey !== 'your-api-key'
  );
}

// ============================================================================
// REST API Client（零 SDK 依赖）
// ============================================================================

type FirebaseAuth = string | null;

/**
 * Firebase RTDB REST API 基地址
 */
function getDatabaseUrl(path: string): string {
  const base = FIREBASE_CONFIG.databaseURL!.replace(/\/$/, '');
  const encodedPath = path
    .split('/')
    .map(s => encodeURIComponent(s))
    .join('/');
  return `${base}/${encodedPath}.json`;
}

/**
 * 构建 auth 参数（用于 REST API 认证）
 * Firebase RTDB REST API 支持 ?auth=<token>
 */
function getAuthParam(): string {
  return `?auth=${FIREBASE_CONFIG.apiKey}`;
}

// ============================================================================
// Mock Presence Store（开发/CI 环境使用，Firebase 未配置时降级）
// ============================================================================

interface MockPresenceState {
  [canvasId: string]: {
    [userId: string]: PresenceUser;
  };
}

const mockPresenceDb: MockPresenceState = {};
const mockSubscribers: Map<string, (users: PresenceUser[]) => void> = new Map();

// ============================================================================
// User Color Hash
// ============================================================================

const PRESENCE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export function hashUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length]!;
}

// ============================================================================
// REST API 实现（真实 Firebase 接入）
// ============================================================================

/**
 * 设置当前用户在线状态（REST PUT）
 */
export async function setPresence(
  canvasId: string,
  userId: string,
  name: string
): Promise<void> {
  if (!canvasId || !userId) return;

  const color = hashUserColor(userId);
  const presenceUser: PresenceUser = {
    userId,
    name,
    color,
    lastSeen: Date.now(),
  };

  if (isFirebaseConfigured()) {
    try {
      const path = `presence/${canvasId}/${userId}`;
      const url = getDatabaseUrl(path) + getAuthParam();
      await fetch(url, {
        method: 'PUT',
        body: JSON.stringify(presenceUser),
        headers: { 'Content-Type': 'application/json' },
      });
      canvasLogger.default.debug('[Firebase Presence] setPresence:', path);
    } catch (err) {
      canvasLogger.default.error('[Firebase Presence] setPresence failed:', err);
      throw err;
    }
  } else {
    console.warn('[Presence] Firebase not configured — using mock');
    if (!mockPresenceDb[canvasId]) mockPresenceDb[canvasId] = {};
    mockPresenceDb[canvasId][userId] = presenceUser;
    notifySubscribers(canvasId);
  }
}

/**
 * 更新当前用户光标位置（REST PATCH）
 */
export async function updateCursor(
  canvasId: string,
  userId: string,
  x: number,
  y: number
): Promise<void> {
  if (!canvasId || !userId) return;

  if (isFirebaseConfigured()) {
    try {
      const path = `presence/${canvasId}/${userId}`;
      const url = getDatabaseUrl(path) + getAuthParam();
      await fetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ cursor: { x, y }, lastSeen: Date.now() }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      canvasLogger.default.error('[Firebase Presence] updateCursor failed:', err);
    }
  } else {
    if (mockPresenceDb[canvasId]?.[userId]) {
      mockPresenceDb[canvasId][userId].cursor = { x, y };
      mockPresenceDb[canvasId][userId].lastSeen = Date.now();
      notifySubscribers(canvasId);
    }
  }
}

/**
 * 获取当前画布上其他在线用户（一次性读取）
 */
export function getOthers(canvasId: string, currentUserId: string): PresenceUser[] {
  if (!canvasId) return [];

  if (isFirebaseConfigured()) {
    return [];
  } else {
    const canvasPresence = mockPresenceDb[canvasId];
    if (!canvasPresence) return [];
    return Object.values(canvasPresence).filter(u => u.userId !== currentUserId);
  }
}

/**
 * 订阅其他用户变更（REST Streaming 实现实时同步）
 * 使用 Firebase RTDB Streaming API（Server-Sent Events）
 *
 * @returns unsubscribe 函数
 */
export function subscribeToOthers(
  canvasId: string,
  callback: (users: PresenceUser[]) => void,
  currentUserId?: string
): () => void {
  if (isFirebaseConfigured()) {
    try {
      // Firebase RTDB Streaming: ?ns=<namespace>&sse=true
      const ns = encodeURIComponent(
        FIREBASE_CONFIG.databaseURL!.split('://')[1]!.split('.')[0]!
      );
      const path = `presence/${canvasId}`;
      const encodedPath = path
        .split('/')
        .map(s => encodeURIComponent(s))
        .join('%2F');
      const baseUrl = FIREBASE_CONFIG.databaseURL!.replace(/\/$/, '');
      const streamingUrl = `${baseUrl}/${encodedPath}.json?auth=${FIREBASE_CONFIG.apiKey}&sse=true&streamType=value`;

      const eventSource = new EventSource(streamingUrl);

      eventSource.onmessage = (event) => {
        try {
          // Firebase SSE 格式: "data: {...}\n\n"
          const rawData = event.data;
          if (!rawData || rawData === 'null') {
            callback([]);
            return;
          }
          const data = JSON.parse(rawData) as Record<string, PresenceUser> | null;
          if (!data) {
            callback([]);
            return;
          }
          const others = Object.values(data).filter(
            u => !currentUserId || u.userId !== currentUserId
          );
          callback(others);
        } catch {
          callback([]);
        }
      };

      eventSource.onerror = () => {
        canvasLogger.default.debug('[Firebase Presence] EventSource error, fallback to polling');
        eventSource.close();
        // 回退到轮询
        startPolling(canvasId, callback, currentUserId);
      };

      return () => eventSource.close();
    } catch (err) {
      canvasLogger.default.error('[Firebase Presence] subscribeToOthers failed:', err);
      callback([]);
      return () => {};
    }
  } else {
    mockSubscribers.set(canvasId, callback);
    callback(getOthers(canvasId, currentUserId ?? ''));
    return () => {
      mockSubscribers.delete(canvasId);
    };
  }
}

// ============================================================================
// Polling Fallback（EventSource 不可用时的轮询方案）
// ============================================================================

const pollingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

function startPolling(
  canvasId: string,
  callback: (users: PresenceUser[]) => void,
  currentUserId?: string
): void {
  const poll = async () => {
    try {
      const path = `presence/${canvasId}`;
      const url = getDatabaseUrl(path) + getAuthParam();
      const resp = await fetch(url);
      if (!resp.ok) {
        callback([]);
        return;
      }
      const data = await resp.json() as Record<string, PresenceUser> | null;
      if (!data) {
        callback([]);
        return;
      }
      const others = Object.values(data).filter(
        u => !currentUserId || u.userId !== currentUserId
      );
      callback(others);
    } catch {
      callback([]);
    }
  };

  poll();
  const interval = setInterval(poll, 2000);
  pollingIntervals.set(canvasId, interval);
}

// ============================================================================
// Remove Presence
// ============================================================================

export async function removePresence(canvasId: string, userId: string): Promise<void> {
  if (!canvasId || !userId) return;

  if (isFirebaseConfigured()) {
    try {
      const path = `presence/${canvasId}/${userId}`;
      const url = getDatabaseUrl(path) + getAuthParam();
      await fetch(url, { method: 'DELETE' });
      canvasLogger.default.debug('[Firebase Presence] removePresence:', path);
    } catch (err) {
      canvasLogger.default.error('[Firebase Presence] removePresence failed:', err);
    }
  } else {
    if (mockPresenceDb[canvasId]) {
      delete mockPresenceDb[canvasId][userId];
      notifySubscribers(canvasId);
    }
  }
}

// ============================================================================
// Notify Subscribers Helper
// ============================================================================

function notifySubscribers(canvasId: string): void {
  const callback = mockSubscribers.get(canvasId);
  if (callback) {
    callback(getOthers(canvasId, ''));
  }
}

// ============================================================================
// usePresence Hook
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * usePresence — React hook for Firebase Presence
 *
 * @param canvasId - 画布 ID
 * @param userId   - 当前用户 ID
 * @param name     - 当前用户显示名
 */
export function usePresence(
  canvasId: string | null,
  userId: string | null,
  name: string = 'Anonymous'
): {
  others: PresenceUser[];
  updateCursor: (x: number, y: number) => void;
  isAvailable: boolean;
  isConnected: boolean;
} {
  const [others, setOthers] = useState<PresenceUser[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!canvasId || !userId) return;

    let mounted = true;

    const init = async () => {
      try {
        await setPresence(canvasId, userId, name);
        if (mounted) {
          setIsAvailable(isFirebaseConfigured());
          setIsConnected(true);
        }
      } catch (err) {
        canvasLogger.default.error('[Presence] Failed to set presence:', err);
        if (mounted) {
          setIsAvailable(false);
          setIsConnected(true);
        }
      }
    };

    init();

    unsubscribeRef.current = subscribeToOthers(canvasId, (users) => {
      if (mounted) {
        setOthers(users.slice(0, 10));
      }
    }, userId);

    // E2-U3: visibilitychange 兜底清除
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        removePresence(canvasId, userId).catch(canvasLogger.default.error);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      unsubscribeRef.current?.();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // 停止轮询
      const interval = pollingIntervals.get(canvasId);
      if (interval) {
        clearInterval(interval);
        pollingIntervals.delete(canvasId);
      }
      removePresence(canvasId, userId).catch(canvasLogger.default.error);
    };
  }, [canvasId, userId, name]);

  const handleCursorMove = useCallback(
    (x: number, y: number) => {
      if (canvasId && userId) {
        updateCursor(canvasId, userId, x, y).catch(canvasLogger.default.error);
      }
    },
    [canvasId, userId]
  );

  return { others, updateCursor: handleCursorMove, isAvailable, isConnected };
}

export default usePresence;
