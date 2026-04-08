/**
 * Firebase Presence — Real-time user presence tracking
 * E1-S2: Firebase Presence 真实接入
 *
 * 使用 Firebase Realtime Database 实现用户在线状态同步。
 * 凭证通过 NEXT_PUBLIC_FIREBASE_* 环境变量注入（禁止硬编码）。
 *
 * 接入路径:
 * 1. 创建 Firebase 项目，启用 Realtime Database
 * 2. 复制 .env.local.example 为 .env.local，填入凭证
 * 3. 本模块自动从 Mock 降级切换到真实 Firebase
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
// Firebase Config
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

export function isFirebaseConfigured(): boolean {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.databaseURL &&
    FIREBASE_CONFIG.apiKey !== 'your-api-key'
  );
}

// ============================================================================
// Firebase SDK (lazy init)
// ============================================================================

let _app: ReturnType<typeof import('firebase/app').initializeApp> | null = null;
let _db: ReturnType<typeof import('firebase/database').getDatabase> | null = null;

async function getFirebaseDb() {
  if (!isFirebaseConfigured()) return null;
  if (_db) return _db;

  const { initializeApp, getApps } = await import('firebase/app');
  const { getDatabase } = await import('firebase/database');

  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
  }
  _db = getDatabase(_app);
  return _db;
}

// ============================================================================
// Mock Presence Store（开发/CI 环境使用）
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
    try {
      const { getDatabase, ref, set, onDisconnect } = await import('firebase/database');
      const db = await getFirebaseDb();
      if (!db) return;
      const presenceRef = ref(db, `presence/${canvasId}/${userId}`);
      await set(presenceRef, presenceUser);
      await onDisconnect(presenceRef).remove();
      canvasLogger.default.debug('[Firebase Presence] setPresence:', presenceUser);
    } catch (err) {
      canvasLogger.default.error('[Firebase Presence] setPresence failed, using mock:', err);
      // 降级到 Mock
      if (!mockPresenceDb[canvasId]) mockPresenceDb[canvasId] = {};
      mockPresenceDb[canvasId][userId] = presenceUser;
      notifySubscribers(canvasId);
    }
  } else {
    // Mock 模式
    if (!mockPresenceDb[canvasId]) mockPresenceDb[canvasId] = {};
    mockPresenceDb[canvasId][userId] = presenceUser;
    canvasLogger.default.debug('[Mock Presence] setPresence:', presenceUser);
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
    try {
      const db = await getFirebaseDb();
      if (!db) return;
      const { getDatabase, ref, update } = await import('firebase/database');
      const cursorRef = ref(db, `presence/${canvasId}/${userId}`);
      await update(cursorRef, { cursor: { x, y }, lastSeen: Date.now() });
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
 * 获取当前画布上其他在线用户
 */
export function getOthers(canvasId: string, currentUserId: string): PresenceUser[] {
  if (!canvasId) return [];
  const canvasPresence = mockPresenceDb[canvasId];
  if (!canvasPresence) return [];
  return Object.values(canvasPresence).filter(
    (user) => user.userId !== currentUserId
  );
}

/**
 * 订阅其他用户变更
 * 返回取消订阅函数
 */
export function subscribeToOthers(
  canvasId: string,
  callback: (users: PresenceUser[]) => void
): () => void {
  if (isFirebaseConfigured()) {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        const db = await getFirebaseDb();
        if (!db) return;
        const { getDatabase, ref, onValue } = await import('firebase/database');
        const presenceRef = ref(db, `presence/${canvasId}`);
        unsubscribe = onValue(presenceRef, (snapshot) => {
          const data = snapshot.val() || {};
          const users = Object.values(data) as PresenceUser[];
          callback(users);
        });
      } catch (err) {
        canvasLogger.default.error('[Firebase Presence] subscribeToOthers failed:', err);
      }
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  } else {
    mockSubscribers.set(canvasId, callback);
    callback(getOthers(canvasId, ''));
    return () => {
      mockSubscribers.delete(canvasId);
    };
  }
}

/**
 * 移除当前用户在线状态（主动离开或断线）
 */
export async function removePresence(canvasId: string, userId: string): Promise<void> {
  if (!canvasId || !userId) return;

  if (isFirebaseConfigured()) {
    try {
      const db = await getFirebaseDb();
      if (!db) return;
      const { getDatabase, ref, remove } = await import('firebase/database');
      const presenceRef = ref(db, `presence/${canvasId}/${userId}`);
      await remove(presenceRef);
      canvasLogger.default.debug('[Firebase Presence] removePresence:', { canvasId, userId });
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
// Notify Subscribers Helper (Mock mode)
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
          setIsAvailable(true);
          setIsConnected(true);
        }
      } catch (err) {
        canvasLogger.default.error('[Presence] Failed to set presence:', err);
        if (mounted) setIsAvailable(false);
      }
    };

    init();

    unsubscribeRef.current = subscribeToOthers(canvasId, (users) => {
      if (mounted) {
        setOthers(users.filter((u) => u.userId !== userId).slice(0, 10));
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
