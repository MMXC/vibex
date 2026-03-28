/**
 * useVersionHistory — Canvas Version History Hook
 * E4-F11: 版本历史
 *
 * 管理画布快照：创建、列表、恢复
 * 快照触发时机：手动保存、AI 生成完成
 */
'use client';

import { useCallback, useRef, useState } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import type { CanvasSnapshot } from '@/lib/canvas/types';

const SNAPSHOT_DEBOUNCE_MS = 5000; // 5s minimum between manual snapshots

export interface UseVersionHistoryReturn {
  /** 快照列表 */
  snapshots: CanvasSnapshot[];
  /** 是否正在加载 */
  loading: boolean;
  /** 是否正在恢复 */
  restoring: boolean;
  /** 是否正在创建 */
  creating: boolean;
  /** 面板是否打开 */
  isOpen: boolean;
  /** 选中的快照（用于预览） */
  selectedSnapshot: CanvasSnapshot | null;
  /** 打开面板 */
  open: () => void;
  /** 关闭面板 */
  close: () => void;
  /** 选中快照预览 */
  selectSnapshot: (snapshot: CanvasSnapshot | null) => void;
  /** 加载快照列表 */
  loadSnapshots: () => Promise<void>;
  /** 创建手动快照 */
  createSnapshot: (label?: string) => Promise<import('@/lib/canvas/types').CanvasSnapshot | null>;
  /** 创建 AI 完成快照 */
  createAiSnapshot: () => Promise<void>;
  /** 恢复到指定快照 */
  restoreSnapshot: (snapshotId: string) => Promise<boolean>;
}

export function useVersionHistory(): UseVersionHistoryReturn {
  const [snapshots, setSnapshots] = useState<CanvasSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CanvasSnapshot | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [creating, setCreating] = useState(false);

  const lastSnapshotTimeRef = useRef<number>(0);

  // Store selectors
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);
  const projectId = useCanvasStore((s) => s.projectId);
  const setContextNodes = useCanvasStore((s) => s.setContextNodes);
  const setFlowNodes = useCanvasStore((s) => s.setFlowNodes);
  const setComponentNodes = useCanvasStore((s) => s.setComponentNodes);

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const result = await canvasApi.listSnapshots(projectId ?? undefined);
      if (result.success) {
        const sorted = [...result.snapshots].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSnapshots(sorted);
      }
    } catch (err) {
      console.error('[useVersionHistory] loadSnapshots error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createSnapshot = useCallback(async (label?: string): Promise<import('@/lib/canvas/types').CanvasSnapshot | null> => {
    const now = Date.now();
    if (now - lastSnapshotTimeRef.current < SNAPSHOT_DEBOUNCE_MS) {
      return null;
    }
    lastSnapshotTimeRef.current = now;

    try {
      const result = await canvasApi.createSnapshot({
        projectId: projectId ?? null,
        label: label ?? `手动保存 (${new Date().toLocaleString('zh-CN')})`,
        trigger: 'manual',
        contextNodes,
        flowNodes,
        componentNodes,
      });

      if (result.success) {
        setSnapshots((prev) => [result.snapshot, ...prev]);
        return result.snapshot;
      }
      return null;
    } catch (err) {
      console.error('[useVersionHistory] createSnapshot error:', err);
      return null;
    }
  }, [contextNodes, flowNodes, componentNodes, projectId]);

  const createAiSnapshot = useCallback(async () => {
    const now = Date.now();
    if (now - lastSnapshotTimeRef.current < SNAPSHOT_DEBOUNCE_MS) {
      return;
    }
    lastSnapshotTimeRef.current = now;

    try {
      const result = await canvasApi.createSnapshot({
        projectId: projectId ?? null,
        label: `AI 生成完成 (${new Date().toLocaleString('zh-CN')})`,
        trigger: 'ai_complete',
        contextNodes,
        flowNodes,
        componentNodes,
      });

      if (result.success) {
        setSnapshots((prev) => [result.snapshot, ...prev]);
      }
    } catch (err) {
      console.error('[useVersionHistory] createAiSnapshot error:', err);
    }
  }, [contextNodes, flowNodes, componentNodes, projectId]);

  const restoreSnapshot = useCallback(async (snapshotId: string): Promise<boolean> => {
    try {
      const result = await canvasApi.restoreSnapshot(snapshotId);

      if (result.success) {
        setContextNodes(result.contextNodes);
        setFlowNodes(result.flowNodes);
        setComponentNodes(result.componentNodes);
        setIsOpen(false);
        setSelectedSnapshot(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[useVersionHistory] restoreSnapshot error:', err);
      return false;
    }
  }, [setContextNodes, setFlowNodes, setComponentNodes]);

  const open = useCallback(() => {
    setIsOpen(true);
    loadSnapshots();
  }, [loadSnapshots]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedSnapshot(null);
  }, []);

  const selectSnapshot = useCallback((snapshot: CanvasSnapshot | null) => {
    setSelectedSnapshot(snapshot);
  }, []);

  return {
    snapshots,
    loading,
    isOpen,
    selectedSnapshot,
    open,
    close,
    selectSnapshot,
    loadSnapshots,
    createSnapshot,
    createAiSnapshot,
    restoreSnapshot,
    restoring,
    creating,
  };
}
