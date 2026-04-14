/**
 * DDSCanvasStore Unit Tests
 * Epic 1: F2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDDSCanvasStore, ddsChapterActions } from '../DDSCanvasStore';
import type { DDSCard, DDSEdge, UserStoryCard, BoundedContextCard, FlowStepCard } from '@/types/dds';

// ==================== Fixtures ====================

const createUserStoryCard = (overrides: Partial<UserStoryCard> = {}): UserStoryCard => ({
  id: 'us-1',
  type: 'user-story',
  title: 'Test Story',
  position: { x: 0, y: 0 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  role: 'PM',
  action: 'edit',
  benefit: 'fast',
  priority: 'high',
  ...overrides,
});

const createBoundedContextCard = (overrides: Partial<BoundedContextCard> = {}): BoundedContextCard => ({
  id: 'bc-1',
  type: 'bounded-context',
  title: 'Test Context',
  position: { x: 0, y: 0 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  name: 'Test Context',
  description: 'A test bounded context',
  responsibility: 'Handle test operations',
  ...overrides,
});

const createFlowStepCard = (overrides: Partial<FlowStepCard> = {}): FlowStepCard => ({
  id: 'fs-1',
  type: 'flow-step',
  title: 'Test Step',
  position: { x: 0, y: 0 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  stepName: 'Test Step',
  ...overrides,
});

// ==================== Store Initial State Tests ====================

describe('DDSCanvasStore — initial state', () => {
  beforeEach(() => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
      },
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      isFullscreen: false,
      isDrawerOpen: false,
    });
  });

  it('should have correct initial projectId', () => {
    expect(useDDSCanvasStore.getState().projectId).toBeNull();
  });

  it('should have requirement as default active chapter', () => {
    expect(useDDSCanvasStore.getState().activeChapter).toBe('requirement');
  });

  it('should have all three chapters initialized', () => {
    const chapters = useDDSCanvasStore.getState().chapters;
    expect(Object.keys(chapters)).toHaveLength(3);
    expect(chapters.requirement.type).toBe('requirement');
    expect(chapters.context.type).toBe('context');
    expect(chapters.flow.type).toBe('flow');
  });

  it('should have empty cards and edges for all chapters', () => {
    const { chapters } = useDDSCanvasStore.getState();
    expect(chapters.requirement.cards).toEqual([]);
    expect(chapters.context.cards).toEqual([]);
    expect(chapters.flow.cards).toEqual([]);
    expect(chapters.requirement.edges).toEqual([]);
    expect(chapters.context.edges).toEqual([]);
    expect(chapters.flow.edges).toEqual([]);
  });

  it('should have isGenerating as false initially', () => {
    expect(useDDSCanvasStore.getState().isGenerating).toBe(false);
  });

  it('should have empty selectedCardIds initially', () => {
    expect(useDDSCanvasStore.getState().selectedCardIds).toEqual([]);
  });

  it('should have isFullscreen as false initially', () => {
    expect(useDDSCanvasStore.getState().isFullscreen).toBe(false);
  });
});

// ==================== Chapter Actions Tests ====================

describe('DDSCanvasStore — chapter actions', () => {
  beforeEach(() => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
      },
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      isFullscreen: false,
      isDrawerOpen: false,
    });
  });

  // setActiveChapter

  it('should set active chapter', () => {
    useDDSCanvasStore.getState().setActiveChapter('context');
    expect(useDDSCanvasStore.getState().activeChapter).toBe('context');
  });

  it('should allow switching to flow chapter', () => {
    useDDSCanvasStore.getState().setActiveChapter('flow');
    expect(useDDSCanvasStore.getState().activeChapter).toBe('flow');
  });

  // addCard

  it('should add a card to the requirement chapter', () => {
    const card = createUserStoryCard();
    ddsChapterActions.addCard('requirement', card);
    expect(useDDSCanvasStore.getState().chapters.requirement.cards).toContainEqual(card);
  });

  it('should add different card types to their respective chapters', () => {
    const usCard = createUserStoryCard({ id: 'us-2' });
    const bcCard = createBoundedContextCard({ id: 'bc-2' });
    const fsCard = createFlowStepCard({ id: 'fs-2' });

    ddsChapterActions.addCard('requirement', usCard);
    ddsChapterActions.addCard('context', bcCard);
    ddsChapterActions.addCard('flow', fsCard);

    expect(useDDSCanvasStore.getState().chapters.requirement.cards).toHaveLength(1);
    expect(useDDSCanvasStore.getState().chapters.context.cards).toHaveLength(1);
    expect(useDDSCanvasStore.getState().chapters.flow.cards).toHaveLength(1);
  });

  it('should add multiple cards to the same chapter', () => {
    ddsChapterActions.addCard('requirement', createUserStoryCard({ id: 'us-a' }));
    ddsChapterActions.addCard('requirement', createUserStoryCard({ id: 'us-b' }));
    expect(useDDSCanvasStore.getState().chapters.requirement.cards).toHaveLength(2);
  });

  // updateCard

  it('should update a card in the chapter', () => {
    const card = createUserStoryCard({ id: 'us-update', title: 'Original' });
    ddsChapterActions.addCard('requirement', card);
    ddsChapterActions.updateCard('requirement', 'us-update', { title: 'Updated' });

    const updated = useDDSCanvasStore.getState().chapters.requirement.cards.find(
      (c) => c.id === 'us-update'
    );
    expect(updated?.title).toBe('Updated');
  });

  it('should update card.updatedAt on modification', () => {
    const card = createUserStoryCard({ id: 'us-time', title: 'Original' });
    ddsChapterActions.addCard('requirement', card);
    ddsChapterActions.updateCard('requirement', 'us-time', { title: 'Updated' });

    const updated = useDDSCanvasStore.getState().chapters.requirement.cards.find(
      (c) => c.id === 'us-time'
    );
    expect(updated?.updatedAt).not.toBe('2026-01-01T00:00:00Z');
  });

  it('should not throw when updating non-existent card', () => {
    expect(() =>
      ddsChapterActions.updateCard('requirement', 'non-existent', { title: 'Test' })
    ).not.toThrow();
  });

  // deleteCard

  it('should delete a card from the chapter', () => {
    const card = createUserStoryCard({ id: 'us-delete' });
    ddsChapterActions.addCard('requirement', card);
    ddsChapterActions.deleteCard('requirement', 'us-delete');

    const found = useDDSCanvasStore.getState().chapters.requirement.cards.find(
      (c) => c.id === 'us-delete'
    );
    expect(found).toBeUndefined();
  });

  it('should also delete associated edges when card is deleted', () => {
    const card1 = createUserStoryCard({ id: 'us-edge-1' });
    const card2 = createUserStoryCard({ id: 'us-edge-2' });
    ddsChapterActions.addCard('requirement', card1);
    ddsChapterActions.addCard('requirement', card2);

    const edge: DDSEdge = {
      id: 'edge-1',
      source: 'us-edge-1',
      target: 'us-edge-2',
      type: 'smoothstep',
    };
    ddsChapterActions.addEdge('requirement', edge);

    ddsChapterActions.deleteCard('requirement', 'us-edge-1');

    const remainingEdges = useDDSCanvasStore.getState().chapters.requirement.edges;
    expect(remainingEdges.find((e) => e.id === 'edge-1')).toBeUndefined();
  });

  // addEdge

  it('should add an edge to the chapter', () => {
    const edge: DDSEdge = {
      id: 'edge-test',
      source: 'us-1',
      target: 'us-2',
      type: 'smoothstep',
    };
    ddsChapterActions.addEdge('requirement', edge);
    expect(useDDSCanvasStore.getState().chapters.requirement.edges).toContainEqual(edge);
  });

  it('should add multiple edges to the same chapter', () => {
    ddsChapterActions.addEdge('context', { id: 'e1', source: 'a', target: 'b', type: 'smoothstep' });
    ddsChapterActions.addEdge('context', { id: 'e2', source: 'b', target: 'c', type: 'smoothstep' });
    expect(useDDSCanvasStore.getState().chapters.context.edges).toHaveLength(2);
  });

  // deleteEdge

  it('should delete an edge from the chapter', () => {
    ddsChapterActions.addEdge('flow', { id: 'edge-del', source: 's', target: 't', type: 'smoothstep' });
    ddsChapterActions.deleteEdge('flow', 'edge-del');

    const found = useDDSCanvasStore.getState().chapters.flow.edges.find(
      (e) => e.id === 'edge-del'
    );
    expect(found).toBeUndefined();
  });

  it('should not throw when deleting non-existent edge', () => {
    expect(() => ddsChapterActions.deleteEdge('requirement', 'non-existent')).not.toThrow();
  });
});

// ==================== UI State Tests ====================

describe('DDSCanvasStore — UI state', () => {
  beforeEach(() => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
      },
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      isFullscreen: false,
      isDrawerOpen: false,
    });
  });

  it('should toggle fullscreen state', () => {
    const { toggleFullscreen } = useDDSCanvasStore.getState();
    expect(useDDSCanvasStore.getState().isFullscreen).toBe(false);
    toggleFullscreen();
    expect(useDDSCanvasStore.getState().isFullscreen).toBe(true);
    toggleFullscreen();
    expect(useDDSCanvasStore.getState().isFullscreen).toBe(false);
  });

  it('should toggle drawer state', () => {
    const { toggleDrawer } = useDDSCanvasStore.getState();
    expect(useDDSCanvasStore.getState().isDrawerOpen).toBe(false);
    toggleDrawer();
    expect(useDDSCanvasStore.getState().isDrawerOpen).toBe(true);
    toggleDrawer();
    expect(useDDSCanvasStore.getState().isDrawerOpen).toBe(false);
  });

  it('should set isGenerating', () => {
    useDDSCanvasStore.getState().setIsGenerating(true);
    expect(useDDSCanvasStore.getState().isGenerating).toBe(true);
    useDDSCanvasStore.getState().setIsGenerating(false);
    expect(useDDSCanvasStore.getState().isGenerating).toBe(false);
  });
});

// ==================== Selection Tests ====================

describe('DDSCanvasStore — card selection', () => {
  beforeEach(() => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
      },
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      isFullscreen: false,
      isDrawerOpen: false,
    });
  });

  it('should select a card', () => {
    useDDSCanvasStore.getState().selectCard('card-1');
    expect(useDDSCanvasStore.getState().selectedCardIds).toContain('card-1');
  });

  it('should not duplicate selection', () => {
    useDDSCanvasStore.getState().selectCard('card-1');
    useDDSCanvasStore.getState().selectCard('card-1');
    expect(useDDSCanvasStore.getState().selectedCardIds).toEqual(['card-1']);
  });

  it('should select multiple cards', () => {
    useDDSCanvasStore.getState().selectCard('card-1');
    useDDSCanvasStore.getState().selectCard('card-2');
    expect(useDDSCanvasStore.getState().selectedCardIds).toEqual(['card-1', 'card-2']);
  });

  it('should deselect all cards', () => {
    useDDSCanvasStore.getState().selectCard('card-1');
    useDDSCanvasStore.getState().selectCard('card-2');
    useDDSCanvasStore.getState().deselectAll();
    expect(useDDSCanvasStore.getState().selectedCardIds).toEqual([]);
  });
});

// ==================== Chat History Tests ====================

describe('DDSCanvasStore — chat history', () => {
  beforeEach(() => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
      },
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      isFullscreen: false,
      isDrawerOpen: false,
    });
  });

  it('should add a message to chat history', () => {
    const msg = {
      id: 'msg-1',
      role: 'user' as const,
      content: 'Generate user login flow',
      timestamp: new Date().toISOString(),
    };
    useDDSCanvasStore.getState().addMessage(msg);
    expect(useDDSCanvasStore.getState().chatHistory).toHaveLength(1);
    expect(useDDSCanvasStore.getState().chatHistory[0]).toEqual(msg);
  });

  it('should accumulate multiple messages', () => {
    const msg1 = { id: 'm1', role: 'user' as const, content: 'hello', timestamp: 't1' };
    const msg2 = { id: 'm2', role: 'assistant' as const, content: 'hi', timestamp: 't2' };
    useDDSCanvasStore.getState().addMessage(msg1);
    useDDSCanvasStore.getState().addMessage(msg2);
    expect(useDDSCanvasStore.getState().chatHistory).toHaveLength(2);
  });
});
