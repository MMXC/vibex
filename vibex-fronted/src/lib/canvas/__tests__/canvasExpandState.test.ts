/**
 * canvasExpandState.test.ts — Unit tests for CanvasExpandState slice
 *
 * F1 (Phase2): Canvas expand modes
 * Tests: expandMode, setExpandMode, toggleMaximize, resetExpand
 *
 * New design (F1):
 *   expandMode: 'normal' | 'expand-both' | 'maximize'
 *   - normal: 1fr 1fr 1fr, all UI visible
 *   - expand-both: 1fr 1fr 1fr, all UI visible, toggle via button
 *   - maximize: 1fr 1fr 1fr, toolbar/projectbar hidden, F11/ESC
 *
 * Legacy state (leftExpand/centerExpand/rightExpand) kept for toggle buttons.
 */

import { useCanvasStore } from '@/lib/canvas/canvasStore';

describe('CanvasExpandState — F1 expandMode', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetExpand();
  });

  afterEach(() => {
    useCanvasStore.getState().resetExpand();
  });

  describe('expandMode defaults', () => {
    it('defaults to normal mode', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('getGridTemplate returns 1fr 1fr 1fr (F1.4: old 1.5fr removed)', () => {
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });
  });

  describe('setExpandMode', () => {
    it('sets expandMode to expand-both', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');
    });

    it('sets expandMode to maximize', () => {
      useCanvasStore.getState().setExpandMode('maximize');
      expect(useCanvasStore.getState().expandMode).toBe('maximize');
    });

    it('sets expandMode back to normal', () => {
      useCanvasStore.getState().setExpandMode('maximize');
      useCanvasStore.getState().setExpandMode('normal');
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });
  });

  describe('toggleMaximize', () => {
    it('toggles from normal to maximize', () => {
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');
    });

    it('toggles from maximize back to normal', () => {
      useCanvasStore.getState().toggleMaximize();
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('maximize + setExpandMode expand-both goes to expand-both', () => {
      useCanvasStore.getState().toggleMaximize();
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');
    });
  });

  describe('resetExpand resets all state', () => {
    it('resets expandMode to normal', () => {
      useCanvasStore.getState().setExpandMode('maximize');
      useCanvasStore.getState().resetExpand();
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('resets legacy leftExpand/centerExpand/rightExpand to default', () => {
      useCanvasStore.getState().setLeftExpand('expand-right');
      useCanvasStore.getState().setCenterExpand('expand-left');
      useCanvasStore.getState().setRightExpand('expand-left');
      useCanvasStore.getState().resetExpand();
      const state = useCanvasStore.getState();
      expect(state.leftExpand).toBe('default');
      expect(state.centerExpand).toBe('default');
      expect(state.rightExpand).toBe('default');
    });

    it('getGridTemplate still returns 1fr 1fr 1fr after resets', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      useCanvasStore.getState().resetExpand();
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });
  });
});

describe('CanvasExpandState — Legacy toggle buttons (kept for compatibility)', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetExpand();
  });

  afterEach(() => {
    useCanvasStore.getState().resetExpand();
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

    it('toggle does not change leftExpand when already expand-left', () => {
      // expand-left is a blocked state for left panel
      useCanvasStore.getState().setLeftExpand('expand-left');
      useCanvasStore.getState().togglePanel('left');
      expect(useCanvasStore.getState().leftExpand).toBe('expand-left');
    });
  });
});
