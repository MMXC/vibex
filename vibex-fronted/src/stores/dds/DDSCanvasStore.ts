/**
 * DDSCanvasStore — Zustand Store for Detailed Design Canvas
 *
 * 职责：管理 Canvas 卡片/边/章节/AI Draft 状态
 * 设计决策（来自 specs/dds-canvas-state.md §2.1）：
 * - DDSCanvasStore 是纯数据层，管理 chapters[].cards[] 和 chapters[].edges[]
 * - React Flow 的 nodes/edges 是渲染视图，由 useDDSCanvasFlow 单向同步
 * - AI Preview 状态不存入 Zustand，仅存在于组件级 state
 *
 * Epic 1: F2
 */

import { create } from 'zustand';
import type { Node } from '@xyflow/react';
import type {
  ChapterType,
  ChapterData,
  DDSCard,
  DDSEdge,
  DDSCanvasStoreState,
} from '@/types/dds';
import { useClipboardStore } from '@/stores/clipboardStore';
import { generateId } from '@/lib/canvas/id';
import { isOnline, queueCanvasOp } from '@/lib/offline-queue';

// ==================== Initial Chapter Data ====================

function createInitialChapterData(type: ChapterType): ChapterData {
  return {
    type,
    cards: [],
    edges: [],
    loading: false,
    error: null,
  };
}

// ==================== Initial State ====================

const initialChapters: Record<ChapterType, ChapterData> = {
  requirement: createInitialChapterData('requirement'),
  context: createInitialChapterData('context'),
  flow: createInitialChapterData('flow'),
  api: createInitialChapterData('api'),
  'business-rules': createInitialChapterData('business-rules'),
};

const initialState = {
  projectId: null as string | null,
  activeChapter: 'requirement' as ChapterType,
  chapters: initialChapters,
  crossChapterEdges: [] as DDSEdge[],
  chatHistory: [] as never[],
  isGenerating: false,
  selectedCardIds: [] as string[],
  selectedCardSnapshot: null as {
    cardId: string;
    cardData: DDSCard;
    wasVisible: boolean;
  } | null,
  isFullscreen: false,
  isDrawerOpen: false,
  collapsedGroups: new Set<string>(),
};

// ==================== Store ====================

export const useDDSCanvasStore = create<DDSCanvasStoreState>((set) => ({
  ...initialState,

  // ---- Project & Chapter ----

  setActiveChapter: (chapter) => set({ activeChapter: chapter }),

  loadChapter: async (chapter) => {
    set((state) => ({
      chapters: {
        ...state.chapters,
        [chapter]: { ...state.chapters[chapter], loading: true, error: null },
      },
    }));
    // 实际加载逻辑由 useDDSAPI 提供，store 仅维护加载状态
    try {
      // TODO: 调用 useDDSAPI().getCards(chapterId)
      set((state) => ({
        chapters: {
          ...state.chapters,
          [chapter]: { ...state.chapters[chapter], loading: false },
        },
      }));
    } catch {
      set((state) => ({
        chapters: {
          ...state.chapters,
          [chapter]: { ...state.chapters[chapter], loading: false, error: '加载失败' },
        },
      }));
    }
  },

  // ---- AI Conversation ----

  addMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),

  setIsGenerating: (v) => set({ isGenerating: v }),

  // ---- Selection ----

  selectCard: (id) =>
    set((state) => ({
      selectedCardIds: state.selectedCardIds.includes(id)
        ? state.selectedCardIds
        : [...state.selectedCardIds, id],
    })),

  deselectAll: () =>
    set({ selectedCardIds: [], selectedCardSnapshot: null }),

  setSelectedCardSnapshot: (snapshot) =>
    set({ selectedCardSnapshot: snapshot }),

  updateCardVisibility: (wasVisible: boolean) =>
    set((state) =>
      state.selectedCardSnapshot
        ? { selectedCardSnapshot: { ...state.selectedCardSnapshot, wasVisible } }
        : {}
    ),

  // ---- UI ----

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  // ---- E1: Group 折叠 ----

  toggleCollapse: (groupId) =>
    set((state) => {
      const next = new Set(state.collapsedGroups);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      // localStorage 持久化
      try {
        const canvasId = state.projectId ?? state.activeChapter;
        localStorage.setItem(`vibex-dds-collapsed-${canvasId}`, JSON.stringify([...next]));
      } catch { /* ignore */ }
      return { collapsedGroups: next };
    }),

  isCollapsed: (groupId: string): boolean =>
    useDDSCanvasStore.getState().collapsedGroups.has(groupId),

  // ---- E2: 冲突可视化 ----
  conflictedCardId: null,
}));

// ==================== Chapter Data Actions ====================
// 暴露 chapter 级别的 CRUD actions，方便组件直接调用

type ChapterActions = {
  addCard: (chapter: ChapterType, card: DDSCard) => void;
  updateCard: (chapter: ChapterType, id: string, updates: Partial<DDSCard>) => void;
  deleteCard: (chapter: ChapterType, id: string) => void;
  addEdge: (chapter: ChapterType, edge: DDSEdge) => void;
  deleteEdge: (chapter: ChapterType, id: string) => void;
  /** 添加跨章节 DAG 边（E4-U1） */
  addCrossChapterEdge: (edge: DDSEdge) => void;
  /** 删除跨章节 DAG 边（E4-U1） */
  deleteCrossChapterEdge: (id: string) => void;
  /** 批量设置章节数据（E2 Import） */
  setChapters: (chapters: ChapterData[]) => void;
  /** [S46-E3] Copy cards to clipboard */
  copyCards: (chapter: ChapterType, cardIds: string[]) => void;
  /** [S46-E3] Paste cards from clipboard to target chapter; returns pasted card IDs */
  pasteCards: (targetChapter: ChapterType) => string[];
};

export const ddsChapterActions: ChapterActions = {
  addCard: (chapter, card) => {
    // D3.2: Intercept addCard — if offline, queue the operation
    if (!isOnline()) {
      void queueCanvasOp({
        type: 'addNode',
        payload: { nodeId: card.id, card },
        canvasId: useDDSCanvasStore.getState().projectId ?? chapter,
        chapter,
      });
      return;
    }
    useDDSCanvasStore.setState((state) => ({
      chapters: {
        ...state.chapters,
        [chapter]: {
          ...state.chapters[chapter],
          cards: [...state.chapters[chapter].cards, card],
        },
      },
    }));
  },

  updateCard: (chapter, id, updates) => {
    // D3.2: Intercept updateCard — if offline, queue the operation
    if (!isOnline()) {
      void queueCanvasOp({
        type: 'updateNode',
        payload: { nodeId: id, updates },
        canvasId: useDDSCanvasStore.getState().projectId ?? chapter,
        chapter,
      });
      return;
    }
    useDDSCanvasStore.setState((state) => ({
      chapters: {
        ...state.chapters,
        [chapter]: {
          ...state.chapters[chapter],
          cards: state.chapters[chapter].cards.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        },
      },
    }));
  },

  deleteCard: (chapter, id) => {
    // D3.2: Intercept deleteCard — if offline, queue the operation
    if (!isOnline()) {
      void queueCanvasOp({
        type: 'deleteNode',
        payload: { nodeId: id },
        canvasId: useDDSCanvasStore.getState().projectId ?? chapter,
        chapter,
      });
      return;
    }
    useDDSCanvasStore.setState((state) => ({
      chapters: {
        ...state.chapters,
        [chapter]: {
          ...state.chapters[chapter],
          cards: state.chapters[chapter].cards.filter((c) => c.id !== id),
          // 同时删除关联的边
          edges: state.chapters[chapter].edges.filter(
            (e) => e.source !== id && e.target !== id
          ),
        },
      },
    }));
  },

  addEdge: (chapter, edge) => {
    // D3.2: Intercept addEdge — if offline, queue the operation
    if (!isOnline()) {
      void queueCanvasOp({
        type: 'addEdge',
        payload: { edgeId: edge.id, edge },
        canvasId: useDDSCanvasStore.getState().projectId ?? chapter,
        chapter,
      });
      return;
    }
    useDDSCanvasStore.setState((state) => ({
      chapters: {
        ...state.chapters,
        [chapter]: {
          ...state.chapters[chapter],
          edges: [...state.chapters[chapter].edges, edge],
        },
      },
    }));
  },

  deleteEdge: (chapter, id) => {
    // D3.2: Intercept deleteEdge — if offline, queue the operation
    if (!isOnline()) {
      void queueCanvasOp({
        type: 'deleteEdge',
        payload: { edgeId: id },
        canvasId: useDDSCanvasStore.getState().projectId ?? chapter,
        chapter,
      });
      return;
    }
    useDDSCanvasStore.setState((state) => ({
      chapters: {
        ...state.chapters,
        [chapter]: {
          ...state.chapters[chapter],
          edges: state.chapters[chapter].edges.filter((e) => e.id !== id),
        },
      },
    }));
  },

  addCrossChapterEdge: (edge) => {
    // D3.2: Intercept addCrossChapterEdge — if offline, queue the operation
    if (!isOnline()) {
      void queueCanvasOp({
        type: 'addCrossChapterEdge',
        payload: { edgeId: edge.id, edge },
        canvasId: useDDSCanvasStore.getState().projectId ?? 'cross-chapter',
      });
      return;
    }
    useDDSCanvasStore.setState((state) => ({
      crossChapterEdges: [...state.crossChapterEdges, edge],
    }));
  },

  deleteCrossChapterEdge: (id) => {
    // D3.2: Intercept deleteCrossChapterEdge — if offline, queue the operation
    if (!isOnline()) {
      void queueCanvasOp({
        type: 'deleteCrossChapterEdge',
        payload: { edgeId: id },
        canvasId: useDDSCanvasStore.getState().projectId ?? 'cross-chapter',
      });
      return;
    }
    useDDSCanvasStore.setState((state) => ({
      crossChapterEdges: state.crossChapterEdges.filter((e) => e.id !== id),
    }));
  },

  setChapters: (chapters) =>
    useDDSCanvasStore.setState((state) => {
      const next = { ...state.chapters };
      for (const ch of chapters) {
        next[ch.type] = ch;
      }
      return { chapters: next };
    }),

  // ---- [S46-E3] Copy / Paste ----

  copyCards: (chapter, cardIds) => {
    const { chapters } = useDDSCanvasStore.getState();
    const cards = chapters[chapter].cards.filter((c) => cardIds.includes(c.id));
    useClipboardStore.getState().copyCards(cards, chapter);
  },

  pasteCards: (targetChapter) => {
    const entry = useClipboardStore.getState().pasteCards();
    if (!entry) return [];

    // Generate new IDs for cards and edges
    const oldToNew: Record<string, string> = {};
    const newCards: DDSCard[] = entry.cards.map((c) => {
      const newId = generateId();
      oldToNew[c.id] = newId;
      return { ...c, id: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    });

    // Paste offset: first paste (pasteCount=1) → 0 offset, each subsequent pastes by 30px
    const offset = (entry.pasteCount - 1) * 30;
    const offsetCards = newCards.map((c) => ({
      ...c,
      position: {
        x: (c.position?.x ?? 0) + offset,
        y: (c.position?.y ?? 0) + offset,
      },
    }));

    // Find edges from source cards that are being pasted, and re-map their endpoints
    const state = useDDSCanvasStore.getState();
    const sourceEdges = state.chapters[entry.sourceChapter].edges.filter(
      (e) => oldToNew[e.source] != null && oldToNew[e.target] != null
    );
    const newEdges: DDSEdge[] = sourceEdges.map((e) => ({
      ...e,
      id: generateId(),
      source: oldToNew[e.source] ?? e.source,
      target: oldToNew[e.target] ?? e.target,
    }));

    // Add to target chapter
    useDDSCanvasStore.setState((s) => ({
      chapters: {
        ...s.chapters,
        [targetChapter]: {
          ...s.chapters[targetChapter],
          cards: [...s.chapters[targetChapter].cards, ...offsetCards],
          edges: [...s.chapters[targetChapter].edges, ...newEdges],
        },
      },
    }));

    return newCards.map((c) => c.id);
  },
};

// ==================== Selectors ====================

export const selectActiveChapterData = (state: DDSCanvasStoreState) =>
  state.chapters[state.activeChapter];

export const selectChapterCards = (chapter: ChapterType) => (state: DDSCanvasStoreState) =>
  state.chapters[chapter].cards;

export const selectChapterEdges = (chapter: ChapterType) => (state: DDSCanvasStoreState) =>
  state.chapters[chapter].edges;

// ==================== getVisibleNodes — E1-U5: 可见性过滤 ====================

/**
 * 根据折叠状态过滤节点。
 * 被折叠 Group 的所有后代子节点会被隐藏。
 * Group 本身始终可见（只是进入折叠态）。
 */
export function getVisibleNodes(nodes: Node[], collapsedGroups: Set<string>): Node[] {
  if (collapsedGroups.size === 0) return nodes;

  // 构建 parentId → children[] 映射（多叉树）
  const childrenMap = new Map<string, string[]>();
  for (const node of nodes) {
    const card = node.data as { parentId?: string; children?: string[] };
    if (card.parentId) {
      const existing = childrenMap.get(card.parentId) ?? [];
      existing.push(node.id);
      childrenMap.set(card.parentId, existing);
    }
  }

  // BFS 收集所有被折叠 Group 覆盖的子节点 ID
  const hiddenIds = new Set<string>();
  for (const groupId of collapsedGroups) {
    const queue = [...(childrenMap.get(groupId) ?? [])];
    while (queue.length) {
      const childId = queue.shift()!;
      hiddenIds.add(childId);
      queue.push(...(childrenMap.get(childId) ?? []));
    }
  }

  return nodes.filter((n) => !hiddenIds.has(n.id));
}

// ==================== Factory (for testing) ====================

export { createInitialChapterData };