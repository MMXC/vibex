/**
 * useEmbeddedAgent.test.ts — Sprint57 E2 vitest
 * Canvas-Inline AI Session Panel Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useEmbeddedAgent } from '../useEmbeddedAgent';

// ==================== Mock Data ====================

const mockSessions = [
  {
    sessionKey: 's1',
    task: 'Build user auth',
    status: 'complete' as const,
    createdAt: 1000,
    messages: [
      { id: 'm1', role: 'user' as const, content: 'Build auth', timestamp: 1001 },
      {
        id: 'm2',
        role: 'agent' as const,
        content: 'Auth module created with JWT support',
        timestamp: 1002,
        codeBlocks: [],
      },
    ],
    name: 'Auth Session',
  },
  {
    sessionKey: 's2',
    task: 'Build API',
    status: 'running' as const,
    createdAt: 2000,
    messages: [
      { id: 'm3', role: 'user' as const, content: 'Build REST API', timestamp: 2001 },
    ],
    name: 'API Session',
  },
];

// ==================== Hoisted mocks ====================

const { mockAddCard, mockSetActiveSession, mockGetState, mockSelector } = vi.hoisted(() => {
  const mockSetActive = vi.fn((key: string) => { /* noop in test */ });
  const mockSelector = vi.fn(
    (sel: (s: { sessions: typeof mockSessions; activeSessionKey: string | null }) => unknown) =>
      sel({ sessions: mockSessions, activeSessionKey: 's1' })
  );
  const mockGetState = vi.fn(() => ({
    sessions: mockSessions,
    activeSessionKey: 's1',
    setActiveSession: mockSetActive,
  }));
  return {
    mockSetActiveSession: mockSetActive,
    mockAddCard: vi.fn(),
    mockGetState,
    mockSelector,
  };
});

// ==================== Mocks ====================

vi.mock('@/stores/agentStore', () => ({
  useAgentStore: Object.assign(mockSelector, { getState: mockGetState }),
}));

vi.mock('@/stores/dds/DDSCanvasStore', () => ({
  useDDSCanvasStore: vi.fn(
    (_sel: (s: { activeChapter: string }) => unknown) => 'requirement'
  ),
  ddsChapterActions: {
    addCard: mockAddCard,
  },
}));

// ==================== Tests ====================

describe('useEmbeddedAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('E2.1: starts with isOpen false', () => {
    const { result } = renderHook(() => useEmbeddedAgent());
    expect(result.current.isOpen).toBe(false);
  });

  it('E2.1: openPanel sets isOpen to true', () => {
    const { result } = renderHook(() => useEmbeddedAgent());
    act(() => {
      result.current.openPanel();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('E2.1: closePanel sets isOpen to false', () => {
    const { result } = renderHook(() => useEmbeddedAgent());
    act(() => {
      result.current.openPanel();
      result.current.closePanel();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('E2.1: togglePanel flips isOpen state', () => {
    const { result } = renderHook(() => useEmbeddedAgent());
    expect(result.current.isOpen).toBe(false);
    act(() => {
      result.current.togglePanel();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.togglePanel();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('E2.3: activeSessionId returns the current session key', () => {
    const { result } = renderHook(() => useEmbeddedAgent());
    expect(result.current.activeSessionId).toBeTruthy();
  });

  it('E2.3: selectSession calls store setActiveSession', () => {
    const { result } = renderHook(() => useEmbeddedAgent());
    act(() => {
      result.current.selectSession('s2');
    });
    expect(mockSetActiveSession).toHaveBeenCalledWith('s2');
  });

  it('E2.5: insertToCanvas calls addCard with correct type', () => {
    const { result } = renderHook(() => useEmbeddedAgent());
    act(() => {
      result.current.insertToCanvas();
    });
    expect(mockAddCard).toHaveBeenCalledTimes(1);
    const cardArg = mockAddCard.mock.calls[0][1];
    expect(cardArg).toMatchObject({ type: 'agent-response' });
    expect(cardArg.title).toContain('AI');
    expect(typeof cardArg.description).toBe('string');
    expect(cardArg.description.length).toBeGreaterThan(0);
  });

  it('E2.5: insertToCanvas does nothing when no agent messages', () => {
    // Reset mockGetState to return s2 (no agent messages)
    mockGetState.mockReturnValue({
      sessions: mockSessions,
      activeSessionKey: 's2',
      setActiveSession: mockSetActiveSession,
    });
    const { result } = renderHook(() => useEmbeddedAgent());
    act(() => {
      result.current.insertToCanvas();
    });
    expect(mockAddCard).not.toHaveBeenCalled();
  });
});
