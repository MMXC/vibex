/**
 * useCanvasSnapshot — 画布快照 Hook
 *
 * Epic 5 实现: S5.4 (设计版本快照基础)
 * 提供画布状态序列化和快照管理功能
 */
// @ts-nocheck

import { useState, useCallback, useRef } from 'react';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

/** 快照数据结构 */
export interface CanvasSnapshot {
  /** 快照唯一 ID */
  id: string;
  /** 快照名称（用户自定义或自动生成） */
  name: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 快照数据 */
  data: CanvasSnapshotData;
}

/** 快照数据内容 */
export interface CanvasSnapshotData {
  /** 限界上下文节点 */
  contextNodes: BoundedContextNode[];
  /** 业务流程节点 */
  flowNodes: BusinessFlowNode[];
  /** 组件节点 */
  componentNodes: ComponentNode[];
  /** 当前阶段 */
  phase: string;
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/** Hook 返回类型 */
interface UseCanvasSnapshotReturn {
  /** 快照列表 */
  snapshots: CanvasSnapshot[];
  /** 当前选中的快照 ID */
  selectedSnapshotId: string | null;
  /** 创建新快照 */
  takeSnapshot: (name?: string, data?: CanvasSnapshotData) => CanvasSnapshot;
  /** 删除快照 */
  deleteSnapshot: (id: string) => void;
  /** 选择快照 */
  selectSnapshot: (id: string | null) => void;
  /** 恢复快照 */
  restoreSnapshot: (id: string) => CanvasSnapshotData | null;
  /** 清空所有快照 */
  clearSnapshots: () => void;
  /** 更新快照名称 */
  renameSnapshot: (id: string, name: string) => void;
  /** 快照数量 */
  count: number;
}

/** 生成唯一 ID */
function generateId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** 生成默认快照名称 */
function generateDefaultName(index: number): string {
  const date = new Date();
  const dateStr = date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `快照 ${dateStr} ${timeStr} (${index})`;
}

/**
 * 画布快照 Hook
 *
 * @param initialSnapshots - 初始快照列表（可选）
 * @param maxSnapshots - 最大快照数量限制（默认 50）
 *
 * @example
 * ```tsx
 * const { takeSnapshot, snapshots, restoreSnapshot } = useCanvasSnapshot();
 *
 * // 创建快照
 * const snapshot = takeSnapshot('我的设计版本');
 *
 * // 恢复快照
 * const data = restoreSnapshot(snapshot.id);
 * ```
 */
export function useCanvasSnapshot(
  initialSnapshots: CanvasSnapshot[] = [],
  maxSnapshots: number = 50
): UseCanvasSnapshotReturn {
  const [snapshots, setSnapshots] = useState<CanvasSnapshot[]>(initialSnapshots);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  // 快照计数 ref（用于生成默认名称）
  const snapshotCountRef = useRef(initialSnapshots.length);

  /**
   * 创建新快照
   */
  const takeSnapshot = useCallback(
    (name?: string, data?: CanvasSnapshotData): CanvasSnapshot => {
      const id = generateId();
      const count = ++snapshotCountRef.current;
      const snapshotName = name || generateDefaultName(count);

      const newSnapshot: CanvasSnapshot = {
        id,
        name: snapshotName,
        timestamp: Date.now(),
        data: data || {
          contextNodes: [],
          flowNodes: [],
          componentNodes: [],
          phase: 'clarification',
        },
      };

      setSnapshots((prev) => {
        // 如果超过最大数量，删除最早的快照
        const updated = [...prev, newSnapshot];
        if (updated.length > maxSnapshots) {
          return updated.slice(-maxSnapshots);
        }
        return updated;
      });

      return newSnapshot;
    },
    [maxSnapshots]
  );

  /**
   * 删除快照
   */
  const deleteSnapshot = useCallback((id: string): void => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    setSelectedSnapshotId((current) => (current === id ? null : current));
  }, []);

  /**
   * 选择快照
   */
  const selectSnapshot = useCallback((id: string | null): void => {
    setSelectedSnapshotId(id);
  }, []);

  /**
   * 恢复快照数据
   */
  const restoreSnapshot = useCallback(
    (id: string): CanvasSnapshotData | null => {
      const snapshot = snapshots.find((s) => s.id === id);
      return snapshot ? snapshot.data : null;
    },
    [snapshots]
  );

  /**
   * 清空所有快照
   */
  const clearSnapshots = useCallback((): void => {
    setSnapshots([]);
    setSelectedSnapshotId(null);
    snapshotCountRef.current = 0;
  }, []);

  /**
   * 更新快照名称
   */
  const renameSnapshot = useCallback((id: string, name: string): void => {
    setSnapshots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  return {
    snapshots,
    selectedSnapshotId,
    takeSnapshot,
    deleteSnapshot,
    selectSnapshot,
    restoreSnapshot,
    clearSnapshots,
    renameSnapshot,
    count: snapshots.length,
  };
}

/**
 * 快照差异计算辅助函数
 *
 * @param snapshotA - 快照 A
 * @param snapshotB - 快照 B
 * @returns 差异描述数组
 */
export function computeSnapshotDiff(
  snapshotA: CanvasSnapshot,
  snapshotB: CanvasSnapshot
): SnapshotDiff[] {
  const diffs: SnapshotDiff[] = [];

  // 比较上下文节点数量
  if (snapshotA.data.contextNodes.length !== snapshotB.data.contextNodes.length) {
    diffs.push({
      type: 'count',
      path: 'contextNodes',
      before: snapshotA.data.contextNodes.length,
      after: snapshotB.data.contextNodes.length,
    });
  }

  // 比较流程节点数量
  if (snapshotA.data.flowNodes.length !== snapshotB.data.flowNodes.length) {
    diffs.push({
      type: 'count',
      path: 'flowNodes',
      before: snapshotA.data.flowNodes.length,
      after: snapshotB.data.flowNodes.length,
    });
  }

  // 比较组件节点数量
  if (snapshotA.data.componentNodes.length !== snapshotB.data.componentNodes.length) {
    diffs.push({
      type: 'count',
      path: 'componentNodes',
      before: snapshotA.data.componentNodes.length,
      after: snapshotB.data.componentNodes.length,
    });
  }

  // 比较阶段
  if (snapshotA.data.phase !== snapshotB.data.phase) {
    diffs.push({
      type: 'phase',
      path: 'phase',
      before: snapshotA.data.phase,
      after: snapshotB.data.phase,
    });
  }

  return diffs;
}

/** 快照差异类型 */
export interface SnapshotDiff {
  type: 'count' | 'phase' | 'content';
  path: string;
  before: unknown;
  after: unknown;
}

export default useCanvasSnapshot;
