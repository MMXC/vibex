/**
 * snapshotHistoryStore — Canvas Version History via auto-snapshots
 *
 * S49-E4: Epic 画布版本历史可视化
 *
 * 设计决策：
 * - Debounce: 2s 内多次 auto-snapshot 调用只生成 1 个快照
 * - MAX_SNAPSHOTS = 20: 超出时 shift 最早的
 * - canvasState 存储序列化后的 nodes + edges
 * - 支持 'ai-generate' / 'pre-export' / 'manual' 三种 trigger
 * - module-level timer/variables 会被 vitest fake timers 正确重置
 */

import { create } from 'zustand';
import type { DDSCard, DDSEdge } from '@/types/dds';

// ==================== Types ====================

export type SnapshotTrigger = 'ai-generate' | 'pre-export' | 'manual';

export interface SnapshotCanvasState {
  nodes: DDSCard[];
  edges: DDSEdge[];
}

export interface Snapshot {
  id: string;
  trigger: SnapshotTrigger;
  timestamp: number;
  canvasState: SnapshotCanvasState;
  /** Human-readable label, auto-generated from trigger + time */
  label: string;
}

interface SnapshotHistoryState {
  snapshots: Snapshot[];
  selectedSnapshotId: string | null;
  /** Add an auto-snapshot with debounce (2s). Idempotent within debounce window. */
  addAutoSnapshot: (trigger: SnapshotTrigger, canvasState?: SnapshotCanvasState) => void;
  /** Manual snapshot — no debounce */
  addManualSnapshot: (canvasState: SnapshotCanvasState) => void;
  /** Select a snapshot for diff view */
  selectSnapshot: (id: string | null) => void;
  /** Restore canvas to a snapshot's state (returns the state, caller applies it) */
  restoreSnapshot: (id: string) => SnapshotCanvasState | null;
  /** Delete a specific snapshot */
  deleteSnapshot: (id: string) => void;
  /** Clear all snapshots */
  clearSnapshots: () => void;
  /** Get snapshot by id */
  getSnapshot: (id: string) => Snapshot | undefined;
  /** Get all snapshots */
  getSnapshots: () => Snapshot[];
  /** Flush any pending debounced snapshot immediately */
  flushSnapshot: () => void;
}

// ==================== Constants ====================

const MAX_SNAPSHOTS = 20;
const AUTO_SNAPSHOT_DEBOUNCE_MS = 2000;

// ==================== Module-level Debounce State ====================

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingTrigger: SnapshotTrigger | null = null;
let _pendingState: SnapshotCanvasState | null = null;

function clearDebounceTimer(): void {
  if (_debounceTimer !== null) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }
}

/** Reset all module-level debounce state. Call in beforeEach of tests. */
export function resetSnapshotDebounceState(): void {
  clearDebounceTimer();
  _pendingTrigger = null;
  _pendingState = null;
}

// ==================== Helpers ====================

function generateId(): string {
  return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildLabel(trigger: SnapshotTrigger, timestamp: number): string {
  const d = new Date(timestamp);
  const time = d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  switch (trigger) {
    case 'ai-generate':
      return `AI 生成 @ ${time}`;
    case 'pre-export':
      return `导出前 @ ${time}`;
    case 'manual':
      return `手动快照 @ ${time}`;
  }
}

function buildSnapshot(
  trigger: SnapshotTrigger,
  canvasState: SnapshotCanvasState
): Snapshot {
  return {
    id: generateId(),
    trigger,
    timestamp: Date.now(),
    canvasState,
    label: buildLabel(trigger, Date.now()),
  };
}

function addSnapshotToList(list: Snapshot[], snapshot: Snapshot): Snapshot[] {
  const next = [...list, snapshot];
  if (next.length > MAX_SNAPSHOTS) {
    next.shift();
  }
  return next;
}

// ==================== Store ====================

export const useSnapshotHistoryStore = create<SnapshotHistoryState>((set, get) => ({
  snapshots: [],
  selectedSnapshotId: null,

  addAutoSnapshot: (trigger: SnapshotTrigger, canvasState?: SnapshotCanvasState) => {
    clearDebounceTimer();
    // Cancel any previous pending
    _pendingTrigger = null;
    _pendingState = null;

    // Schedule a new pending snapshot
    _pendingTrigger = trigger;
    _pendingState = canvasState ?? { nodes: [], edges: [] };

    _debounceTimer = setTimeout(() => {
      const current = get();
      if (_pendingTrigger !== null) {
        const snap = buildSnapshot(_pendingTrigger, _pendingState ?? { nodes: [], edges: [] });
        set({ snapshots: addSnapshotToList(current.snapshots, snap) });
      }
      _pendingTrigger = null;
      _pendingState = null;
      _debounceTimer = null;
    }, AUTO_SNAPSHOT_DEBOUNCE_MS);
  },

  addManualSnapshot: (canvasState: SnapshotCanvasState) => {
    clearDebounceTimer();
    _pendingTrigger = null;
    _pendingState = null;
    const state = get();
    const snap = buildSnapshot('manual', canvasState);
    set({ snapshots: addSnapshotToList(state.snapshots, snap) });
  },

  selectSnapshot: (id: string | null) => {
    set({ selectedSnapshotId: id });
  },

  restoreSnapshot: (id: string) => {
    const snap = get().snapshots.find((s) => s.id === id);
    return snap ? snap.canvasState : null;
  },

  deleteSnapshot: (id: string) => {
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== id),
      selectedSnapshotId:
        state.selectedSnapshotId === id ? null : state.selectedSnapshotId,
    }));
  },

  clearSnapshots: () => {
    clearDebounceTimer();
    _pendingTrigger = null;
    _pendingState = null;
    set({ snapshots: [], selectedSnapshotId: null });
  },

  getSnapshot: (id: string) => {
    return get().snapshots.find((s) => s.id === id);
  },

  getSnapshots: () => get().snapshots,

  flushSnapshot: () => {
    const current = get();
    clearDebounceTimer();
    if (_pendingTrigger !== null) {
      const snap = buildSnapshot(
        _pendingTrigger,
        _pendingState ?? { nodes: [], edges: [] }
      );
      set({ snapshots: addSnapshotToList(current.snapshots, snap) });
      _pendingTrigger = null;
      _pendingState = null;
    }
  },
}));
