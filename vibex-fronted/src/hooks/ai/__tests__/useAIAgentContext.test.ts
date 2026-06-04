/**
 * useAIAgentContext.test.ts — Sprint61 E4: AI Session Canvas Context Integration
 *
 * Tests:
 * - canvasSummary formats correctly with nodes/edges
 * - canvasSummary handles empty canvas
 * - canvasContext object structure is correct
 * - attachToSession calls agentStore.setCanvasContext
 * - retryMode defaults to '3'
 * - setRetryMode updates defaultRetryMode
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAIAgentContext } from '../useAIAgentContext';
import * as DDSCanvasStoreModule from '@/stores/dds/DDSCanvasStore';
import * as agentStoreModule from '@/stores/dds/agentStore';

// ==================== Mock Stores ====================

const mockDDSCanvasState = {
  projectId: 'test-project',
  activeChapter: 'requirement' as const,
  chapters: {
    requirement: { type: 'requirement' as const, cards: [{ id: 'card-1' }], edges: [{ id: 'edge-1' }], loading: false, error: null },
    context: { type: 'context' as const, cards: [], edges: [], loading: false, error: null },
    flow: { type: 'flow' as const, cards: [{ id: 'card-2' }, { id: 'card-3' }], edges: [], loading: false, error: null },
    api: { type: 'api' as const, cards: [], edges: [], loading: false, error: null },
    'business-rules': { type: 'business-rules' as const, cards: [], edges: [], loading: false, error: null },
  },
};

const mockAgentActions = {
  setDefaultRetryMode: vi.fn(),
  setCanvasContext: vi.fn(),
};

const mockAgentState = {
  sessions: [],
  activeSessionId: null,
  defaultRetryMode: '3' as const,
  ...mockAgentActions,
};

// ==================== Mocks ====================

vi.mock('@/stores/dds/DDSCanvasStore', () => ({
  useDDSCanvasStore: vi.fn(),
}));

vi.mock('@/stores/dds/agentStore', () => ({
  useAgentStore: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(DDSCanvasStoreModule.useDDSCanvasStore).mockImplementation((selector) => {
    const state = mockDDSCanvasState;
    return selector(state as typeof state);
  });
  vi.mocked(agentStoreModule.useAgentStore).mockImplementation((selector) => {
    return selector(mockAgentState as typeof mockAgentState & typeof mockAgentActions);
  });
});

// ==================== Tests ====================

describe('useAIAgentContext', () => {
  it('should include node count in canvasSummary', () => {
    const { result } = renderHook(() => useAIAgentContext());
    // 3 cards total (2 in flow, 1 in requirement)
    expect(result.current.canvasSummary).toContain('3 node');
    // 1 edge total (in requirement)
    expect(result.current.canvasSummary).toContain('1 edge');
  });

  it('should include edge count in canvasSummary', () => {
    const { result } = renderHook(() => useAIAgentContext());
    expect(result.current.canvasSummary).toMatch(/\d+ edge/);
  });

  it('should format summary with chapter labels for non-empty chapters', () => {
    const { result } = renderHook(() => useAIAgentContext());
    // requirement has 1 node + 1 edge, flow has 2 nodes
    expect(result.current.canvasSummary).toMatch(/需求|flow|requirement/);
  });

  it('should return empty canvas message when no cards or edges', () => {
    vi.mocked(DDSCanvasStoreModule.useDDSCanvasStore).mockImplementation((selector) => {
      const emptyState = {
        projectId: null,
        activeChapter: 'requirement' as const,
        chapters: {
          requirement: { type: 'requirement' as const, cards: [], edges: [], loading: false, error: null },
          context: { type: 'context' as const, cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow' as const, cards: [], edges: [], loading: false, error: null },
          api: { type: 'api' as const, cards: [], edges: [], loading: false, error: null },
          'business-rules': { type: 'business-rules' as const, cards: [], edges: [], loading: false, error: null },
        },
      };
      return selector(emptyState as typeof emptyState);
    });

    const { result } = renderHook(() => useAIAgentContext());
    expect(result.current.canvasSummary).toBe('画布为空');
  });

  it('should include projectId in canvasContext', () => {
    const { result } = renderHook(() => useAIAgentContext());
    expect(result.current.canvasContext.projectId).toBe('test-project');
  });

  it('should include chapterCounts in canvasContext', () => {
    const { result } = renderHook(() => useAIAgentContext());
    expect(result.current.canvasContext.chapterCounts.requirement.nodes).toBe(1);
    expect(result.current.canvasContext.chapterCounts.requirement.edges).toBe(1);
    expect(result.current.canvasContext.chapterCounts.flow.nodes).toBe(2);
    expect(result.current.canvasContext.chapterCounts.flow.edges).toBe(0);
  });

  it('should include totalNodes and totalEdges in canvasContext', () => {
    const { result } = renderHook(() => useAIAgentContext());
    expect(result.current.canvasContext.totalNodes).toBe(3);
    expect(result.current.canvasContext.totalEdges).toBe(1);
  });

  it('should call setCanvasContext when attachToSession is called', () => {
    const { result } = renderHook(() => useAIAgentContext());
    const sessionId = 'test-session-123';
    result.current.attachToSession(sessionId);
    expect(mockAgentActions.setCanvasContext).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({
        summary: expect.any(String),
        chapterCounts: expect.any(Object),
        totalNodes: expect.any(Number),
        totalEdges: expect.any(Number),
        projectId: expect.any(String),
      })
    );
  });

  it('should return retryMode from agent store', () => {
    const { result } = renderHook(() => useAIAgentContext());
    expect(result.current.retryMode).toBe('3');
  });

  it('should call setDefaultRetryMode when setRetryMode is called', () => {
    const { result } = renderHook(() => useAIAgentContext());
    result.current.setRetryMode('5');
    expect(mockAgentActions.setDefaultRetryMode).toHaveBeenCalledWith('5');
  });
});
