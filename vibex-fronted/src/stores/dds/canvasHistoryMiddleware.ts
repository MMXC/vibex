/**
 * canvasHistoryMiddleware — Middleware wrapping ddsChapterActions with Command history
 *
 * P001: U3-P001
 *
 * 包装原则（来自 AGENTS.md §2.3）：
 * - 不修改 action 本身的行为
 * - 不修改 DDSCanvasStore 的 state shape
 * - 不在 isPerforming = true 时记录 undo/redo 操作
 * - 每个被包装的 action 在执行后自动创建 Command 入栈
 */

import type { ChapterType, DDSCard, DDSEdge } from '@/types/dds';
import { ddsChapterActions, useDDSCanvasStore } from './DDSCanvasStore';
import { useCanvasHistoryStore } from './canvasHistoryStore';
import type { Command } from './canvasHistoryStore';

function captureChapterSnapshot(chapter: ChapterType) {
  const state = useDDSCanvasStore.getState();
  return {
    cards: state.chapters[chapter].cards.map((c) => ({ ...c })),
    edges: state.chapters[chapter].edges.map((e) => ({ ...e })),
  };
}

/**
 * Call once at module load to wrap ddsChapterActions.
 * After calling, every call to ddsChapterActions.* will:
 * 1. Capture pre-state snapshot
 * 2. Execute the original action
 * 3. Create a Command and push to useCanvasHistoryStore
 */
export function wrapDDSCanvasActionsWithHistory(): void {
  // ---- addCard ----
  const origAddCard = ddsChapterActions.addCard;
  ddsChapterActions.addCard = (chapter, card) => {
    const snapshot = captureChapterSnapshot(chapter);
    origAddCard(chapter, card);
    const cmd: Command = {
      id: crypto.randomUUID(),
      description: `addCard:${card.id}`,
      timestamp: Date.now(),
      execute: () => origAddCard(chapter, card),
      rollback: () => {
        useDDSCanvasStore.setState((state) => ({
          chapters: {
            ...state.chapters,
            [chapter]: {
              ...state.chapters[chapter],
              cards: snapshot.cards,
              edges: snapshot.edges,
            },
          },
        }));
      },
    };
    useCanvasHistoryStore.getState().execute(cmd);
  };

  // ---- updateCard ----
  const origUpdateCard = ddsChapterActions.updateCard;
  ddsChapterActions.updateCard = (chapter, id, updates) => {
    const state = useDDSCanvasStore.getState();
    const oldCard = state.chapters[chapter].cards.find((c) => c.id === id);
    const snapshot = oldCard ? ({ ...oldCard } as DDSCard) : null;
    origUpdateCard(chapter, id, updates);
    const cmd: Command = {
      id: crypto.randomUUID(),
      description: `updateCard:${id}`,
      timestamp: Date.now(),
      execute: () => origUpdateCard(chapter, id, updates),
      rollback: () => {
        if (snapshot) origUpdateCard(chapter, id, snapshot);
      },
    };
    useCanvasHistoryStore.getState().execute(cmd);
  };

  // ---- deleteCard ----
  const origDeleteCard = ddsChapterActions.deleteCard;
  ddsChapterActions.deleteCard = (chapter, id) => {
    const state = useDDSCanvasStore.getState();
    const deletedCard = state.chapters[chapter].cards.find((c) => c.id === id);
    const deletedEdges = state.chapters[chapter].edges.filter(
      (e) => e.source === id || e.target === id
    );
    origDeleteCard(chapter, id);
    const cmd: Command = {
      id: crypto.randomUUID(),
      description: `deleteCard:${id}`,
      timestamp: Date.now(),
      execute: () => origDeleteCard(chapter, id),
      rollback: () => {
        if (deletedCard) {
          useDDSCanvasStore.setState((state) => ({
            chapters: {
              ...state.chapters,
              [chapter]: {
                ...state.chapters[chapter],
                cards: [...state.chapters[chapter].cards, deletedCard],
                edges: [...state.chapters[chapter].edges, ...deletedEdges],
              },
            },
          }));
        }
      },
    };
    useCanvasHistoryStore.getState().execute(cmd);
  };

  // ---- addEdge ----
  const origAddEdge = ddsChapterActions.addEdge;
  ddsChapterActions.addEdge = (chapter, edge) => {
    const snapshot = captureChapterSnapshot(chapter);
    origAddEdge(chapter, edge);
    const cmd: Command = {
      id: crypto.randomUUID(),
      description: `addEdge:${edge.id}`,
      timestamp: Date.now(),
      execute: () => origAddEdge(chapter, edge),
      rollback: () => {
        useDDSCanvasStore.setState((state) => ({
          chapters: {
            ...state.chapters,
            [chapter]: {
              ...state.chapters[chapter],
              cards: snapshot.cards,
              edges: snapshot.edges,
            },
          },
        }));
      },
    };
    useCanvasHistoryStore.getState().execute(cmd);
  };

  // ---- deleteEdge ----
  const origDeleteEdge = ddsChapterActions.deleteEdge;
  ddsChapterActions.deleteEdge = (chapter, id) => {
    const state = useDDSCanvasStore.getState();
    const deletedEdge = state.chapters[chapter].edges.find((e) => e.id === id);
    origDeleteEdge(chapter, id);
    const cmd: Command = {
      id: crypto.randomUUID(),
      description: `deleteEdge:${id}`,
      timestamp: Date.now(),
      execute: () => origDeleteEdge(chapter, id),
      rollback: () => {
        if (deletedEdge) origAddEdge(chapter, deletedEdge);
      },
    };
    useCanvasHistoryStore.getState().execute(cmd);
  };
}