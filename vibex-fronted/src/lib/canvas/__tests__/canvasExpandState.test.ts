/**
 * canvasExpandState.test.ts — Unit tests for CanvasExpandState slice
 *
 * Epic E2: vibex-canvas-expandable-20260327
 * Tests: setLeftExpand, setCenterExpand, setRightExpand, togglePanel,
 *        getGridTemplate, resetExpand
 */

import { useCanvasStore } from '@/lib/canvas/canvasStore';

describe('CanvasExpandState', () => {
  beforeEach(() => {
    // Reset store to default state
    useCanvasStore.getState().resetExpand();
  });

  afterEach(() => {
    // Reset after each test
    useCanvasStore.getState().resetExpand();
  });

  describe('getGridTemplate — default state', () => {
    it('returns 1fr 1fr 1fr when all panels are default', () => {
      const template = useCanvasStore.getState().getGridTemplate();
      expect(template).toBe('1fr 1fr 1fr');
    });
  });

  describe('setLeftExpand', () => {
    it('sets left panel to expand-right (1.5fr left, 1fr center+right)', () => {
      useCanvasStore.getState().setLeftExpand('expand-right');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1.5fr 1fr 1fr');
    });

    it('sets left panel to expand-left (0fr left, 1.5fr center)', () => {
      useCanvasStore.getState().setLeftExpand('expand-left');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('0fr 1.5fr 1fr');
    });

    it('restores to default (1fr 1fr 1fr)', () => {
      useCanvasStore.getState().setLeftExpand('expand-right');
      useCanvasStore.getState().setLeftExpand('default');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });
  });

  describe('setCenterExpand', () => {
    it('sets center to expand-left (1.5fr center)', () => {
      useCanvasStore.getState().setCenterExpand('expand-left');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1.5fr 1fr');
    });

    it('sets center to expand-right (1.5fr center)', () => {
      useCanvasStore.getState().setCenterExpand('expand-right');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1.5fr 1fr');
    });

    it('restores to default (1fr 1fr 1fr)', () => {
      useCanvasStore.getState().setCenterExpand('expand-left');
      useCanvasStore.getState().setCenterExpand('default');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });
  });

  describe('setRightExpand', () => {
    it('sets right panel to expand-left (1.5fr right, 0.75fr left+center)', () => {
      useCanvasStore.getState().setRightExpand('expand-left');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('0.75fr 0.75fr 1.5fr');
    });

    it('restores to default (1fr 1fr 1fr)', () => {
      useCanvasStore.getState().setRightExpand('expand-left');
      useCanvasStore.getState().setRightExpand('default');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });
  });

  describe('togglePanel', () => {
    it('toggles left panel from default to expand-right', () => {
      useCanvasStore.getState().togglePanel('left');
      expect(useCanvasStore.getState().leftExpand).toBe('expand-right');
    });

    it('toggles left panel from expand-right back to default', () => {
      useCanvasStore.getState().togglePanel('left');
      useCanvasStore.getState().togglePanel('left');
      expect(useCanvasStore.getState().leftExpand).toBe('default');
    });

    it('toggles center panel from default to expand-left', () => {
      useCanvasStore.getState().togglePanel('center');
      expect(useCanvasStore.getState().centerExpand).toBe('expand-left');
    });

    it('toggles right panel from default to expand-left', () => {
      useCanvasStore.getState().togglePanel('right');
      expect(useCanvasStore.getState().rightExpand).toBe('expand-left');
    });

    it('toggle does not change leftExpand when leftExpand is expand-left', () => {
      // expand-left is not toggled by togglePanel — it's a blocked state
      useCanvasStore.getState().setLeftExpand('expand-left');
      useCanvasStore.getState().togglePanel('left');
      expect(useCanvasStore.getState().leftExpand).toBe('expand-left');
    });
  });

  describe('resetExpand', () => {
    it('resets all three panels to default', () => {
      useCanvasStore.getState().setLeftExpand('expand-right');
      useCanvasStore.getState().setCenterExpand('expand-left');
      useCanvasStore.getState().setRightExpand('expand-left');
      useCanvasStore.getState().resetExpand();
      const state = useCanvasStore.getState();
      expect(state.leftExpand).toBe('default');
      expect(state.centerExpand).toBe('default');
      expect(state.rightExpand).toBe('default');
      expect(state.getGridTemplate()).toBe('1fr 1fr 1fr');
    });
  });

  describe('combined expand states', () => {
    it('left expand-right + center expand-left', () => {
      useCanvasStore.getState().setLeftExpand('expand-right');
      useCanvasStore.getState().setCenterExpand('expand-left');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1.5fr 1.5fr 0fr');
    });

    it('center expand-left + right expand-left', () => {
      useCanvasStore.getState().setCenterExpand('expand-left');
      useCanvasStore.getState().setRightExpand('expand-left');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1.5fr 1.5fr');
    });
  });
});
