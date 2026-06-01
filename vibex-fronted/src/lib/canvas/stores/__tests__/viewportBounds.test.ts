/**
 * viewportBounds.test.ts — P005-E1: viewportBounds Store + Hook Unit Tests
 * S49-E3: Added debounce tests (AC-5: debounce coalescing, AC-6: flush)
 *
 * DoD:
 * 1. store has viewportBounds: { x, y, width, height }
 * 2. updateViewportBounds updates partial fields
 * 3. sessionStorage persistence works
 * 4. hook initializes from store and tracks scroll/resize
 * 5. hook debounces updates (50ms) (S49-E3)
 * 6. flushViewportBounds immediately applies pending bounds (S49-E3)
 * 7. nodeExtent + setNodeExtent work (S49-E3)
 */

import { useViewportBoundsStore } from '../viewportBoundsStore';
import { act } from '@testing-library/react';

describe('viewportBoundsStore — P005-E1', () => {
  beforeEach(() => {
    // Reset store state
    useViewportBoundsStore.setState({
      viewportBounds: { x: 0, y: 0, width: 0, height: 0 },
    });
    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  describe('AC-1: Initial state', () => {
    it('AC-1a: viewportBounds defaults to { x: 0, y: 0, width: 0, height: 0 }', () => {
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('AC-2: updateViewportBounds — partial updates', () => {
    it('AC-2a: updates x only', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => { updateViewportBounds({ x: 100 }); });
      act(() => { vi.advanceTimersByTime(51); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(100);
      expect(viewportBounds.y).toBe(0);
      expect(viewportBounds.width).toBe(0);
      expect(viewportBounds.height).toBe(0);
    });

    it('AC-2b: updates y only', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => { updateViewportBounds({ y: 200 }); });
      act(() => { vi.advanceTimersByTime(51); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.y).toBe(200);
    });

    it('AC-2c: updates width and height together', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => { updateViewportBounds({ width: 1920, height: 1080 }); });
      act(() => { vi.advanceTimersByTime(51); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.width).toBe(1920);
      expect(viewportBounds.height).toBe(1080);
    });

    it('AC-2d: preserves existing values on partial update', () => {
      const store = useViewportBoundsStore.getState();
      // Ensure clean state: reset first
      act(() => { store.resetViewportBounds(); });
      act(() => {
        store.updateViewportBounds({ x: 50, y: 100 });
      });
      act(() => {
        store.updateViewportBounds({ width: 800 });
      });
      act(() => { vi.advanceTimersByTime(51); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(50);
      expect(viewportBounds.y).toBe(100);
      expect(viewportBounds.width).toBe(800);
      expect(viewportBounds.height).toBe(0);
    });
  });

  describe('AC-3: resetViewportBounds', () => {
    it('AC-3a: resets all fields to 0', () => {
      const store = useViewportBoundsStore.getState();
      act(() => {
        store.updateViewportBounds({ x: 100, y: 200, width: 800, height: 600, zoom: 2 });
      });
      act(() => {
        store.resetViewportBounds();
      });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds).toEqual({ x: 0, y: 0, width: 0, height: 0, zoom: 1 });
    });
  });

  describe('AC-4: TypeScript interface — ViewportBounds shape', () => {
    it('AC-4a: has all required fields', () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const bounds = { x: 10, y: 20, width: 1920, height: 1080, zoom: 1 };
      const store = useViewportBoundsStore.getState();
      act(() => { store.updateViewportBounds(bounds); });
      act(() => { vi.advanceTimersByTime(51); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(10);
      expect(viewportBounds.y).toBe(20);
      expect(viewportBounds.width).toBe(1920);
      expect(viewportBounds.height).toBe(1080);
      vi.useRealTimers();
    });
  });

  // S49-E3: Debounce tests
  describe('AC-5: Debounce coalescing — S49-E3', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const store = useViewportBoundsStore.getState();
      act(() => { store.resetViewportBounds(); });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('AC-5a: rapid successive calls do not fire store update immediately', () => {
      const store = useViewportBoundsStore.getState();
      act(() => {
        store.updateViewportBounds({ x: 100 });
        store.updateViewportBounds({ y: 200 });
        store.updateViewportBounds({ width: 1920 });
      });
      // State should NOT have updated yet — debounce hasn't fired
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(0);
      expect(viewportBounds.y).toBe(0);
      expect(viewportBounds.width).toBe(0);
    });

    it('AC-5b: last call wins after debounce fires', () => {
      const store = useViewportBoundsStore.getState();
      act(() => {
        store.updateViewportBounds({ x: 100 });
        store.updateViewportBounds({ x: 200 });
        store.updateViewportBounds({ x: 300 });
      });
      // Advance timers past the 50ms debounce
      act(() => { vi.advanceTimersByTime(51); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(300);
    });

    it('AC-5c: later calls reset the debounce timer', () => {
      const store = useViewportBoundsStore.getState();
      act(() => {
        store.updateViewportBounds({ x: 100 });
        store.updateViewportBounds({ x: 200 });
      });
      // Advance only 30ms — debounce resets
      act(() => { vi.advanceTimersByTime(30); });
      // Still within 50ms window (reset at 30ms, new deadline at 30+50=80ms)
      let { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(0);
      // Advance remaining 51ms — debounce fires with x=200
      act(() => { vi.advanceTimersByTime(51); });
      ({ viewportBounds } = useViewportBoundsStore.getState());
      expect(viewportBounds.x).toBe(200);
    });
  });

  describe('AC-6: flushViewportBounds — S49-E3', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const store = useViewportBoundsStore.getState();
      act(() => { store.resetViewportBounds(); });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('AC-6a: flush immediately applies pending bounds', () => {
      const store = useViewportBoundsStore.getState();
      act(() => {
        store.updateViewportBounds({ x: 500, y: 600 });
      });
      // Should not have applied yet
      let { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(0);
      // Flush now
      act(() => { store.flushViewportBounds(); });
      ({ viewportBounds } = useViewportBoundsStore.getState());
      expect(viewportBounds.x).toBe(500);
      expect(viewportBounds.y).toBe(600);
    });

    it('AC-6b: flush when no pending bounds is a no-op', () => {
      const store = useViewportBoundsStore.getState();
      act(() => { store.resetViewportBounds(); });
      act(() => { store.flushViewportBounds(); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds).toEqual({ x: 0, y: 0, width: 0, height: 0, zoom: 1 });
    });
  });

  describe('AC-7: nodeExtent + setNodeExtent — S49-E3', () => {
    it('AC-7a: default nodeExtent is ±50,000', () => {
      const { nodeExtent } = useViewportBoundsStore.getState();
      expect(nodeExtent).toEqual([[-50_000, -50_000], [50_000, 50_000]]);
    });

    it('AC-7b: setNodeExtent updates nodeExtent', () => {
      const store = useViewportBoundsStore.getState();
      act(() => {
        store.setNodeExtent([[-1000, -1000], [1000, 1000]]);
      });
      const { nodeExtent } = useViewportBoundsStore.getState();
      expect(nodeExtent).toEqual([[-1000, -1000], [1000, 1000]]);
    });

    it('AC-7c: setNodeExtent accepts undefined', () => {
      const store = useViewportBoundsStore.getState();
      act(() => { store.setNodeExtent(undefined); });
      const { nodeExtent } = useViewportBoundsStore.getState();
      expect(nodeExtent).toBeUndefined();
    });
  });
});
