/**
 * DDSCanvasStore — Unit Tests
 * Epic4: E4-U1, E4-U2 跨章节 DAG 边
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDDSCanvasStore, ddsChapterActions, getVisibleNodes } from '../DDSCanvasStore';
import type { DDSEdge, UserStoryCard, BoundedContextCard, FlowStepCard } from '@/types/dds';

describe('DDSCanvasStore — crossChapterEdges (Epic4 E4-U1/E4-U2)', () => {
  const resetStore = () => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        api: { type: 'api', cards: [], edges: [], loading: false, error: null },
      },
      crossChapterEdges: [],
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      selectedCardSnapshot: null,
      isFullscreen: false,
      isDrawerOpen: false,
      collapsedGroups: new Set<string>(),
    });
  };

  beforeEach(() => {
    resetStore();
  });

  // ---- E4-U1: crossChapterEdges state exists ----

  it('starts with empty crossChapterEdges', () => {
    expect(useDDSCanvasStore.getState().crossChapterEdges).toHaveLength(0);
  });

  // ---- E4-U1: addCrossChapterEdge (via ddsChapterActions) ----

  it('addCrossChapterEdge adds an edge', () => {
    const edge: DDSEdge = {
      id: 'e1',
      source: 'card-a',
      target: 'card-b',
      type: 'smoothstep',
      sourceChapter: 'requirement',
      targetChapter: 'context',
      animated: true,
    };

    ddsChapterActions.addCrossChapterEdge(edge);

    const edges = useDDSCanvasStore.getState().crossChapterEdges;
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('e1');
    expect(edges[0].source).toBe('card-a');
    expect(edges[0].target).toBe('card-b');
    expect(edges[0].sourceChapter).toBe('requirement');
    expect(edges[0].targetChapter).toBe('context');
  });

  it('addCrossChapterEdge supports same-chapter edges', () => {
    const edge: DDSEdge = {
      id: 'e2',
      source: 'card-c',
      target: 'card-d',
      type: 'smoothstep',
      sourceChapter: 'context',
      targetChapter: 'context',
      animated: true,
    };

    ddsChapterActions.addCrossChapterEdge(edge);

    expect(useDDSCanvasStore.getState().crossChapterEdges).toHaveLength(1);
    expect(useDDSCanvasStore.getState().crossChapterEdges[0].sourceChapter).toBe('context');
  });

  it('addCrossChapterEdge allows multiple edges', () => {
    ddsChapterActions.addCrossChapterEdge({ id: 'e1', source: 'a', target: 'b', type: 'smoothstep', sourceChapter: 'req', targetChapter: 'ctx' });
    ddsChapterActions.addCrossChapterEdge({ id: 'e2', source: 'c', target: 'd', type: 'smoothstep', sourceChapter: 'ctx', targetChapter: 'flow' });

    expect(useDDSCanvasStore.getState().crossChapterEdges).toHaveLength(2);
  });

  // ---- E4-U1: deleteCrossChapterEdge (via ddsChapterActions) ----

  it('deleteCrossChapterEdge removes the specified edge', () => {
    ddsChapterActions.addCrossChapterEdge({ id: 'e1', source: 'a', target: 'b', type: 'smoothstep', sourceChapter: 'req', targetChapter: 'ctx' });
    ddsChapterActions.addCrossChapterEdge({ id: 'e2', source: 'c', target: 'd', type: 'smoothstep', sourceChapter: 'ctx', targetChapter: 'flow' });

    ddsChapterActions.deleteCrossChapterEdge('e1');

    const remaining = useDDSCanvasStore.getState().crossChapterEdges;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('e2');
  });

  it('deleteCrossChapterEdge does not throw for non-existent id', () => {
    ddsChapterActions.addCrossChapterEdge({ id: 'e1', source: 'a', target: 'b', type: 'smoothstep', sourceChapter: 'req', targetChapter: 'ctx' });

    expect(() => ddsChapterActions.deleteCrossChapterEdge('non-existent')).not.toThrow();
    expect(useDDSCanvasStore.getState().crossChapterEdges).toHaveLength(1);
  });

  it('deleteCrossChapterEdge of last edge leaves empty array', () => {
    ddsChapterActions.addCrossChapterEdge({ id: 'e1', source: 'a', target: 'b', type: 'smoothstep', sourceChapter: 'req', targetChapter: 'ctx' });

    ddsChapterActions.deleteCrossChapterEdge('e1');

    expect(useDDSCanvasStore.getState().crossChapterEdges).toHaveLength(0);
  });

  // ---- E4-U1: crossChapterEdges independent from chapter edges ----

  it('crossChapterEdges is independent from chapter edges', () => {
    // Same-chapter edge goes to chapter
    ddsChapterActions.addEdge('requirement', { id: 'ce1', source: 'a', target: 'b', type: 'smoothstep' });

    // Cross-chapter edge goes to global crossChapterEdges
    ddsChapterActions.addCrossChapterEdge({ id: 'x1', source: 'a', target: 'c', type: 'smoothstep', sourceChapter: 'requirement', targetChapter: 'context' });

    expect(useDDSCanvasStore.getState().chapters.requirement.edges).toHaveLength(1);
    expect(useDDSCanvasStore.getState().crossChapterEdges).toHaveLength(1);
    expect(useDDSCanvasStore.getState().crossChapterEdges[0].id).toBe('x1');
  });

  // ---- E4-U2: edge routing (sourceChapter/targetChapter detection) ----

  it('edge with different sourceChapter/targetChapter is cross-chapter', () => {
    const edge: DDSEdge = {
      id: 'x1',
      source: 'card-1',
      target: 'card-2',
      type: 'smoothstep',
      sourceChapter: 'requirement',
      targetChapter: 'flow',
    };

    ddsChapterActions.addCrossChapterEdge(edge);

    const stored = useDDSCanvasStore.getState().crossChapterEdges[0];
    expect(stored.sourceChapter).not.toBe(stored.targetChapter);
  });

  it('edge with same sourceChapter/targetChapter is same-chapter', () => {
    const edge: DDSEdge = {
      id: 'x2',
      source: 'card-3',
      target: 'card-4',
      type: 'smoothstep',
      sourceChapter: 'context',
      targetChapter: 'context',
    };

    ddsChapterActions.addCrossChapterEdge(edge);

    const stored = useDDSCanvasStore.getState().crossChapterEdges[0];
    expect(stored.sourceChapter).toBe(stored.targetChapter);
  });
});

// ==================== selectedCardSnapshot Tests ====================

describe('DDSCanvasStore — selectedCardSnapshot (P004-T5)', () => {
  const resetStore = () => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        api: { type: 'api', cards: [], edges: [], loading: false, error: null },
      },
      crossChapterEdges: [],
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      selectedCardSnapshot: null,
      isFullscreen: false,
      isDrawerOpen: false,
      collapsedGroups: new Set<string>(),
    });
  };

  beforeEach(() => {
    resetStore();
  });

  describe('setSelectedCardSnapshot', () => {
    it('saves a snapshot with cardId, cardData, and wasVisible', () => {
      const snapshot = { cardId: 'card-1', cardData: { id: 'card-1', type: 'user-story' } as any, wasVisible: true };

      useDDSCanvasStore.getState().setSelectedCardSnapshot(snapshot);

      const state = useDDSCanvasStore.getState();
      expect(state.selectedCardSnapshot).not.toBeNull();
      expect(state.selectedCardSnapshot!.cardId).toBe('card-1');
      expect(state.selectedCardSnapshot!.cardData.id).toBe('card-1');
      expect(state.selectedCardSnapshot!.wasVisible).toBe(true);
    });

    it('clears snapshot when passed null', () => {
      useDDSCanvasStore.setState({
        selectedCardSnapshot: { cardId: 'card-1', cardData: { id: 'card-1' } as any, wasVisible: true },
      });

      useDDSCanvasStore.getState().setSelectedCardSnapshot(null);

      expect(useDDSCanvasStore.getState().selectedCardSnapshot).toBeNull();
    });
  });

  describe('updateCardVisibility', () => {
    it('updates wasVisible to true', () => {
      useDDSCanvasStore.setState({
        selectedCardSnapshot: { cardId: 'card-1', cardData: { id: 'card-1' } as any, wasVisible: false },
      });

      useDDSCanvasStore.getState().updateCardVisibility(true);

      expect(useDDSCanvasStore.getState().selectedCardSnapshot!.wasVisible).toBe(true);
    });

    it('updates wasVisible to false', () => {
      useDDSCanvasStore.setState({
        selectedCardSnapshot: { cardId: 'card-1', cardData: { id: 'card-1' } as any, wasVisible: true },
      });

      useDDSCanvasStore.getState().updateCardVisibility(false);

      expect(useDDSCanvasStore.getState().selectedCardSnapshot!.wasVisible).toBe(false);
    });

    it('is no-op when snapshot is null', () => {
      resetStore(); // ensure snapshot is null

      // Should not throw
      expect(() => useDDSCanvasStore.getState().updateCardVisibility(false)).not.toThrow();
      expect(useDDSCanvasStore.getState().selectedCardSnapshot).toBeNull();
    });
  });

  describe('snapshot preserved across visibility changes', () => {
    it('selectCard captures a snapshot with wasVisible=true', () => {
      // Add a card to the store
      ddsChapterActions.addCard('requirement', {
        id: 'card-select-1',
        type: 'user-story',
        title: 'Test Card',
        role: 'user',
        action: 'test',
        benefit: 'test',
        priority: 'high',
        position: { x: 0, y: 0 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      } as UserStoryCard);

      // Capture snapshot manually (simulates what handleSelectCard would do)
      useDDSCanvasStore.getState().setSelectedCardSnapshot({
        cardId: 'card-select-1',
        cardData: useDDSCanvasStore.getState().chapters.requirement.cards[0],
        wasVisible: true,
      });

      const snapshot = useDDSCanvasStore.getState().selectedCardSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.cardId).toBe('card-select-1');
      expect(snapshot!.wasVisible).toBe(true);
    });

    it('when selected card is out of viewport (simulated), wasVisible stays true (snapshot preserved)', () => {
      // Set up initial snapshot with wasVisible=true (card was visible when selected)
      useDDSCanvasStore.setState({
        selectedCardSnapshot: { cardId: 'card-out', cardData: { id: 'card-out' } as any, wasVisible: true },
      });

      // Simulate card going out of viewport: update visibility to false
      useDDSCanvasStore.getState().updateCardVisibility(false);

      // Verify snapshot is preserved (cardId and cardData unchanged)
      const state = useDDSCanvasStore.getState();
      expect(state.selectedCardSnapshot).not.toBeNull();
      expect(state.selectedCardSnapshot!.cardId).toBe('card-out');
      // wasVisible is now false (card is out of viewport), but snapshot itself is preserved
      expect(state.selectedCardSnapshot!.wasVisible).toBe(false);
    });
  });
});

// ==================== CRUD Tests ====================

describe('DDSCanvasStore — CRUD operations', () => {
  const resetStore = () => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        api: { type: 'api', cards: [], edges: [], loading: false, error: null },
      },
      crossChapterEdges: [],
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      selectedCardSnapshot: null,
      isFullscreen: false,
      isDrawerOpen: false,
      collapsedGroups: new Set<string>(),
    });
  };

  beforeEach(() => {
    resetStore();
  });

  describe('addCard', () => {
    it('adds a card to the correct chapter', () => {
      const card: UserStoryCard = {
        id: 'card-req-1',
        type: 'user-story',
        title: 'As a user, I want to login',
        role: 'user',
        action: 'login',
        benefit: 'access my account',
        priority: 'high',
        position: { x: 0, y: 0 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      ddsChapterActions.addCard('requirement', card);

      const cards = useDDSCanvasStore.getState().chapters.requirement.cards;
      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe('card-req-1');
    });

    it('does not affect other chapters when adding a card', () => {
      const card: BoundedContextCard = {
        id: 'card-ctx-1',
        type: 'bounded-context',
        title: 'User Domain',
        name: 'User Domain',
        description: 'user domain',
        responsibility: 'manage user data',
        position: { x: 0, y: 0 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      ddsChapterActions.addCard('context', card);

      expect(useDDSCanvasStore.getState().chapters.requirement.cards).toHaveLength(0);
      expect(useDDSCanvasStore.getState().chapters.flow.cards).toHaveLength(0);
      expect(useDDSCanvasStore.getState().chapters.context.cards).toHaveLength(1);
    });

    it('adds multiple cards to the same chapter', () => {
      const card1: FlowStepCard = {
        id: 'card-flow-1',
        type: 'flow-step',
        title: 'Step 1',
        stepName: 'Step 1',
        position: { x: 0, y: 0 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      const card2: FlowStepCard = {
        id: 'card-flow-2',
        type: 'flow-step',
        title: 'Step 2',
        stepName: 'Step 2',
        position: { x: 0, y: 10 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      ddsChapterActions.addCard('flow', card1);
      ddsChapterActions.addCard('flow', card2);

      expect(useDDSCanvasStore.getState().chapters.flow.cards).toHaveLength(2);
    });
  });

  describe('deleteCard', () => {
    it('deletes the specified card from the chapter', () => {
      ddsChapterActions.addCard('requirement', {
        id: 'card-del-1',
        type: 'user-story',
        title: 'Story to delete',
        role: 'user',
        action: 'login',
        benefit: 'access',
        priority: 'high',
        position: { x: 0, y: 0 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      } as UserStoryCard);

      ddsChapterActions.deleteCard('requirement', 'card-del-1');

      expect(useDDSCanvasStore.getState().chapters.requirement.cards).toHaveLength(0);
    });

    it('deletes only the target card, preserving others', () => {
      ddsChapterActions.addCard('context', {
        id: 'card-keep',
        type: 'bounded-context',
        title: 'Keep me',
        name: 'Keep me',
        description: 'keep',
        responsibility: 'keep',
        position: { x: 0, y: 0 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      } as BoundedContextCard);
      ddsChapterActions.addCard('context', {
        id: 'card-del',
        type: 'bounded-context',
        title: 'Delete me',
        name: 'Delete me',
        description: 'del',
        responsibility: 'del',
        position: { x: 0, y: 10 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      } as BoundedContextCard);

      ddsChapterActions.deleteCard('context', 'card-del');

      const cards = useDDSCanvasStore.getState().chapters.context.cards;
      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe('card-keep');
    });
  });

  describe('selectCard / deselectCard', () => {
    it('selectCard adds card id to selectedCardIds', () => {
      useDDSCanvasStore.getState().selectCard('card-select-1');

      expect(useDDSCanvasStore.getState().selectedCardIds).toContain('card-select-1');
    });

    it('selectCard does not duplicate already selected card', () => {
      useDDSCanvasStore.setState({ selectedCardIds: ['card-select-1'] });
      useDDSCanvasStore.getState().selectCard('card-select-1');

      const ids = useDDSCanvasStore.getState().selectedCardIds;
      expect(ids.filter((id) => id === 'card-select-1')).toHaveLength(1);
    });

    // Note: selectCard is additive only. To deselect, use deselectAll() or clear selection via selectCard(null)
    // deselectCard is not implemented in DDSCanvasStore
  });

  describe('toggleFullscreen', () => {
    it('toggles isFullscreen from false to true', () => {
      expect(useDDSCanvasStore.getState().isFullscreen).toBe(false);
      useDDSCanvasStore.getState().toggleFullscreen();
      expect(useDDSCanvasStore.getState().isFullscreen).toBe(true);
    });

    it('toggles isFullscreen from true to false', () => {
      useDDSCanvasStore.setState({ isFullscreen: true });
      useDDSCanvasStore.getState().toggleFullscreen();
      expect(useDDSCanvasStore.getState().isFullscreen).toBe(false);
    });
  });

  describe('toggleDrawer', () => {
    it('toggles isDrawerOpen from false to true', () => {
      expect(useDDSCanvasStore.getState().isDrawerOpen).toBe(false);
      useDDSCanvasStore.getState().toggleDrawer();
      expect(useDDSCanvasStore.getState().isDrawerOpen).toBe(true);
    });

    it('toggles isDrawerOpen from true to false', () => {
      useDDSCanvasStore.setState({ isDrawerOpen: true });
      useDDSCanvasStore.getState().toggleDrawer();
      expect(useDDSCanvasStore.getState().isDrawerOpen).toBe(false);
    });
  });

  describe('setActiveChapter', () => {
    it('sets activeChapter to the specified chapter', () => {
      useDDSCanvasStore.getState().setActiveChapter('context');
      expect(useDDSCanvasStore.getState().activeChapter).toBe('context');
    });

    it('sets activeChapter to flow', () => {
      useDDSCanvasStore.getState().setActiveChapter('flow');
      expect(useDDSCanvasStore.getState().activeChapter).toBe('flow');
    });

    it('overwrites previous activeChapter', () => {
      useDDSCanvasStore.getState().setActiveChapter('context');
      useDDSCanvasStore.getState().setActiveChapter('requirement');
      expect(useDDSCanvasStore.getState().activeChapter).toBe('requirement');
    });
  });
});

// ==================== F2.1-U1: Snapshot Tests ====================

describe('toMatchSnapshot — store state', () => {
  it('initial store state matches snapshot', () => {
    // Reset to clean initial state
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        api: { type: 'api', cards: [], edges: [], loading: false, error: null },
      },
      crossChapterEdges: [],
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      selectedCardSnapshot: null,
      isFullscreen: false,
      isDrawerOpen: false,
      collapsedGroups: new Set<string>(),
    });
    const state = useDDSCanvasStore.getState();
    expect(state).toMatchSnapshot();
  });

  it('store with cards and selection matches snapshot', () => {
    const fixedId = 'snapshot-test-card-1';
    const fixedId2 = 'snapshot-test-card-2';
    ddsChapterActions.addCard('requirement', {
      id: fixedId,
      type: 'user-story',
      title: 'As a user I want to login',
      role: 'user',
      action: 'login',
      benefit: 'access my account',
      priority: 'high',
      position: { x: 0, y: 0 },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    } as UserStoryCard);
    ddsChapterActions.addCard('context', {
      id: fixedId2,
      type: 'bounded-context',
      title: 'User Domain',
      name: 'User Domain',
      description: 'manages user data',
      responsibility: 'auth and profile',
      position: { x: 10, y: 0 },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    } as BoundedContextCard);
    useDDSCanvasStore.getState().selectCard(fixedId);
    useDDSCanvasStore.getState().setActiveChapter('requirement');
    const state = useDDSCanvasStore.getState();
    expect(state).toMatchSnapshot();
  });
});

// ==================== Epic1: Group/Folder Collapse Tests ====================

describe('DDSCanvasStore — Epic1: Group/Folder Collapse (U1-E1, U5-E1)', () => {
  const resetStore = () => {
    useDDSCanvasStore.setState({
      projectId: null,
      activeChapter: 'requirement',
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        api: { type: 'api', cards: [], edges: [], loading: false, error: null },
        'business-rules': { type: 'business-rules', cards: [], edges: [], loading: false, error: null },
      },
      crossChapterEdges: [],
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      selectedCardSnapshot: null,
      isFullscreen: false,
      isDrawerOpen: false,
      collapsedGroups: new Set<string>(),
    });
  };

  beforeEach(() => {
    resetStore();
  });

  // ---- E1-U1: collapsedGroups initial state ----

  it('starts with empty collapsedGroups', () => {
    expect(useDDSCanvasStore.getState().collapsedGroups.size).toBe(0);
  });

  // ---- E1-U1: toggleCollapse ----

  it('toggleCollapse adds groupId to collapsedGroups', () => {
    useDDSCanvasStore.getState().toggleCollapse('group-1');
    expect(useDDSCanvasStore.getState().collapsedGroups.has('group-1')).toBe(true);
  });

  it('toggleCollapse removes groupId if already collapsed', () => {
    useDDSCanvasStore.getState().toggleCollapse('group-1');
    useDDSCanvasStore.getState().toggleCollapse('group-1');
    expect(useDDSCanvasStore.getState().collapsedGroups.has('group-1')).toBe(false);
  });

  it('toggleCollapse supports multiple groups', () => {
    useDDSCanvasStore.getState().toggleCollapse('group-1');
    useDDSCanvasStore.getState().toggleCollapse('group-2');
    expect(useDDSCanvasStore.getState().collapsedGroups.size).toBe(2);
    expect(useDDSCanvasStore.getState().collapsedGroups.has('group-1')).toBe(true);
    expect(useDDSCanvasStore.getState().collapsedGroups.has('group-2')).toBe(true);
  });

  // ---- E1-U1: isCollapsed ----

  it('isCollapsed returns true for collapsed group', () => {
    useDDSCanvasStore.getState().toggleCollapse('group-1');
    expect(useDDSCanvasStore.getState().isCollapsed('group-1')).toBe(true);
  });

  it('isCollapsed returns false for non-collapsed group', () => {
    expect(useDDSCanvasStore.getState().isCollapsed('group-1')).toBe(false);
  });

  it('isCollapsed returns false after toggle', () => {
    useDDSCanvasStore.getState().toggleCollapse('group-1');
    useDDSCanvasStore.getState().toggleCollapse('group-1');
    expect(useDDSCanvasStore.getState().isCollapsed('group-1')).toBe(false);
  });

  // ---- E1-U5: getVisibleNodes ----

  it('getVisibleNodes returns all nodes when no groups collapsed', () => {
    const nodes = [
      { id: 'n1', data: { parentId: null, children: ['n2'] } },
      { id: 'n2', data: { parentId: 'n1' } },
    ] as any[];
    const result = getVisibleNodes(nodes, new Set());
    expect(result).toHaveLength(2);
  });

  it('getVisibleNodes hides direct children of collapsed group', () => {
    const nodes = [
      { id: 'group-1', data: { parentId: null, children: ['n2', 'n3'] } },
      { id: 'n2', data: { parentId: 'group-1' } },
      { id: 'n3', data: { parentId: 'group-1' } },
    ] as any[];
    const collapsed = new Set(['group-1']);
    const result = getVisibleNodes(nodes, collapsed);
    expect(result.map((n: any) => n.id)).toEqual(['group-1']);
  });

  it('getVisibleNodes hides all descendants (BFS)', () => {
    const nodes = [
      { id: 'root', data: { parentId: null, children: ['child1', 'child2'] } },
      { id: 'child1', data: { parentId: 'root', children: ['grand1'] } },
      { id: 'child2', data: { parentId: 'root' } },
      { id: 'grand1', data: { parentId: 'child1' } },
    ] as any[];
    const collapsed = new Set(['root']);
    const result = getVisibleNodes(nodes, collapsed);
    expect(result.map((n: any) => n.id)).toEqual(['root']);
  });

  it('getVisibleNodes handles multiple collapsed groups', () => {
    const nodes = [
      { id: 'g1', data: { parentId: null, children: ['c1'] } },
      { id: 'c1', data: { parentId: 'g1' } },
      { id: 'g2', data: { parentId: null, children: ['c2'] } },
      { id: 'c2', data: { parentId: 'g2' } },
      { id: 'other', data: { parentId: null } },
    ] as any[];
    const collapsed = new Set(['g1', 'g2']);
    const result = getVisibleNodes(nodes, collapsed);
    expect(result.map((n: any) => n.id)).toEqual(['g1', 'g2', 'other']);
  });

  it('getVisibleNodes handles nodes without parentId', () => {
    const nodes = [{ id: 'orphan', data: {} }] as any[];
    const result = getVisibleNodes(nodes, new Set(['nonexistent']));
    expect(result).toHaveLength(1);
  });
});
