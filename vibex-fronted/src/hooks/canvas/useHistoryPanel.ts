/**
 * useHistoryPanel — History Panel Hook
 * Sprint54 E1: Canvas Snapshot 版本历史 UI
 *
 * 订阅 canvasHistoryStore，展示 undo/redo 命令历史记录。
 * 支持从 IndexedDB 恢复历史元数据。
 */

'use client';

import { useCallback, useState } from 'react';
import {
  useCanvasHistoryStore,
  type CommandMeta,
} from '@/stores/dds/canvasHistoryStore';
import { useContextStore } from '@/lib/canvas/stores/contextStore';

export interface HistoryPanelSnapshot {
  /** Index in the past stack (0 = oldest) */
  index: number;
  /** Command metadata */
  cmd: CommandMeta;
  /** Human-readable timestamp */
  label: string;
  /** Whether this is the "current" state (top of undo stack) */
  isCurrent: boolean;
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export interface UseHistoryPanelReturn {
  /** History snapshots for display (past stack, newest last) */
  snapshots: HistoryPanelSnapshot[];
  /** Current undo stack depth */
  undoCount: number;
  /** Current redo stack depth */
  redoCount: number;
  /** Whether there is history to display */
  hasHistory: boolean;
  /** Whether history is being loaded from IndexedDB */
  loading: boolean;
  /** Restore to the command at given past-stack index (selectiveUndo) */
  restore: (index: number) => void;
  /** Clear all history */
  clear: () => void;
}

export function useHistoryPanel(): UseHistoryPanelReturn {
  const past = useCanvasHistoryStore((s) => s.past);
  const future = useCanvasHistoryStore((s) => s.future);
  const selectiveUndo = useCanvasHistoryStore((s) => s.selectiveUndo);
  const clear = useCanvasHistoryStore((s) => s.clear);
  const [loading, setLoading] = useState(false);

  // past is newest-last — snapshot list shows newest at bottom (most recent)
  const snapshots: HistoryPanelSnapshot[] = past.map((cmd, i) => ({
    index: i,
    cmd: {
      id: cmd.id,
      timestamp: cmd.timestamp,
      description: cmd.description,
    },
    label: formatTimestamp(cmd.timestamp),
    isCurrent: i === past.length - 1,
  }));

  const restore = useCallback(
    (index: number) => {
      // selectiveUndo undoes all commands AFTER index (back to and including index)
      // i.e. bring state back to the command at `index`
      selectiveUndo(index);
    },
    [selectiveUndo]
  );

  const handleClear = useCallback(() => {
    if (confirm('确定清空所有历史记录?')) {
      clear();
    }
  }, [clear]);

  return {
    snapshots,
    undoCount: past.length,
    redoCount: future.length,
    hasHistory: past.length > 0,
    loading,
    restore,
    clear: handleClear,
  };
}
