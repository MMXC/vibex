'use client';

/**
 * useVersionHistory — S16-P2-1 Canvas Version History
 *
 * Features:
 * - Auto-snapshot with 30s debounce on canvas change
 * - Snapshot restore with confirmation
 * - Backup current state before restore
 * - Maximum 50 snapshots per project
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type SnapshotType = 'auto' | 'manual';

export interface Snapshot {
  id: string;
  projectId: string | null;
  canvasState: unknown;
  timestamp: number;
  type: SnapshotType;
  label?: string;
}

export interface UseVersionHistoryOptions {
  projectId?: string | null;
  debounceMs?: number;
  maxSnapshots?: number;
  getCanvasState: () => unknown;
}

export interface UseVersionHistoryReturn {
  snapshots: Snapshot[];
  isSnapshotting: boolean;
  isRestoring: boolean;
  pendingSnapshot: Snapshot | null;
  error: string | null;
  createSnapshot: (label?: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  clearAll: () => void;
  notifyChange: () => void;
}

const DEFAULT_DEBOUNCE_MS = 30_000;
const DEFAULT_MAX_SNAPSHOTS = 50;

export function useVersionHistory(
  options: UseVersionHistoryOptions
): UseVersionHistoryReturn {
  const {
    projectId = null,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    maxSnapshots = DEFAULT_MAX_SNAPSHOTS,
    getCanvasState,
  } = options;

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pendingSnapshot, setPendingSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentBackupRef = useRef<Snapshot | null>(null);

  const genId = useCallback(() => {
    return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }, []);

  const pruneSnapshots = useCallback(
    (list: Snapshot[]): Snapshot[] => {
      if (list.length <= maxSnapshots) return list;
      return list
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxSnapshots);
    },
    [maxSnapshots]
  );

  const saveSnapshot = useCallback(
    (type: SnapshotType, label?: string) => {
      setIsSnapshotting(true);
      setError(null);
      try {
        const snapshot: Snapshot = {
          id: genId(),
          projectId: projectId ?? null,
          canvasState: getCanvasState(),
          timestamp: Date.now(),
          type,
          label,
        };
        setSnapshots((prev) => pruneSnapshots([snapshot, ...prev]));
        setPendingSnapshot(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Snapshot failed');
      } finally {
        setIsSnapshotting(false);
      }
    },
    [projectId, getCanvasState, genId, pruneSnapshots]
  );

  const createSnapshot = useCallback(
    (label?: string) => {
      if (projectId === null) {
        setError('No project — cannot save snapshot');
        return;
      }
      saveSnapshot('manual', label);
    },
    [projectId, saveSnapshot]
  );

  const notifyChange = useCallback(() => {
    if (projectId === null) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const pending: Snapshot = {
      id: genId(),
      projectId,
      canvasState: null,
      timestamp: Date.now(),
      type: 'auto',
    };
    setPendingSnapshot(pending);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      saveSnapshot('auto');
    }, debounceMs);
  }, [projectId, debounceMs, saveSnapshot, genId]);

  const restoreSnapshot = useCallback(
    (id: string) => {
      setIsRestoring(true);
      setError(null);
      const snap = snapshots.find((s) => s.id === id);
      if (!snap) {
        setError(`Snapshot ${id} not found`);
        setIsRestoring(false);
        return;
      }
      try {
        // Backup current
        currentBackupRef.current = {
          id: genId(),
          projectId: snap.projectId,
          canvasState: getCanvasState(),
          timestamp: Date.now(),
          type: 'auto',
          label: 'Pre-restore backup',
        };
        // Re-add restored snapshot on top
        setSnapshots((prev) =>
          pruneSnapshots([
            { ...snap, timestamp: Date.now(), label: `Restored from ${new Date(snap.timestamp).toLocaleString()}` },
            ...prev,
          ])
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Restore failed');
      } finally {
        setIsRestoring(false);
      }
    },
    [snapshots, getCanvasState, genId, pruneSnapshots]
  );

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setSnapshots([]);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setPendingSnapshot(null);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    snapshots,
    isSnapshotting,
    isRestoring,
    pendingSnapshot,
    error,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    clearAll,
    notifyChange,
  };
}
