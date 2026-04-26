/**
 * E8 Conflict Store — LWW 仲裁 + 冲突解决
 *
 * 职责：
 * - 追踪本地草稿（localDrafts）
 * - LWW 仲裁：remote.version > local.version → 自动 adopt；否则弹出 ConflictDialog
 * - keep-local / use-remote 策略执行
 * - Firebase RTDB 锁（configured 路径降级）
 *
 * @module lib/canvas/stores/conflictStore
 */

import { create } from 'zustand';
import { isFirebaseConfigured } from '@/lib/firebase/presence';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ============================================================================
// Types
// ============================================================================

export interface ConflictData {
  nodeId: string;
  nodeName?: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  localVersion: number;
  remoteVersion: number;
}

export interface LockInfo {
  lockedBy: string;
  lockedAt: number;
  username?: string;
}

export interface ConflictStore {
  // 追踪本地编辑草稿
  localDrafts: Record<string, { data: Record<string, unknown>; version: number; timestamp: number }>;

  // 当前活跃冲突
  activeConflict: ConflictData | null;

  // Firebase RTDB 锁状态
  lockedCards: Record<string, LockInfo>;

  // ---- Actions ----

  /** 开始编辑时注册本地草稿 */
  startDraft(nodeId: string, data: Record<string, unknown>, version: number): void;

  /** 清除本地草稿（编辑取消） */
  clearDraft(nodeId: string): void;

  /** 远端节点变更时检查冲突（LWW 仲裁） */
  checkConflict(
    nodeId: string,
    nodeName: string | undefined,
    remoteData: Record<string, unknown>,
    remoteVersion: number,
    remoteLastModifiedBy?: string
  ): ConflictData | null;

  /** 解决冲突：保留本地版本 */
  resolveKeepLocal(nodeId: string): Record<string, unknown> | null;

  /** 解决冲突：采用远程版本 */
  resolveUseRemote(nodeId: string): Record<string, unknown> | null;

  /** 关闭冲突弹窗 */
  dismissConflict(): void;

  /** 锁定节点（Firebase RTDB） */
  lockCard(nodeId: string, userId: string, username?: string): void;

  /** 解锁节点 */
  unlockCard(nodeId: string): void;

  /** 同步所有锁状态（轮询锁超时） */
  syncLocks(canvasId: string): void;
}

// ============================================================================
// Firebase RTDB Lock Helpers
// ============================================================================

const LOCK_TIMEOUT_MS = 60_000; // 60s

function getLockPath(canvasId: string, nodeId: string): string {
  return `/canvas/${canvasId}/locks/${nodeId}`;
}

/**
 * 读取远程锁状态
 */
async function fetchLock(canvasId: string, nodeId: string): Promise<LockInfo | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const path = getLockPath(canvasId, nodeId);
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/${path}.json?auth=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    return {
      lockedBy: data.lockedBy,
      lockedAt: data.lockedAt,
      username: data.username,
    };
  } catch {
    return null;
  }
}

/**
 * 写入锁状态到 Firebase RTDB
 */
async function writeLock(canvasId: string, nodeId: string, userId: string, username?: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const path = getLockPath(canvasId, nodeId);
    const body = JSON.stringify({ lockedBy: userId, lockedAt: Date.now(), username });
    await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/${path}.json?auth=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    canvasLogger.default.warn('[ConflictStore] Failed to write lock:', err);
  }
}

/**
 * 删除锁状态
 */
async function deleteLock(canvasId: string, nodeId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const path = getLockPath(canvasId, nodeId);
    await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/${path}.json?auth=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
      method: 'DELETE',
    });
  } catch (err) {
    canvasLogger.default.warn('[ConflictStore] Failed to delete lock:', err);
  }
}

// ============================================================================
// Store
// ============================================================================

export const useConflictStore = create<ConflictStore>()((set, get) => ({
  localDrafts: {},
  activeConflict: null,
  lockedCards: {},

  startDraft(nodeId, data, version) {
    set((state) => ({
      localDrafts: {
        ...state.localDrafts,
        [nodeId]: { data, version, timestamp: Date.now() },
      },
    }));
  },

  clearDraft(nodeId) {
    set((state) => {
      const next = { ...state.localDrafts };
      delete next[nodeId];
      return { localDrafts: next };
    });
  },

  checkConflict(nodeId, nodeName, remoteData, remoteVersion, remoteLastModifiedBy) {
    const { localDrafts } = get();
    const draft = localDrafts[nodeId];

    // 没有本地草稿 → 无冲突，自动采用远程
    if (!draft) {
      canvasLogger.default.debug('[ConflictStore] No local draft, auto-adopting remote:', nodeId);
      return null;
    }

    // LWW 仲裁：remote.version > local.version → 自动 adopt
    if (remoteVersion > draft.version) {
      canvasLogger.default.debug('[ConflictStore] LWW: remote newer, auto-adopting:', nodeId, { remoteVersion, localVersion: draft.version });
      // 清除草稿，因为远程已被自动采纳
      get().clearDraft(nodeId);
      return null;
    }

    // 版本 ≤ 本地 → 冲突，弹出 ConflictDialog
    canvasLogger.default.info('[ConflictStore] Conflict detected:', nodeId, { remoteVersion, localVersion: draft.version });
    const conflict: ConflictData = {
      nodeId,
      nodeName,
      localData: draft.data,
      remoteData,
      localVersion: draft.version,
      remoteVersion,
    };
    set({ activeConflict: conflict });
    return conflict;
  },

  resolveKeepLocal(nodeId) {
    const { localDrafts } = get();
    const draft = localDrafts[nodeId];
    if (!draft) return null;
    set((state) => {
      const next = { ...state.localDrafts };
      delete next[nodeId];
      return { localDrafts: next, activeConflict: null };
    });
    return draft.data;
  },

  resolveUseRemote(nodeId) {
    set((state) => {
      const next = { ...state.localDrafts };
      delete next[nodeId];
      return { localDrafts: next, activeConflict: null };
    });
    // 返回 null 表示使用远程（保持不变）
    return null;
  },

  dismissConflict() {
    set({ activeConflict: null });
  },

  lockCard(nodeId, userId, username) {
    const lock: LockInfo = { lockedBy: userId, lockedAt: Date.now(), username };
    set((state) => ({
      lockedCards: { ...state.lockedCards, [nodeId]: lock },
    }));
    // Firebase write (best-effort)
    writeLock('default', nodeId, userId, username).catch(() => {});
  },

  unlockCard(nodeId) {
    set((state) => {
      const next = { ...state.lockedCards };
      delete next[nodeId];
      return { lockedCards: next };
    });
    // Firebase delete (best-effort)
    deleteLock('default', nodeId).catch(() => {});
  },

  syncLocks(canvasId) {
    // 每 10 秒检查一次锁超时（由调用方轮询）
    const { lockedCards } = get();
    const now = Date.now();
    for (const [nodeId, lock] of Object.entries(lockedCards)) {
      if (now - lock.lockedAt > LOCK_TIMEOUT_MS) {
        canvasLogger.default.debug('[ConflictStore] Lock timeout, unlocking:', nodeId);
        get().unlockCard(nodeId);
      }
    }
  },
}));
