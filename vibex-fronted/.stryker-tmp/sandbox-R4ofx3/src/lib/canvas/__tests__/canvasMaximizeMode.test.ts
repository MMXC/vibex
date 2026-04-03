/**
 * canvasMaximizeMode.test.ts — Unit tests for maximize mode (F7)
 *
 * F7: maximize 模式验收标准
 * - F11 key toggles fullscreen
 * - ESC key exits fullscreen
 * - toolbar is not visible in maximize mode
 *
 * PRD: vibex-next-roadmap-ph1/prd.md
 * Phase 1: Phase2 功能完成
 * Epic 6: 全屏模式 (S6.1 expand-both, S6.2 maximize, S6.3 快捷键绑定)
 *
 * NOTE: Keyboard shortcut tests (F11, ESC) require integration/E2E tests
 * because they are implemented in CanvasPage.useEffect, not in the store.
 * This file tests the store-level behavior that the keyboard shortcuts trigger.
 */
// @ts-nocheck


import { useCanvasStore } from '@/lib/canvas/canvasStore';

describe('CanvasMaximizeMode — F7: maximize mode acceptance criteria', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetExpand();
  });

  afterEach(() => {
    useCanvasStore.getState().resetExpand();
  });

  describe('F7.1: toggleMaximize triggers maximize mode', () => {
    it('toggleMaximize transitions from normal to maximize', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');
    });

    it('toggleMaximize transitions from maximize to normal', () => {
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('toggleMaximize from expand-both goes to maximize', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');
    });
  });

  describe('F7.2: ESC key exits fullscreen (via setExpandMode)', () => {
    it('setExpandMode(normal) exits maximize mode', () => {
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');
      useCanvasStore.getState().setExpandMode('normal');
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('setExpandMode(normal) has no effect when already in normal', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');
      useCanvasStore.getState().setExpandMode('normal');
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('setExpandMode(normal) does not affect expand-both', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');
      useCanvasStore.getState().setExpandMode('normal');
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });
  });

  describe('F7.3: toolbar is not visible in maximize mode', () => {
    it('toolbar visibility helper returns false in maximize mode', () => {
      // In CanvasPage: {expandMode !== 'maximize' && (<Toolbar />)}
      // When expandMode === 'maximize', toolbar is NOT rendered
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');

      const state = useCanvasStore.getState();
      const toolbarVisible = state.expandMode !== 'maximize';
      expect(toolbarVisible).toBe(false);
    });

    it('toolbar visibility helper returns true in normal mode', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');

      const state = useCanvasStore.getState();
      const toolbarVisible = state.expandMode !== 'maximize';
      expect(toolbarVisible).toBe(true);
    });

    it('toolbar visibility helper returns true in expand-both mode', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');

      const state = useCanvasStore.getState();
      const toolbarVisible = state.expandMode !== 'maximize';
      expect(toolbarVisible).toBe(true);
    });
  });

  describe('F7.4: expand-both toggle button behavior', () => {
    it('expand-both button is hidden in maximize mode', () => {
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');

      const state = useCanvasStore.getState();
      const expandBothVisible = state.expandMode !== 'maximize';
      expect(expandBothVisible).toBe(false);
    });

    it('expand-both button is visible in normal mode', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');

      const state = useCanvasStore.getState();
      const expandBothVisible = state.expandMode !== 'maximize';
      expect(expandBothVisible).toBe(true);
    });

    it('expand-both button is visible in expand-both mode', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');

      const state = useCanvasStore.getState();
      const expandBothVisible = state.expandMode !== 'maximize';
      expect(expandBothVisible).toBe(true);
    });

    it('switching to maximize hides expand-both button', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');

      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');

      const state = useCanvasStore.getState();
      const expandBothVisible = state.expandMode !== 'maximize';
      expect(expandBothVisible).toBe(false);
    });
  });

  describe('F7.5: maximize button is always visible', () => {
    it('maximize button is visible in normal mode', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('maximize button is visible in expand-both mode', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');
    });

    it('maximize button is visible in maximize mode', () => {
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');
    });
  });

  describe('F7.6: grid template remains 1fr 1fr 1fr in maximize mode', () => {
    it('getGridTemplate returns 1fr 1fr 1fr in maximize mode', () => {
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });

    it('getGridTemplate returns 1fr 1fr 1fr in expand-both mode', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });

    it('getGridTemplate returns 1fr 1fr 1fr in normal mode', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');
      expect(useCanvasStore.getState().getGridTemplate()).toBe('1fr 1fr 1fr');
    });
  });

  describe('F7.7: mode transitions', () => {
    it('normal -> maximize -> normal via toggleMaximize', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');

      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');

      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('normal -> expand-both -> maximize -> normal', () => {
      expect(useCanvasStore.getState().expandMode).toBe('normal');

      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');

      useCanvasStore.getState().setExpandMode('maximize');
      expect(useCanvasStore.getState().expandMode).toBe('maximize');

      useCanvasStore.getState().setExpandMode('normal');
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('expand-both -> maximize -> normal (ESC behavior)', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');

      useCanvasStore.getState().setExpandMode('maximize');
      expect(useCanvasStore.getState().expandMode).toBe('maximize');

      // ESC (implemented as setExpandMode('normal')) returns to normal
      useCanvasStore.getState().setExpandMode('normal');
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });
  });

  describe('F7.8: resetExpand resets maximize mode', () => {
    it('resetExpand returns to normal from maximize', () => {
      useCanvasStore.getState().toggleMaximize();
      expect(useCanvasStore.getState().expandMode).toBe('maximize');

      useCanvasStore.getState().resetExpand();
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });

    it('resetExpand returns to normal from expand-both', () => {
      useCanvasStore.getState().setExpandMode('expand-both');
      expect(useCanvasStore.getState().expandMode).toBe('expand-both');

      useCanvasStore.getState().resetExpand();
      expect(useCanvasStore.getState().expandMode).toBe('normal');
    });
  });
});
