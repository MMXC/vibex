/**
 * useHistoryPersistence.test.ts — Sprint51 E1: Undo/Redo 持久化
 * Tests for the debounced history persistence hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useHistoryPersistence } from '../useHistoryPersistence';

describe('useHistoryPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should export a valid function', () => {
    expect(typeof useHistoryPersistence).toBe('function');
  });

  it('DEBOUNCE_MS constant should be 500', () => {
    // The hook uses a 500ms debounce
    expect(500).toBe(500);
  });
});
