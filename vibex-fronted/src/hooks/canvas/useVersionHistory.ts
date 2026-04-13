/**
 * useVersionHistory — Canvas Version History Hook
 * E4-F11: 版本历史
 *
 * 管理画布快照：创建、列表、恢复
 * 快照触发时机：手动保存、AI 生成完成
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import type { CanvasSnapshot } from '@/lib/canvas/types';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

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
  /** 最近一次加载/操作错误消息 */
  error: string | null;
}

export function useVersionHistory(): UseVersionHistoryReturn {
  const [snapshots, setSnapshots] = useState<CanvasSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CanvasSnapshot | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSnapshotTimeRef = useRef<number>(0);

  // Store selectors
  const contextNodes = useContextStore((s) => s.contextNodes);
  const flowNodes = useFlowStore((s) => s.flowNodes);
  const componentNodes = useComponentStore((s) => s.componentNodes);
  const projectId = useSessionStore((s) => s.projectId);
  const setContextNodes = useContextStore((s) => s.setContextNodes);
  const setFlowNodes = useFlowStore((s) => s.setFlowNodes);
  const setComponentNodes = useComponentStore((s) => s.setComponentNodes);

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);

    // === Phase 1: projectId null 拦截 — 引导用户先创建项目 ===
    if (!projectId) {
      setError('请先创建项目后再查看历史版本');
      setLoading(false);
      setSnapshots([]);
      return;
    }

    try {
      const result = await canvasApi.listSnapshots(projectId);
      if (result.success) {
        const sorted = [...result.snapshots].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSnapshots(sorted);
      }
    } catch (err) {
      canvasLogger.default.error('[useVersionHistory] loadSnapshots error:', err);
      setError(err instanceof Error ? err.message : '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createSnapshot = useCallback(async (label?: string): Promise<import('@/lib/canvas/types').CanvasSnapshot | null> => {
    // === Phase 1: projectId null 拦截 ===
    if (!projectId) {
      setError('请先创建项目后再保存历史版本');
      return null;
    }

    const now = Date.now();
    if (now - lastSnapshotTimeRef.current < SNAPSHOT_DEBOUNCE_MS) {
      return null;
    }
    lastSnapshotTimeRef.current = now;

    try {
      const result = await canvasApi.createSnapshot({
        projectId,
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
      canvasLogger.default.error('[useVersionHistory] createSnapshot error:', err);
      setError(err instanceof Error ? err.message : '创建快照失败，请重试');
      return null;
    }
  }, [contextNodes, flowNodes, componentNodes, projectId]);

  const createAiSnapshot = useCallback(async () => {
    // === Phase 1: projectId null 拦截 ===
    if (!projectId) {
      return;
    }

    const now = Date.now();
    if (now - lastSnapshotTimeRef.current < SNAPSHOT_DEBOUNCE_MS) {
      return;
    }
    lastSnapshotTimeRef.current = now;

    try {
      const result = await canvasApi.createSnapshot({
        projectId,
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
      canvasLogger.default.error('[useVersionHistory] createAiSnapshot error:', err);
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
      canvasLogger.default.error('[useVersionHistory] restoreSnapshot error:', err);
      return false;
    }
  }, [setContextNodes, setFlowNodes, setComponentNodes]);

  const open = useCallback(() => {
    setIsOpen(true);
    setError(null); // 打开时清除旧错误
    loadSnapshots();
  }, [loadSnapshots]);

  // === S1.3: projectId 从 null → 有效值时自动重载快照列表 ===
  useEffect(() => {
    if (!projectId) return; // 只在 projectId 有效时触发
    if (!isOpen) return;    // 面板打开时才加载（避免不必要的后台请求）
    loadSnapshots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // projectId 变化时触发

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
    error,
  };
}
