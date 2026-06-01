/**
 * autoLayoutStore.test.ts — S50-E2: Auto-layout Zustand store
 *
 * Tests the auto-layout state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAutoLayoutStore } from '../autoLayoutStore';

describe('useAutoLayoutStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useAutoLayoutStore.getState().reset();
    });
  });

  it('has correct initial state', () => {
    const state = useAutoLayoutStore.getState();
    expect(state.isLayouting).toBe(false);
    expect(state.fitViewRequested).toBe(0);
    expect(state.lastLayoutDirection).toBe('TB');
  });

  describe('startLayout', () => {
    it('sets isLayouting to true with TB direction', () => {
      act(() => {
        useAutoLayoutStore.getState().startLayout('TB');
      });
      const state = useAutoLayoutStore.getState();
      expect(state.isLayouting).toBe(true);
      expect(state.lastLayoutDirection).toBe('TB');
    });

    it('sets isLayouting to true with LR direction', () => {
      act(() => {
        useAutoLayoutStore.getState().startLayout('LR');
      });
      const state = useAutoLayoutStore.getState();
      expect(state.isLayouting).toBe(true);
      expect(state.lastLayoutDirection).toBe('LR');
    });

    it('overwrites previous direction', () => {
      act(() => {
        useAutoLayoutStore.getState().startLayout('TB');
        useAutoLayoutStore.getState().startLayout('LR');
      });
      const state = useAutoLayoutStore.getState();
      expect(state.isLayouting).toBe(true);
      expect(state.lastLayoutDirection).toBe('LR');
    });
  });

  describe('endLayout', () => {
    it('sets isLayouting to false', () => {
      act(() => {
        useAutoLayoutStore.getState().startLayout('TB');
        useAutoLayoutStore.getState().endLayout();
      });
      const state = useAutoLayoutStore.getState();
      expect(state.isLayouting).toBe(false);
    });

    it('increments fitViewRequested', () => {
      let fitViewCount = 0;
      useAutoLayoutStore.subscribe((state) => {
        fitViewCount = state.fitViewRequested;
      });

      act(() => {
        useAutoLayoutStore.getState().endLayout();
      });
      expect(useAutoLayoutStore.getState().fitViewRequested).toBe(1);
    });

    it('multiple endLayout calls increment fitViewRequested each time', () => {
      act(() => {
        useAutoLayoutStore.getState().endLayout();
        useAutoLayoutStore.getState().endLayout();
      });
      expect(useAutoLayoutStore.getState().fitViewRequested).toBe(2);
    });
  });

  describe('requestFitView', () => {
    it('increments fitViewRequested without changing isLayouting', () => {
      act(() => {
        useAutoLayoutStore.getState().startLayout('TB');
        useAutoLayoutStore.getState().requestFitView();
      });
      const state = useAutoLayoutStore.getState();
      expect(state.isLayouting).toBe(true); // unchanged
      expect(state.fitViewRequested).toBe(1);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      act(() => {
        useAutoLayoutStore.getState().startLayout('LR');
        useAutoLayoutStore.getState().requestFitView();
        useAutoLayoutStore.getState().requestFitView();
        useAutoLayoutStore.getState().reset();
      });
      const state = useAutoLayoutStore.getState();
      expect(state.isLayouting).toBe(false);
      expect(state.fitViewRequested).toBe(0);
      expect(state.lastLayoutDirection).toBe('TB');
    });
  });
});
