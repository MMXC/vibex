/**
 * DDSCanvasStore — Unit Tests
 * Epic4: E4-U1, E4-U2 跨章节 DAG 边
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDDSCanvasStore, ddsChapterActions } from '../DDSCanvasStore';
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
      },
      crossChapterEdges: [],
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      isFullscreen: false,
      isDrawerOpen: false,
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
      },
      crossChapterEdges: [],
      chatHistory: [],
      isGenerating: false,
      selectedCardIds: [],
      isFullscreen: false,
      isDrawerOpen: false,
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

    it('deselectCard removes card id from selectedCardIds', () => {
      useDDSCanvasStore.setState({ selectedCardIds: ['card-a', 'card-b'] });
      useDDSCanvasStore.getState().deselectCard('card-a');

      expect(useDDSCanvasStore.getState().selectedCardIds).not.toContain('card-a');
      expect(useDDSCanvasStore.getState().selectedCardIds).toContain('card-b');
    });

    it('deselectCard handles non-existent card gracefully', () => {
      useDDSCanvasStore.setState({ selectedCardIds: ['card-a'] });
      expect(() => useDDSCanvasStore.getState().deselectCard('non-existent')).not.toThrow();
    });
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
