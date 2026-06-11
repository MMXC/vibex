/**
 * canvasViewportStore tests — S86-E2 Canvas Minimap Navigation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasViewportStore, getViewportCenter } from '../canvasViewportStore';

const createTestStore = () => useCanvasViewportStore.getState();

describe('canvasViewportStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useCanvasViewportStore.setState({
      viewport: { x: 0, y: 0, zoom: 1 },
      initialized: false,
    });
  });

  describe('initial state', () => {
    it('should have default viewport values', () => {
      const state = createTestStore();
      expect(state.viewport.x).toBe(0);
      expect(state.viewport.y).toBe(0);
      expect(state.viewport.zoom).toBe(1);
    });

    it('should not be initialized by default', () => {
      const state = createTestStore();
      expect(state.initialized).toBe(false);
    });
  });

  describe('setViewport', () => {
    it('should update viewport x coordinate', () => {
      const { setViewport } = createTestStore();
      setViewport({ x: 100 });
      const state = createTestStore();
      expect(state.viewport.x).toBe(100);
      expect(state.viewport.y).toBe(0);
      expect(state.viewport.zoom).toBe(1);
    });

    it('should update viewport y coordinate', () => {
      const { setViewport } = createTestStore();
      setViewport({ y: 200 });
      const state = createTestStore();
      expect(state.viewport.y).toBe(200);
    });

    it('should update viewport zoom', () => {
      const { setViewport } = createTestStore();
      setViewport({ zoom: 2 });
      const state = createTestStore();
      expect(state.viewport.zoom).toBe(2);
    });

    it('should update multiple properties at once', () => {
      const { setViewport } = createTestStore();
      setViewport({ x: 100, y: 200, zoom: 1.5 });
      const state = createTestStore();
      expect(state.viewport).toEqual({ x: 100, y: 200, zoom: 1.5 });
    });

    it('should set initialized to true after first update', () => {
      const { setViewport } = createTestStore();
      expect(createTestStore().initialized).toBe(false);
      setViewport({ x: 50 });
      expect(createTestStore().initialized).toBe(true);
    });
  });

  describe('zoomTo', () => {
    it('should set zoom to target level', () => {
      const { zoomTo } = createTestStore();
      zoomTo(2);
      expect(createTestStore().viewport.zoom).toBe(2);
    });

    it('should preserve x and y when zooming', () => {
      const { setViewport, zoomTo } = createTestStore();
      setViewport({ x: 100, y: 200 });
      zoomTo(0.5);
      const state = createTestStore();
      expect(state.viewport.x).toBe(100);
      expect(state.viewport.y).toBe(200);
      expect(state.viewport.zoom).toBe(0.5);
    });

    it('should handle zoom level of 1 (reset)', () => {
      const { zoomTo } = createTestStore();
      zoomTo(1);
      expect(createTestStore().viewport.zoom).toBe(1);
    });
  });

  describe('panTo', () => {
    it('should set x and y coordinates', () => {
      const { panTo } = createTestStore();
      panTo(150, 250);
      const state = createTestStore();
      expect(state.viewport.x).toBe(150);
      expect(state.viewport.y).toBe(250);
    });

    it('should preserve zoom when panning', () => {
      const { setViewport, panTo } = createTestStore();
      setViewport({ zoom: 2 });
      panTo(100, 200);
      const state = createTestStore();
      expect(state.viewport.zoom).toBe(2);
      expect(state.viewport.x).toBe(100);
      expect(state.viewport.y).toBe(200);
    });
  });

  describe('resetViewport', () => {
    it('should reset viewport to default values', () => {
      const { setViewport, resetViewport } = createTestStore();
      setViewport({ x: 999, y: 888, zoom: 5 });
      resetViewport();
      const state = createTestStore();
      expect(state.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it('should set initialized to true after reset', () => {
      const { resetViewport } = createTestStore();
      expect(createTestStore().initialized).toBe(false);
      resetViewport();
      expect(createTestStore().initialized).toBe(true);
    });
  });

  describe('getViewportCenter', () => {
    it('should compute correct center point', () => {
      const center = getViewportCenter({ x: 0, y: 0, zoom: 1 }, 800, 600);
      expect(center.cx).toBe(400);
      expect(center.cy).toBe(300);
    });

    it('should account for zoom when computing center', () => {
      // At zoom=2, viewport is zoomed in 2x, so flow coordinates are scaled
      // x=0 with zoom=2 means flow position 0 maps to screen center
      const center = getViewportCenter({ x: 0, y: 0, zoom: 2 }, 800, 600);
      expect(center.cx).toBe(200); // 800/2/2 = 200
      expect(center.cy).toBe(150); // 600/2/2 = 150
    });

    it('should offset center by viewport x/y', () => {
      const center = getViewportCenter({ x: 100, y: 200, zoom: 1 }, 800, 600);
      expect(center.cx).toBe(500); // 100 + 800/2/1 = 500
      expect(center.cy).toBe(500); // 200 + 600/2/1 = 500
    });
  });
});
