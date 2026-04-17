/**
 * DDSCanvasStore — Unit Tests
 * Epic4: E4-U1, E4-U2 跨章节 DAG 边
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDDSCanvasStore, ddsChapterActions } from '../DDSCanvasStore';
import type { DDSEdge } from '@/types/dds';

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
