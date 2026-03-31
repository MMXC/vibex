/**
 * VibeX Canvas — History Slice
 * 三树独立的 Undo/Redo 历史记录管理
 *
 * 设计原则 (AGENTS.md ADR-002):
 * - 三树独立历史，互不干扰
 * - maxHistoryLength = 50 步，超出自动丢弃最旧记录
 * - 使用独立 store，不依赖 ReactFlow 内置 history
 * - 对组件透明，组件只需调用原有 CRUD 操作
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
import { create } from 'zustand';
import type { TreeType, BoundedContextNode, BusinessFlowNode, ComponentNode } from './types';

// =============================================================================
// Types
// =============================================================================

/** 单树历史栈 */
export interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

/** 三树历史状态 */
export interface HistoryState {
  contextHistory: HistoryStack<BoundedContextNode[]>;
  flowHistory: HistoryStack<BusinessFlowNode[]>;
  componentHistory: HistoryStack<ComponentNode[]>;
  /** Prevents re-entrant recordSnapshot calls (circular trigger guard) */
  isRecording: boolean;
}

/** HistorySlice 公共接口 */
export interface HistorySlice {
  // === State (readonly) ===
  /** Context 树历史栈 */
  contextHistory: HistoryStack<BoundedContextNode[]>;
  /** Flow 树历史栈 */
  flowHistory: HistoryStack<BusinessFlowNode[]>;
  /** Component 树历史栈 */
  componentHistory: HistoryStack<ComponentNode[]>;
  /** Readonly flag: true while recordSnapshot is executing (prevents circular triggers) */
  isRecording: boolean;

  // === Computed ===
  /** 获取指定树的历史栈 */
  getTreeHistory: (tree: TreeType) => HistoryStack<unknown>;
  /** 指定树是否可撤销 */
  canUndo: (tree: TreeType) => boolean;
  /** 指定树是否可重做 */
  canRedo: (tree: TreeType) => boolean;
  /** 三树是否都可撤销 */
  canUndoAny: () => boolean;
  /** 三树是否都可重做 */
  canRedoAny: () => boolean;

  // === Actions ===
  /** 初始化/重置指定树的历史（loadExampleData 时调用） */
  initTreeHistory: (tree: TreeType, present: BoundedContextNode[] | BusinessFlowNode[] | ComponentNode[]) => void;
  /** 初始化/重置所有三树历史 */
  initAllHistories: (
    contexts: BoundedContextNode[],
    flows: BusinessFlowNode[],
    components: ComponentNode[]
  ) => void;
  /** 记录操作快照（节点增删改后自动调用） */
  recordSnapshot: (
    tree: TreeType,
    nodes: BoundedContextNode[] | BusinessFlowNode[] | ComponentNode[]
  ) => void;
  /** 撤销（返回撤销后的状态快照，null 表示无法撤销） */
  undo: (tree: TreeType) => BoundedContextNode[] | BusinessFlowNode[] | ComponentNode[] | null;
  /** 重做（返回重做后的状态快照，null 表示无法重做） */
  redo: (tree: TreeType) => BoundedContextNode[] | BusinessFlowNode[] | ComponentNode[] | null;
  /** 清除指定树历史 */
  clearTreeHistory: (tree: TreeType) => void;
  /** 清除所有历史 */
  clearAllHistories: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_HISTORY_LENGTH = 50;

// =============================================================================
// Helpers
// =============================================================================

function createEmptyStack<T>(present: T): HistoryStack<T> {
  return { past: [], present, future: [] };
}

function pushToHistory<T>(stack: HistoryStack<T>, newPresent: T): HistoryStack<T> {
  const past = [...stack.past, stack.present];
  // Enforce max depth
  if (past.length > MAX_HISTORY_LENGTH) {
    past.shift();
  }
  return { past, present: newPresent, future: [] };
}

function undoStack<T>(stack: HistoryStack<T>): { newStack: HistoryStack<T>; result: T | null } {
  if (stack.past.length === 0) {
    return { newStack: stack, result: null };
  }
  const past = [...stack.past];
  const previous = past.pop() as T;
  const newStack: HistoryStack<T> = {
    past,
    present: previous,
    future: [stack.present, ...stack.future],
  };
  return { newStack, result: previous };
}

function redoStack<T>(stack: HistoryStack<T>): { newStack: HistoryStack<T>; result: T | null } {
  if (stack.future.length === 0) {
    return { newStack: stack, result: null };
  }
  const future = [...stack.future];
  const next = future.shift() as T;
  const newStack: HistoryStack<T> = {
    past: [...stack.past, stack.present],
    present: next,
    future,
  };
  return { newStack, result: next };
}

// =============================================================================
// Store Factory
// =============================================================================

/**
 * Create a history store instance.
 *
 * This store maintains independent undo/redo stacks for each of the three trees.
 * It subscribes to canvasStore changes and records snapshots when nodes change.
 *
 * Usage:
 * ```ts
 * import { useHistoryStore } from '@/lib/canvas/historySlice';
 *
 * // Check if undo is available
 * const canUndo = useHistoryStore(s => s.canUndo('context'));
 *
 * // Undo
 * const prev = useHistoryStore.getState().undo('context');
 * if (prev) {
 *   useCanvasStore.getState().setContextNodes(prev);
 * }
 * ```
 */
export const useHistoryStore = create<HistorySlice>()((set, get) => ({
  // === Initial State ===
  contextHistory: createEmptyStack<BoundedContextNode[]>([]),
  flowHistory: createEmptyStack<BusinessFlowNode[]>([]),
  componentHistory: createEmptyStack<ComponentNode[]>([]),
  isRecording: false,

  // === Computed ===

  getTreeHistory: (tree: TreeType) => {
    const state = get();
    if (tree === 'context') return state.contextHistory;
    if (tree === 'flow') return state.flowHistory;
    return state.componentHistory;
  },

  canUndo: (tree: TreeType) => {
    const history = get().getTreeHistory(tree) as HistoryStack<unknown>;
    return history.past.length > 0;
  },

  canRedo: (tree: TreeType) => {
    const history = get().getTreeHistory(tree) as HistoryStack<unknown>;
    return history.future.length > 0;
  },

  canUndoAny: () => {
    const s = get();
    return s.canUndo('context') || s.canUndo('flow') || s.canUndo('component');
  },

  canRedoAny: () => {
    const s = get();
    return s.canRedo('context') || s.canRedo('flow') || s.canRedo('component');
  },

  // === Actions ===

  initTreeHistory: (tree, present) => {
    if (tree === 'context') {
      set({ contextHistory: createEmptyStack<BoundedContextNode[]>(present as BoundedContextNode[]) });
    } else if (tree === 'flow') {
      set({ flowHistory: createEmptyStack<BusinessFlowNode[]>(present as BusinessFlowNode[]) });
    } else {
      set({ componentHistory: createEmptyStack<ComponentNode[]>(present as ComponentNode[]) });
    }
  },

  initAllHistories: (contexts, flows, components) => {
    set({
      contextHistory: createEmptyStack<BoundedContextNode[]>(contexts),
      flowHistory: createEmptyStack<BusinessFlowNode[]>(flows),
      componentHistory: createEmptyStack<ComponentNode[]>(components),
    });
  },

  recordSnapshot: (tree, nodes) => {
    const state = get();
    // Guard: prevent re-entrant calls (circular trigger protection)
    if (state.isRecording) return;
    set({ isRecording: true });
    try {
      // Deep clone to prevent caller mutation from corrupting history
      const clonedNodes = JSON.parse(JSON.stringify(nodes)) as
        | BoundedContextNode[]
        | BusinessFlowNode[]
        | ComponentNode[];
      if (tree === 'context') {
        const isFirstRecord = state.contextHistory.past.length === 0 && state.contextHistory.present.length === 0;
        if (isFirstRecord) {
          // First record: just set present, don't push to past
          set({ contextHistory: { ...state.contextHistory, present: clonedNodes as BoundedContextNode[] } });
        } else {
          const newStack = pushToHistory(state.contextHistory, clonedNodes as BoundedContextNode[]);
          set({ contextHistory: newStack });
        }
      } else if (tree === 'flow') {
        const isFirstRecord = state.flowHistory.past.length === 0 && state.flowHistory.present.length === 0;
        if (isFirstRecord) {
          set({ flowHistory: { ...state.flowHistory, present: clonedNodes as BusinessFlowNode[] } });
        } else {
          const newStack = pushToHistory(state.flowHistory, clonedNodes as BusinessFlowNode[]);
          set({ flowHistory: newStack });
        }
      } else {
        const isFirstRecord = state.componentHistory.past.length === 0 && state.componentHistory.present.length === 0;
        if (isFirstRecord) {
          set({ componentHistory: { ...state.componentHistory, present: clonedNodes as ComponentNode[] } });
        } else {
          const newStack = pushToHistory(state.componentHistory, clonedNodes as ComponentNode[]);
          set({ componentHistory: newStack });
        }
      }
    } finally {
      set({ isRecording: false });
    }
  },

  undo: (tree) => {
    const state = get();
    let result: BoundedContextNode[] | BusinessFlowNode[] | ComponentNode[] | null = null;

    if (tree === 'context') {
      const { newStack, result: r } = undoStack(state.contextHistory);
      set({ contextHistory: newStack });
      result = r;
    } else if (tree === 'flow') {
      const { newStack, result: r } = undoStack(state.flowHistory);
      set({ flowHistory: newStack });
      result = r;
    } else {
      const { newStack, result: r } = undoStack(state.componentHistory);
      set({ componentHistory: newStack });
      result = r;
    }

    return result;
  },

  redo: (tree) => {
    const state = get();
    let result: BoundedContextNode[] | BusinessFlowNode[] | ComponentNode[] | null = null;

    if (tree === 'context') {
      const { newStack, result: r } = redoStack(state.contextHistory);
      set({ contextHistory: newStack });
      result = r;
    } else if (tree === 'flow') {
      const { newStack, result: r } = redoStack(state.flowHistory);
      set({ flowHistory: newStack });
      result = r;
    } else {
      const { newStack, result: r } = redoStack(state.componentHistory);
      set({ componentHistory: newStack });
      result = r;
    }

    return result;
  },

  clearTreeHistory: (tree) => {
    const state = get();
    if (tree === 'context') {
      set({ contextHistory: createEmptyStack(state.contextHistory.present) });
    } else if (tree === 'flow') {
      set({ flowHistory: createEmptyStack(state.flowHistory.present) });
    } else {
      set({ componentHistory: createEmptyStack(state.componentHistory.present) });
    }
  },

  clearAllHistories: () => {
    const state = get();
    set({
      contextHistory: createEmptyStack(state.contextHistory.present),
      flowHistory: createEmptyStack(state.flowHistory.present),
      componentHistory: createEmptyStack(state.componentHistory.present),
    });
  },
}));

// =============================================================================
// Exported helpers for use outside React
// =============================================================================

/** Singleton reference for non-hook usage */
export const getHistoryStore = () => useHistoryStore.getState();
