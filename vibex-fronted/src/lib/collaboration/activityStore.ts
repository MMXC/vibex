/**
 * activityStore — Zustand store for collaboration activity feed
 * S60-E3: 协作活动流 + 在线状态指示
 *
 * Manages:
 * - Activity entries (recent 5, FIFO ring buffer)
 * - Per-user online/idle status derived from lastSeen timestamps
 *
 * Updated by activityHandler when receiving WS activity:update messages.
 */

import { create } from 'zustand';
import type { ActivityEntry, ActivityType } from './types';

export type UserStatus = 'online' | 'idle' | 'offline';

/** Per-user status derived from lastSeen timestamp */
export interface UserActivityStatus {
  userId: string;
  userName: string;
  status: UserStatus;
  lastSeen: number;
}

const IDLE_THRESHOLD_MS = 60_000; // 60 seconds → idle
const OFFLINE_THRESHOLD_MS = 5 * 60_000; // 5 minutes → offline

interface ActivityState {
  /** Ring buffer of recent activity entries (max 5) */
  entries: ActivityEntry[];

  /** Per-user status snapshot */
  userStatuses: Record<string, UserActivityStatus>;

  /** Add a batch of entries from WS message */
  addEntries: (entries: ActivityEntry[]) => void;

  /** Add a single local entry (e.g., self-triggered action) */
  addEntry: (entry: Omit<ActivityEntry, 'id'>) => void;

  /** Update user status from activity entry */
  updateUserStatus: (userId: string, userName: string, timestamp: number) => void;

  /** Clear all entries */
  clearEntries: () => void;

  /** Get derived status for a user */
  getUserStatus: (userId: string) => UserStatus;

  /** All entries sorted newest-first */
  getRecentEntries: (limit?: number) => ActivityEntry[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function deriveStatus(lastSeen: number): UserStatus {
  const age = Date.now() - lastSeen;
  if (age < IDLE_THRESHOLD_MS) return 'online';
  if (age < OFFLINE_THRESHOLD_MS) return 'idle';
  return 'offline';
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  entries: [],
  userStatuses: {},

  addEntries: (newEntries: ActivityEntry[]) =>
    set((state) => {
      // Ring buffer: keep newest 5 entries
      const combined = [...state.entries, ...newEntries];
      const trimmed = combined
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      return { entries: trimmed };
    }),

  addEntry: (entry: Omit<ActivityEntry, 'id'>) =>
    set((state) => {
      const full: ActivityEntry = { ...entry, id: generateId() };
      const combined = [full, ...state.entries].sort((a, b) => b.timestamp - a.timestamp);
      return { entries: combined.slice(0, 5) };
    }),

  updateUserStatus: (userId: string, userName: string, timestamp: number) =>
    set((state) => ({
      userStatuses: {
        ...state.userStatuses,
        [userId]: {
          userId,
          userName,
          status: deriveStatus(timestamp),
          lastSeen: timestamp,
        },
      },
    })),

  clearEntries: () => set({ entries: [] }),

  getUserStatus: (userId: string): UserStatus => {
    const record = get().userStatuses[userId];
    if (!record) return 'offline';
    // Re-derive status on access (avoids stale state)
    return deriveStatus(record.lastSeen);
  },

  getRecentEntries: (limit?: number): ActivityEntry[] => {
    const sorted = [...get().entries].sort((a, b) => b.timestamp - a.timestamp);
    return limit !== undefined ? sorted.slice(0, limit) : sorted;
  },
}));

/** Activity type to human-readable label */
export function activityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    join: '加入了画布',
    leave: '离开了画布',
    edit: '编辑了节点',
    add: '添加了节点',
    delete: '删除了节点',
    lock: '锁定了节点',
    unlock: '解锁了节点',
    cursor_move: '移动了光标',
  };
  return labels[type] ?? type;
}

/** Format timestamp as relative time */
export function formatActivityTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  return `${Math.floor(diff / 3_600_000)} 小时前`;
}
