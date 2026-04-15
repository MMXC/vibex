'use client';

/**
 * useProjectLoader — 项目加载 Hook
 * E4-U3: 三树数据恢复
 *
 * 在 Canvas 挂载时自动加载项目的最新快照并恢复到 Zustand
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { restoreStore, type CanvasSnapshotData } from '@/lib/canvas/serialize';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

interface UseProjectLoaderOptions {
  /** Project ID to load */
  projectId: string | null;
  /** Auto-load on mount (default: true) */
  autoLoad?: boolean;
}

interface UseProjectLoaderReturn {
  /** 是否正在加载 */
  loading: boolean;
  /** 是否加载完成 */
  loaded: boolean;
  /** 加载错误 */
  error: string | null;
  /** 加载快照数据 */
  loadedData: CanvasSnapshotData | null;
  /** 手动触发加载 */
  loadProject: () => Promise<void>;
}

/**
 * 加载项目快照并恢复三树
 */
export function useProjectLoader({
  projectId,
  autoLoad = true,
}: UseProjectLoaderOptions): UseProjectLoaderReturn {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<CanvasSnapshotData | null>(null);
  const hasLoadedRef = useRef(false);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setError('请先创建项目');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await canvasApi.listSnapshots(projectId);

      if (!result.success || result.snapshots.length === 0) {
        // No snapshot — empty canvas, not an error
        setLoading(false);
        setLoaded(true);
        canvasLogger.default.info('[useProjectLoader] No snapshot found, starting with empty canvas');
        return;
      }

      // Get the latest snapshot
      const sorted = [...result.snapshots].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latest = sorted[0];

      // Get full snapshot data
      const snapshotResult = await canvasApi.getSnapshot(latest.snapshotId);

      if (!snapshotResult.success || !snapshotResult.snapshot) {
        setError('加载快照数据失败');
        setLoading(false);
        return;
      }

      // Deserialize and restore
      const snapshot = snapshotResult.snapshot;

      // Try to deserialize from data field if available
      if (snapshot.contextNodes && snapshot.flowNodes && snapshot.componentNodes) {
        const data: CanvasSnapshotData = {
          version: 1,
          savedAt: snapshot.createdAt,
          contextNodes: snapshot.contextNodes,
          flowNodes: snapshot.flowNodes,
          componentNodes: snapshot.componentNodes,
        };
        restoreStore(data);
        setLoadedData(data);
      } else {
        canvasLogger.default.warn('[useProjectLoader] Snapshot has no embedded node data');
      }

      setLoaded(true);
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败';
      setError(msg);
      canvasLogger.default.error('[useProjectLoader] loadProject error:', err);
      setLoading(false);
    }
  }, [projectId]);

  // Auto-load on mount
  useEffect(() => {
    if (!autoLoad || !projectId || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadProject();
  }, [autoLoad, projectId, loadProject]);

  return {
    loading,
    loaded,
    error,
    loadedData,
    loadProject,
  };
}
