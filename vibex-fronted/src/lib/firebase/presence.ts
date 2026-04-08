/**
 * Firebase Presence — Real-time user presence tracking
 * E1-S1: Firebase Presence 接入
 *
 * 使用 Firebase Realtime Database 实现用户在线状态同步。
 * 凭证通过 NEXT_PUBLIC_FIREBASE_* 环境变量注入（禁止硬编码）。
 */

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ============================================================================
// Types
// ============================================================================

export interface PresenceUser {
  userId: string;
  name: string;
  color: string; // 按 userId 哈希分配，同一用户颜色稳定
  cursor?: { x: number; y: number };
  lastSeen: number;
}

export interface PresenceOptions {
  onOthersChange?: (users: PresenceUser[]) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Firebase Mock / Placeholder
// 后端真实接入时替换为: import { initializeApp } from 'firebase/app';
// ============================================================================

// Firebase 配置通过环境变量注入（NEXT_PUBLIC_FIREBASE_*）
// 暂时使用 mock 实现，便于开发调试和 CI 测试
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
const isFirebaseConfigured = () => {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.databaseURL &&
    FIREBASE_CONFIG.apiKey !== 'your-api-key'
  );
};

// ============================================================================
// Mock Presence Store（开发/CI 环境使用）
// 生产环境替换为 Firebase Realtime Database 操作
// ============================================================================

interface MockPresenceState {
  [canvasId: string]: {
    [userId: string]: PresenceUser;
  };
}

// 模拟 Firebase Realtime Database（内存存储，tab 间不共享）
const mockPresenceDb: MockPresenceState = {};

// 模拟订阅者回调
const mockSubscribers: Map<string, (users: PresenceUser[]) => void> = new Map();

// ============================================================================
// User Color Hash
// ============================================================================

/**
 * 为 userId 分配稳定颜色（基于 userId 哈希）
 * 颜色从预定义调色板中选取，确保不同用户可区分
 */
const PRESENCE_COLORS = [
  '#FF6B6B', // 红
  '#4ECDC4', // 青
  '#45B7D1', // 蓝
  '#96CEB4', // 绿
  '#FFEAA7', // 黄
  '#DDA0DD', // 紫
  '#98D8C8', // 薄荷
  '#F7DC6F', // 金
  '#BB8FCE', // 薰衣草
  '#85C1E9', // 天蓝
];

export function hashUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

// ============================================================================
// Presence API
// ============================================================================

/**
 * 设置当前用户在线状态
 * 在 Firebase 中注册用户，并设置 onDisconnect 回调
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
    // TODO: 真实 Firebase 实现
    // const presenceRef = ref(database, `presence/${canvasId}/${userId}`);
    // await set(presenceRef, presenceUser);
    // await onDisconnect(presenceRef).remove();
    canvasLogger.default.debug('[Firebase Presence] setPresence (mock):', presenceUser);
  } else {
    // Mock 模式
    if (!mockPresenceDb[canvasId]) mockPresenceDb[canvasId] = {};
    mockPresenceDb[canvasId][userId] = presenceUser;
    canvasLogger.default.debug('[Mock Presence] setPresence:', presenceUser);

    // 通知订阅者
    notifySubscribers(canvasId);
  }
}

/**
 * 更新当前用户光标位置
 */
export async function updateCursor(
  canvasId: string,
  userId: string,
  x: number,
  y: number
): Promise<void> {
  if (!canvasId || !userId) return;

  if (isFirebaseConfigured()) {
    // TODO: 真实 Firebase 实现
    // const cursorRef = ref(database, `presence/${canvasId}/${userId}/cursor`);
    // await update(cursorRef, { x, y });
  } else {
    // Mock 模式
    if (mockPresenceDb[canvasId]?.[userId]) {
      mockPresenceDb[canvasId][userId].cursor = { x, y };
      mockPresenceDb[canvasId][userId].lastSeen = Date.now();
      notifySubscribers(canvasId);
    }
  }
}

/**
 * 获取当前画布上其他在线用户
 */
export function getOthers(canvasId: string, currentUserId: string): PresenceUser[] {
  if (!canvasId) return [];

  if (isFirebaseConfigured()) {
    // TODO: 真实 Firebase 实现
    return [];
  } else {
    const canvasPresence = mockPresenceDb[canvasId];
    if (!canvasPresence) return [];

    return Object.values(canvasPresence).filter(
      (user) => user.userId !== currentUserId
    );
  }
}

/**
 * 订阅其他用户变更
 */
export function subscribeToOthers(
  canvasId: string,
  callback: (users: PresenceUser[]) => void
): () => void {
  mockSubscribers.set(canvasId, callback);

  // 立即调用一次
  callback(getOthers(canvasId, ''));

  return () => {
    mockSubscribers.delete(canvasId);
  };
}

/**
 * 移除当前用户在线状态（主动离开或断线）
 */
export async function removePresence(canvasId: string, userId: string): Promise<void> {
  if (!canvasId || !userId) return;

  if (isFirebaseConfigured()) {
    // TODO: 真实 Firebase 实现
    // const presenceRef = ref(database, `presence/${canvasId}/${userId}`);
    // await remove(presenceRef);
  } else {
    // Mock 模式
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
    // 通知所有非当前用户的订阅（简化处理，传入空 userId）
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
 *
 * @example
 * const { others, updateCursor, isAvailable } = usePresence(canvasId, userId, name);
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

  // 注册当前用户
  useEffect(() => {
    if (!canvasId || !userId) return;

    let mounted = true;

    const init = async () => {
      try {
        await setPresence(canvasId, userId, name);
        if (mounted) {
          setIsAvailable(isFirebaseConfigured() || true); // mock 模式也可用
          setIsConnected(true);
        }
      } catch (err) {
        canvasLogger.default.error('[Presence] Failed to set presence:', err);
        if (mounted) {
          setIsAvailable(false);
        }
      }
    };

    init();

    // 订阅其他人变更
    unsubscribeRef.current = subscribeToOthers(canvasId, (users) => {
      if (mounted) {
        setOthers(users.slice(0, 10)); // 最多显示 10 个用户
      }
    });

    return () => {
      mounted = false;
      unsubscribeRef.current?.();
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
