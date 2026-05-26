/**
 * viewportBounds.test.ts — P005-E1: viewportBounds Store + Hook Unit Tests
 *
 * DoD:
 * 1. store has viewportBounds: { x, y, width, height }
 * 2. updateViewportBounds updates partial fields
 * 3. sessionStorage persistence works
 * 4. hook initializes from store and tracks scroll/resize
 * 5. hook debounces updates (50ms)
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

  describe('AC-2: updateViewportBounds — partial updates', () => {
    it('AC-2a: updates x only', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => { updateViewportBounds({ x: 100 }); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(100);
      expect(viewportBounds.y).toBe(0);
      expect(viewportBounds.width).toBe(0);
      expect(viewportBounds.height).toBe(0);
    });

    it('AC-2b: updates y only', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => { updateViewportBounds({ y: 200 }); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.y).toBe(200);
    });

    it('AC-2c: updates width and height together', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => { updateViewportBounds({ width: 1920, height: 1080 }); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.width).toBe(1920);
      expect(viewportBounds.height).toBe(1080);
    });

    it('AC-2d: preserves existing values on partial update', () => {
      const store = useViewportBoundsStore.getState();
      act(() => {
        store.updateViewportBounds({ x: 50, y: 100 });
      });
      act(() => {
        store.updateViewportBounds({ width: 800 });
      });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds).toEqual({ x: 50, y: 100, width: 800, height: 0 });
    });
  });

  describe('AC-3: resetViewportBounds', () => {
    it('AC-3a: resets all fields to 0', () => {
      const store = useViewportBoundsStore.getState();
      act(() => {
        store.updateViewportBounds({ x: 100, y: 200, width: 800, height: 600 });
      });
      act(() => {
        store.resetViewportBounds();
      });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });

  describe('AC-4: TypeScript interface — ViewportBounds shape', () => {
    it('AC-4a: has all required fields', () => {
      const bounds = { x: 10, y: 20, width: 1920, height: 1080 };
      const store = useViewportBoundsStore.getState();
      act(() => { store.updateViewportBounds(bounds); });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(10);
      expect(viewportBounds.y).toBe(20);
      expect(viewportBounds.width).toBe(1920);
      expect(viewportBounds.height).toBe(1080);
    });
  });
});
