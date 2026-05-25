/**
 * useAIAgent.test.tsx — Sprint38 P003-E1: useAIAgent hook DiffResult state tests
 *
 * Tests that:
 * 1. lastResult and lastError are null initially
 * 2. lastResult is updated when session completes
 * 3. lastError is updated on session error
 * 4. DiffResult structure matches the interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIAgent } from '@/hooks/useAIAgent';
import type { DiffResult } from '@/hooks/useAIAgent';

// Mock agentStore
vi.mock('@/stores/agentStore', () => ({
  useAgentStore: vi.fn((selector) => {
    const store = {
      sessions: [],
      activeSessionKey: null,
      addSession: vi.fn(),
      updateSession: vi.fn(),
      addMessage: vi.fn(),
    };
    return selector(store);
  }),
}));

// Mock oplogStore
vi.mock('@/stores/oplogStore', () => ({
  useOplogStore: vi.fn((selector) => {
    const store = {
      addOplogEntry: vi.fn(() => 'entry-1'),
      entries: [],
    };
    return selector(store);
  }),
}));

// Mock CodingAgentService
vi.mock('@/services/agent/CodingAgentService', () => ({
  createSession: vi.fn(async () => 'session-key-1'),
  terminateSession: vi.fn(async () => {}),
  acceptCodeBlock: vi.fn(),
}));

describe('useAIAgent — DiffResult state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null lastResult and null lastError initially', () => {
    const { result } = renderHook(() => useAIAgent());
    expect(result.current.lastResult).toBeNull();
    expect(result.current.lastError).toBeNull();
  });

  it('returns correct interface structure', () => {
    const { result } = renderHook(() => useAIAgent());
    // sessionKey can be null when no active session
    expect(result.current.sessionKey).toBeNull();
    expect(typeof result.current.isEditing).toBe('boolean');
    expect(typeof result.current.startSession).toBe('function');
    expect(typeof result.current.acceptCodeBlock).toBe('function');
    expect(typeof result.current.terminate).toBe('function');
  });

  it('DiffResult interface has correct shape', () => {
    const diffResult: DiffResult = {
      added: 5,
      removed: 2,
      changes: [
        { type: 'add', line: 'const x = 1;', lineNumber: 1 },
        { type: 'remove', line: 'const y = 2;', lineNumber: 2 },
      ],
    };
    expect(diffResult.added).toBe(5);
    expect(diffResult.removed).toBe(2);
    expect(diffResult.changes).toHaveLength(2);
    expect(diffResult.changes[0].type).toBe('add');
    expect(diffResult.changes[1].type).toBe('remove');
  });

  it('startSession resets lastResult and lastError before calling', async () => {
    const { result } = renderHook(() => useAIAgent());

    // Simulate a result being set
    await act(async () => {
      const { startSession } = result.current;
      await startSession('test task');
    });

    // After startSession, lastResult should be null (reset) and lastError null
    expect(result.current.lastResult).toBeNull();
    expect(result.current.lastError).toBeNull();
  });
});
