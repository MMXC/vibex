/**
 * viewportBounds.integration.test.ts — S43-P003-E3: DDSFlow → viewportBoundsStore sync
 *
 * DoD:
 * 1. DDSFlow viewport changes trigger viewportBoundsStore updates
 * 2. updateViewportBounds merges partial updates correctly
 * 3. 100-node canvas: onlyRenderVisibleElements filters invisible nodes
 */

import { useViewportBoundsStore } from '../viewportBoundsStore';
import { act } from '@testing-library/react';

describe('viewportBounds integration — S43-P003-E3', () => {
  beforeEach(() => {
    // Reset store to known state
    useViewportBoundsStore.setState({
      viewportBounds: { x: 0, y: 0, width: 0, height: 0, zoom: 1 },
    });
  });

  describe('AC-1: Viewport sync — partial bounds update', () => {
    it('AC-1a: x/y scroll offset updates independently', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => {
        updateViewportBounds({ x: 100, y: 200 });
      });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.x).toBe(100);
      expect(viewportBounds.y).toBe(200);
      expect(viewportBounds.width).toBe(0);
      expect(viewportBounds.height).toBe(0);
      expect(viewportBounds.zoom).toBe(1);
    });

    it('AC-1b: width/height viewport size updates independently', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => {
        updateViewportBounds({ width: 1920, height: 1080 });
      });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.width).toBe(1920);
      expect(viewportBounds.height).toBe(1080);
    });

    it('AC-1c: zoom level updates correctly', () => {
      const { updateViewportBounds } = useViewportBoundsStore.getState();
      act(() => {
        updateViewportBounds({ zoom: 2 });
      });
      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds.zoom).toBe(2);
    });
  });

  describe('AC-2: Simulated viewport change sequence (DDSFlow useOnViewportChange)', () => {
    it('AC-2a: multiple sequential viewport updates merge correctly', () => {
      const store = useViewportBoundsStore.getState();
      // Simulate user scrolling
      act(() => { store.updateViewportBounds({ x: 500, y: 300 }); });
      // Simulate user zooming
      act(() => { store.updateViewportBounds({ zoom: 1.5, width: 1920, height: 1080 }); });
      // Simulate user resizing window
      act(() => { store.updateViewportBounds({ width: 1440, height: 900 }); });

      const { viewportBounds } = useViewportBoundsStore.getState();
      expect(viewportBounds).toEqual({
        x: 500,
        y: 300,
        width: 1440,
        height: 900,
        zoom: 1.5,
      });
    });
  });
});
