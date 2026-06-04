/**
 * backupStore.ts — Cloud backup task state management
 *
 * S62-E3: Canvas Cloud Backup and Recovery
 * Manages pending/active cloud backup tasks and cloud backup history.
 */
import { create } from 'zustand';

export interface CloudBackupRecord {
  id: string;
  canvasId: string;
  name: string;
  createdAt: string; // ISO timestamp
  size: number; // bytes
  version: string;
  restoredAt?: string;
}

export type BackupTaskStatus = 'idle' | 'uploading' | 'restoring' | 'listing' | 'deleting' | 'error';

interface BackupState {
  /** Current active task status */
  taskStatus: BackupTaskStatus;
  taskError: string | null;

  /** Pending backup: canvasId → true while upload is in-flight */
  pendingBackups: Set<string>;

  /** Active restore: canvasId of the canvas being restored */
  activeRestoreCanvasId: string | null;

  /** Cloud backup history (fetched from API) */
  cloudBackupHistory: CloudBackupRecord[];

  /** Last fetch timestamp */
  lastFetchedAt: number | null;

  // ── Actions ──────────────────────────────────────────────

  setTaskStatus: (status: BackupTaskStatus, error?: string) => void;

  addPendingBackup: (canvasId: string) => void;
  removePendingBackup: (canvasId: string) => void;

  setActiveRestore: (canvasId: string | null) => void;

  setCloudHistory: (records: CloudBackupRecord[]) => void;
  addCloudRecord: (record: CloudBackupRecord) => void;
  removeCloudRecord: (backupId: string) => void;

  clearError: () => void;
}

export const useBackupStore = create<BackupState>((set, get) => ({
  taskStatus: 'idle',
  taskError: null,
  pendingBackups: new Set<string>(),
  activeRestoreCanvasId: null,
  cloudBackupHistory: [],
  lastFetchedAt: null,

  setTaskStatus: (status, error) =>
    set({ taskStatus: status, taskError: error ?? null }),

  addPendingBackup: (canvasId) =>
    set((s) => ({
      pendingBackups: new Set(s.pendingBackups).add(canvasId),
      taskStatus: 'uploading',
      taskError: null,
    })),

  removePendingBackup: (canvasId) =>
    set((s) => {
      const next = new Set(s.pendingBackups);
      next.delete(canvasId);
      return {
        pendingBackups: next,
        taskStatus: next.size > 0 ? 'uploading' : 'idle',
      };
    }),

  setActiveRestore: (canvasId) =>
    set({ activeRestoreCanvasId: canvasId, taskStatus: canvasId ? 'restoring' : 'idle', taskError: null }),

  setCloudHistory: (records) =>
    set({ cloudBackupHistory: records, lastFetchedAt: Date.now() }),

  addCloudRecord: (record) =>
    set((s) => ({ cloudBackupHistory: [record, ...s.cloudBackupHistory] })),

  removeCloudRecord: (backupId) =>
    set((s) => ({
      cloudBackupHistory: s.cloudBackupHistory.filter((r) => r.id !== backupId),
    })),

  clearError: () => set({ taskError: null, taskStatus: 'idle' }),
}));
