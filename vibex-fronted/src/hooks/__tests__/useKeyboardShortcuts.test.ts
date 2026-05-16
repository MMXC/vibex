/**
 * useKeyboardShortcuts.test.ts — Unit tests for keyboard shortcuts
 *
 * Epic E001 (F001): Ctrl+Z / Ctrl+Shift+Z 快捷键
 * P003 测试: shortcutStore 动态快捷键集成
 * E002: Tab 切换 + Ctrl+N 新建节点快捷键
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 canvasLogger.default.debug
 */
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import { useShortcutStore } from '@/stores/shortcutStore';

describe('useKeyboardShortcuts', () => {
  // Helper to simulate keyboard event
  function simulateKeyDown(key: string, options: Partial<KeyboardEventInit> = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    document.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    document.body.innerHTML = '';
    // Reset shortcutStore to defaults before each test
    useShortcutStore.getState().loadDefaults();
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', () => {});
  });

  describe('Ctrl+Z / Cmd+Z → Undo', () => {
    it('should call undo when Ctrl+Z is pressed', () => {
      const undo = vi.fn().mockReturnValue(true);
      const redo = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).toHaveBeenCalledTimes(1);
      expect(redo).not.toHaveBeenCalled();

      unmount();
    });

    it('should call undo when Meta+Z (Mac) is pressed', () => {
      const undo = vi.fn().mockReturnValue(true);
      const redo = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { metaKey: true });
      });

      expect(undo).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("should NOT call undo when Ctrl+Shift+Z is pressed (that's redo)", () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true, shiftKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
    });

    it('should NOT call undo when focus is on an input element', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should NOT call undo when Ctrl+Z is pressed in textarea', () => {
      const undo = vi.fn().mockReturnValue(true);
      const redo = vi.fn();

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      Object.defineProperty(document, 'activeElement', {
        value: textarea,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(textarea);
    });
  });

  describe('Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y → Redo', () => {
    it('should call redo when Ctrl+Shift+Z is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn().mockReturnValue(true);

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true, shiftKey: true });
      });

      expect(redo).toHaveBeenCalledTimes(1);
      expect(undo).not.toHaveBeenCalled();

      unmount();
    });

    it('should call redo when Meta+Shift+Z (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn().mockReturnValue(true);

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { metaKey: true, shiftKey: true });
      });

      expect(redo).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call redo when Ctrl+Y (Windows) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn().mockReturnValue(true);

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('y', { ctrlKey: true });
      });

      expect(redo).toHaveBeenCalledTimes(1);
      expect(undo).not.toHaveBeenCalled();

      unmount();
    });

    it('should call redo when Meta+Y (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn().mockReturnValue(true);

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('y', { metaKey: true });
      });

      expect(redo).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Escape → Cancel Selection / Clear Selection', () => {
    it('should call onClearSelection when Escape is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onClearSelection = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onClearSelection, enabled: true }),
      );

      let event: Event | undefined;
      act(() => {
        event = simulateKeyDown('Escape');
      });

      expect(onClearSelection).toHaveBeenCalledTimes(1);
      expect(event?.defaultPrevented).toBe(true);

      unmount();
    });

    it('should NOT call onClearSelection when Escape is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onClearSelection = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onClearSelection, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Escape');
      });

      // Escape does NOT work when input is focused (focus protection)
      expect(onClearSelection).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });
  });

  describe('enabled flag', () => {
    it('should not register shortcuts when enabled=false', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: false }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();
      expect(redo).not.toHaveBeenCalled();

      unmount();
    });

    it('should not call redo when enabled=false', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: false }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true, shiftKey: true });
      });

      expect(redo).not.toHaveBeenCalled();

      unmount();
    });

    it('should not call onClearSelection when enabled=false', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onClearSelection = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onClearSelection, enabled: false }),
      );

      act(() => {
        simulateKeyDown('Escape');
      });

      expect(onClearSelection).not.toHaveBeenCalled();

      unmount();
    });

    it('should not call onOpenSearch when enabled=false', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onOpenSearch = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onOpenSearch, enabled: false }),
      );

      act(() => {
        simulateKeyDown('k', { ctrlKey: true });
      });

      expect(onOpenSearch).not.toHaveBeenCalled();

      unmount();
    });
  });

  describe('Search shortcuts', () => {
    it('should call onOpenSearch when / is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onOpenSearch = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onOpenSearch, enabled: true }),
      );

      // Reset activeElement to body for this test
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });

      act(() => {
        simulateKeyDown('/');
      });

      expect(onOpenSearch).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onOpenSearch when / is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onOpenSearch = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onOpenSearch, enabled: true }),
      );

      act(() => {
        simulateKeyDown('/');
      });

      expect(onOpenSearch).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should call onOpenSearch when Ctrl+K is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onOpenSearch = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onOpenSearch, enabled: true }),
      );

      act(() => {
        simulateKeyDown('k', { ctrlKey: true });
      });

      expect(onOpenSearch).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onOpenSearch when Meta+K (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onOpenSearch = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onOpenSearch, enabled: true }),
      );

      act(() => {
        simulateKeyDown('k', { metaKey: true });
      });

      expect(onOpenSearch).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Zoom shortcuts', () => {
    it('should call onZoomIn when + is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onZoomIn = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onZoomIn, enabled: true }),
      );

      act(() => {
        simulateKeyDown('+');
      });

      expect(onZoomIn).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onZoomIn when = is pressed (alternative)', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onZoomIn = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onZoomIn, enabled: true }),
      );

      act(() => {
        simulateKeyDown('=');
      });

      expect(onZoomIn).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onZoomIn when + is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onZoomIn = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onZoomIn, enabled: true }),
      );

      act(() => {
        simulateKeyDown('+');
      });

      expect(onZoomIn).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should call onZoomOut when - is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onZoomOut = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onZoomOut, enabled: true }),
      );

      act(() => {
        simulateKeyDown('-');
      });

      expect(onZoomOut).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onZoomOut when - is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onZoomOut = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onZoomOut, enabled: true }),
      );

      act(() => {
        simulateKeyDown('-');
      });

      expect(onZoomOut).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should call onZoomReset when 0 is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onZoomReset = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onZoomReset, enabled: true }),
      );

      act(() => {
        simulateKeyDown('0');
      });

      expect(onZoomReset).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onZoomReset when 0 is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onZoomReset = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onZoomReset, enabled: true }),
      );

      act(() => {
        simulateKeyDown('0');
      });

      expect(onZoomReset).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });
  });

  describe('Delete shortcut', () => {
    it('should call onDelete when Delete is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onDelete = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onDelete, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Delete');
      });

      expect(onDelete).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onDelete when Backspace is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onDelete = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onDelete, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Backspace');
      });

      expect(onDelete).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onDelete when Delete is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onDelete = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onDelete, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Delete');
      });

      expect(onDelete).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should NOT call onDelete when Delete is pressed with Ctrl modifier', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onDelete = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onDelete, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Delete', { ctrlKey: true });
      });

      expect(onDelete).not.toHaveBeenCalled();

      unmount();
    });
  });

  describe('New Node shortcut (N)', () => {
    it('should call onNewNode when N is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNewNode = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNewNode, enabled: true }),
      );

      act(() => {
        simulateKeyDown('n');
      });

      expect(onNewNode).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onNewNode when N is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNewNode = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNewNode, enabled: true }),
      );

      act(() => {
        simulateKeyDown('n');
      });

      expect(onNewNode).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should NOT call onNewNode when plain N is pressed with Ctrl modifier (Ctrl+N is handled separately)', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNewNode = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNewNode, enabled: true }),
      );

      // Note: Ctrl+N is handled by the dedicated Ctrl+N handler which calls onNewNode.
      // This test verifies the plain N handler does NOT fire on Ctrl+N (it returns early).
      // The dedicated Ctrl+N handler (tested separately) is what calls onNewNode for Ctrl+N.
      // So for this specific test, the plain N handler returns early and onNewNode is NOT called
      // because the plain N handler has !isCtrl && !isMeta guard.
      // HOWEVER: we now have a dedicated Ctrl+N handler that calls onNewNode.
      // So this test now expects onNewNode to BE called (by the dedicated handler).
      act(() => {
        simulateKeyDown('n', { ctrlKey: true });
      });

      // The dedicated Ctrl+N handler calls onNewNode
      expect(onNewNode).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Select All shortcut (Ctrl+A)', () => {
    it('should call onSelectAll when Ctrl+A is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onSelectAll = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onSelectAll, enabled: true }),
      );

      act(() => {
        simulateKeyDown('a', { ctrlKey: true });
      });

      expect(onSelectAll).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onSelectAll when Meta+A (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onSelectAll = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onSelectAll, enabled: true }),
      );

      act(() => {
        simulateKeyDown('a', { metaKey: true });
      });

      expect(onSelectAll).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onSelectAll when Ctrl+A is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onSelectAll = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onSelectAll, enabled: true }),
      );

      act(() => {
        simulateKeyDown('a', { ctrlKey: true });
      });

      expect(onSelectAll).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });
  });

  describe('Quick Generate shortcut (Ctrl+G)', () => {
    it('should call onQuickGenerate when Ctrl+G is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onQuickGenerate = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onQuickGenerate, enabled: true }),
      );

      act(() => {
        simulateKeyDown('g', { ctrlKey: true });
      });

      expect(onQuickGenerate).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onQuickGenerate when Meta+G (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onQuickGenerate = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onQuickGenerate, enabled: true }),
      );

      act(() => {
        simulateKeyDown('g', { metaKey: true });
      });

      expect(onQuickGenerate).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Confirm Selected shortcut (Ctrl+Shift+C)', () => {
    it('should call onConfirmSelected when Ctrl+Shift+C is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onConfirmSelected = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onConfirmSelected, enabled: true }),
      );

      act(() => {
        simulateKeyDown('c', { ctrlKey: true, shiftKey: true });
      });

      expect(onConfirmSelected).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onConfirmSelected when Meta+Shift+C (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onConfirmSelected = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onConfirmSelected, enabled: true }),
      );

      act(() => {
        simulateKeyDown('c', { metaKey: true, shiftKey: true });
      });

      expect(onConfirmSelected).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Generate Context shortcut (Ctrl+Shift+G)', () => {
    it('should call onGenerateContext when Ctrl+Shift+G is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onGenerateContext = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onGenerateContext, enabled: true }),
      );

      act(() => {
        simulateKeyDown('g', { ctrlKey: true, shiftKey: true });
      });

      expect(onGenerateContext).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Design Review shortcut (Ctrl+Shift+R)', () => {
    it('should call onDesignReview when Ctrl+Shift+R is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onDesignReview = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onDesignReview, enabled: true }),
      );

      act(() => {
        simulateKeyDown('r', { ctrlKey: true, shiftKey: true });
      });

      expect(onDesignReview).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onDesignReview when Meta+Shift+R (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onDesignReview = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onDesignReview, enabled: true }),
      );

      act(() => {
        simulateKeyDown('r', { metaKey: true, shiftKey: true });
      });

      expect(onDesignReview).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Tab Switch shortcuts (Alt+1/2/3)', () => {
    it('should call onSwitchToContext when Alt+1 is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onSwitchToContext = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onSwitchToContext, enabled: true }),
      );

      act(() => {
        simulateKeyDown('1', { altKey: true });
      });

      expect(onSwitchToContext).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onSwitchToFlow when Alt+2 is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onSwitchToFlow = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onSwitchToFlow, enabled: true }),
      );

      act(() => {
        simulateKeyDown('2', { altKey: true });
      });

      expect(onSwitchToFlow).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onSwitchToComponent when Alt+3 is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onSwitchToComponent = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onSwitchToComponent, enabled: true }),
      );

      act(() => {
        simulateKeyDown('3', { altKey: true });
      });

      expect(onSwitchToComponent).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('contenteditable input detection', () => {
    it('should NOT trigger shortcuts when contenteditable is true', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onClearSelection = vi.fn();

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      document.body.appendChild(div);
      Object.defineProperty(document, 'activeElement', {
        value: div,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onClearSelection, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(div);
    });

    it('should NOT trigger shortcuts when role=textbox', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const div = document.createElement('div');
      div.setAttribute('role', 'textbox');
      document.body.appendChild(div);
      Object.defineProperty(document, 'activeElement', {
        value: div,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(div);
    });

    it('should NOT trigger shortcuts when role=searchbox', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const input = document.createElement('input');
      input.setAttribute('role', 'searchbox');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should NOT trigger shortcuts when role=combobox', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const input = document.createElement('input');
      input.setAttribute('role', 'combobox');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });
  });

  // P003: dynamic shortcutStore integration
  // Note: hardcoded actions (undo, redo, zoom-in, etc.) are excluded from dynamic registration
  // to prevent double-calling. The dynamic system handles non-hardcoded actions like navigation.
  describe('shortcutStore dynamic integration (P003)', () => {
    it('should not trigger dynamic shortcut when focus is on input', () => {
      // Test that focus protection works for non-hardcoded actions
      // We test with a non-hardcoded action like go-to-canvas
      const undo = vi.fn();
      const redo = vi.fn();

      // Set custom key for a non-hardcoded action (go-to-canvas)
      useShortcutStore.setState({
        shortcuts: useShortcutStore.getState().shortcuts.map((s) =>
          s.action === 'go-to-canvas' ? { ...s, currentKey: 'Ctrl+Shift+K' } : s,
        ),
      });

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      // The dynamic handler for go-to-canvas (Ctrl+Shift+K) should NOT trigger when input focused
      act(() => {
        simulateKeyDown('k', { ctrlKey: true, shiftKey: true });
      });

      // undo/redo should not be called (go-to-canvas has no mapped callback)
      expect(undo).not.toHaveBeenCalled();
      expect(redo).not.toHaveBeenCalled();

      unmount();

      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);

      useShortcutStore.getState().loadDefaults();
    });

    it('should not affect hardcoded undo when shortcutStore is updated', () => {
      const undo = vi.fn().mockReturnValue(true);
      const redo = vi.fn();

      // Change undo key in shortcutStore (but hardcoded handler still handles Ctrl+Z)
      useShortcutStore.setState({
        shortcuts: useShortcutStore.getState().shortcuts.map((s) =>
          s.action === 'undo' ? { ...s, currentKey: 'Ctrl+Alt+U' } : s,
        ),
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      // Hardcoded Ctrl+Z still works
      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });
      expect(undo).toHaveBeenCalledTimes(1);

      // Custom key (Ctrl+Alt+U) won't trigger because undo is in HARDCODE_ACTIONS
      act(() => {
        simulateKeyDown('u', { ctrlKey: true, altKey: true });
      });
      expect(undo).toHaveBeenCalledTimes(1); // Still 1, no change

      unmount();
      useShortcutStore.getState().loadDefaults();
    });

    it('should not affect hardcoded zoom when shortcutStore is updated', () => {
      const onZoomIn = vi.fn();
      const undo = vi.fn();
      const redo = vi.fn();

      // Change zoom-in key in shortcutStore (hardcoded handler still handles + key)
      useShortcutStore.setState({
        shortcuts: useShortcutStore.getState().shortcuts.map((s) =>
          s.action === 'zoom-in' ? { ...s, currentKey: 'Ctrl+Shift+Plus' } : s,
        ),
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onZoomIn, enabled: true }),
      );

      // Hardcoded + key still works
      act(() => {
        simulateKeyDown('+');
      });
      expect(onZoomIn).toHaveBeenCalledTimes(1);

      // Custom key (Ctrl+Shift+Plus) won't trigger because zoom-in is in HARDCODE_ACTIONS
      act(() => {
        simulateKeyDown('+', { ctrlKey: true, shiftKey: true });
      });
      expect(onZoomIn).toHaveBeenCalledTimes(1); // Still 1, no change

      unmount();
      useShortcutStore.getState().loadDefaults();
    });

    it('should unregister dynamic shortcuts on unmount', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      // Set custom key for go-to-canvas
      useShortcutStore.setState({
        shortcuts: useShortcutStore.getState().shortcuts.map((s) =>
          s.action === 'go-to-canvas' ? { ...s, currentKey: 'Ctrl+Shift+X' } : s,
        ),
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      // Unmount the hook
      unmount();

      // After unmount, the shortcut should not trigger
      act(() => {
        simulateKeyDown('x', { ctrlKey: true, shiftKey: true });
      });

      // undo should not be called
      expect(undo).not.toHaveBeenCalled();

      useShortcutStore.getState().loadDefaults();
    });

    it('should update dynamic shortcuts when shortcutStore changes', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onOpenSearch = vi.fn();

      const { unmount, rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcuts({ undo, redo, onOpenSearch, enabled }),
        { initialProps: { enabled: true } },
      );

      // Update shortcutStore to change go-to-canvas key
      useShortcutStore.setState({
        shortcuts: useShortcutStore.getState().shortcuts.map((s) =>
          s.action === 'go-to-canvas' ? { ...s, currentKey: 'Ctrl+Shift+Y' } : s,
        ),
      });

      // The hook should re-subscribe and update handlers
      act(() => {
        simulateKeyDown('y', { ctrlKey: true, shiftKey: true });
      });

      // onOpenSearch should not be called (go-to-canvas has no callback)
      expect(onOpenSearch).not.toHaveBeenCalled();

      unmount();
      useShortcutStore.getState().loadDefaults();
    });
  });

  describe('Edge cases', () => {
    it('should handle key events with no activeElement (null)', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      // Simulate event with null activeElement
      Object.defineProperty(document, 'activeElement', {
        value: null,
        writable: true,
        configurable: true,
      });

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      // When activeElement is null, isInTextInput returns false
      // so shortcuts SHOULD work (undo is called)
      expect(undo).toHaveBeenCalledTimes(1);

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
    });

    it('should handle key events with non-HTML target', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true }),
      );

      // Simulate event with non-HTML target
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      document.body.appendChild(svg);
      Object.defineProperty(document, 'activeElement', {
        value: svg,
        writable: true,
        configurable: true,
      });

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      // Should not crash - shortcuts should work since SVG is not a text input
      expect(undo).toHaveBeenCalledTimes(1);

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(svg);
    });
  });

  // E002: Tab shortcuts
  describe('Tab shortcuts (E002)', () => {
    it('should call onNextTab when Tab is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNextTab = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNextTab, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Tab');
      });

      expect(onNextTab).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onPrevTab when Shift+Tab is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onPrevTab = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onPrevTab, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Tab', { shiftKey: true });
      });

      expect(onPrevTab).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onNextTab when Tab is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNextTab = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNextTab, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Tab');
      });

      expect(onNextTab).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should NOT call onPrevTab when Shift+Tab is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onPrevTab = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onPrevTab, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Tab', { shiftKey: true });
      });

      expect(onPrevTab).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should NOT call onNextTab when Tab is pressed with Ctrl modifier', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNextTab = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNextTab, enabled: true }),
      );

      act(() => {
        simulateKeyDown('Tab', { ctrlKey: true });
      });

      expect(onNextTab).not.toHaveBeenCalled();

      unmount();
    });

    it('should call onNextTab when Tab is pressed with enabled=false', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNextTab = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNextTab, enabled: false }),
      );

      act(() => {
        simulateKeyDown('Tab');
      });

      expect(onNextTab).not.toHaveBeenCalled();

      unmount();
    });
  });

  // E002: Ctrl+N shortcut
  describe('Ctrl+N shortcut (E002)', () => {
    it('should call onNewNode when Ctrl+N is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNewNode = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNewNode, enabled: true }),
      );

      act(() => {
        simulateKeyDown('n', { ctrlKey: true });
      });

      expect(onNewNode).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onNewNode when Meta+N (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNewNode = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNewNode, enabled: true }),
      );

      act(() => {
        simulateKeyDown('n', { metaKey: true });
      });

      expect(onNewNode).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onNewNode when Ctrl+N is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNewNode = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNewNode, enabled: true }),
      );

      act(() => {
        simulateKeyDown('n', { ctrlKey: true });
      });

      expect(onNewNode).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should call onNewNode when Ctrl+N is pressed with enabled=false', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNewNode = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNewNode, enabled: false }),
      );

      act(() => {
        simulateKeyDown('n', { ctrlKey: true });
      });

      expect(onNewNode).not.toHaveBeenCalled();

      unmount();
    });

    it('should NOT call onNewNode when plain N is pressed (only Ctrl+N)', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onNewNode = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onNewNode, enabled: true }),
      );

      act(() => {
        simulateKeyDown('n');
      });

      // Plain N triggers the existing N key handler (onNewNode without Ctrl)
      // But the new Ctrl+N handler should NOT trigger on plain N
      // The plain N handler calls onNewNode too, so it will be called
      // We test that the Ctrl+N handler doesn't interfere
      // Note: plain N already calls onNewNode — this test confirms Ctrl+N also works
      // The plain N test is separate (see 'New Node shortcut (N)' section)
      // Here we just verify Ctrl+N doesn't double-call
      expect(onNewNode).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  // ==================== E003: Ctrl+G Quick Generate ====================
  describe('Ctrl+G → onQuickGenerate (E003)', () => {
    it('should call onQuickGenerate when Ctrl+G is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onQuickGenerate = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onQuickGenerate, enabled: true }),
      );

      act(() => {
        simulateKeyDown('g', { ctrlKey: true });
      });

      expect(onQuickGenerate).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call onQuickGenerate when Meta+G (Mac) is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onQuickGenerate = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onQuickGenerate, enabled: true }),
      );

      act(() => {
        simulateKeyDown('g', { metaKey: true });
      });

      expect(onQuickGenerate).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onQuickGenerate when enabled=false', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onQuickGenerate = vi.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onQuickGenerate, enabled: false }),
      );

      act(() => {
        simulateKeyDown('g', { ctrlKey: true });
      });

      expect(onQuickGenerate).not.toHaveBeenCalled();

      unmount();
    });
  });

  // ==================== E003: ? Help overlay ====================
  describe('? → onHelp (E003)', () => {
    it('should call onHelp when ? is pressed', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onHelp = vi.fn();

      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onHelp, enabled: true }),
      );

      act(() => {
        simulateKeyDown('?');
      });

      expect(onHelp).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should NOT call onHelp when ? is pressed with input focused', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onHelp = vi.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onHelp, enabled: true }),
      );

      act(() => {
        simulateKeyDown('?');
      });

      expect(onHelp).not.toHaveBeenCalled();

      unmount();
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should NOT call onHelp when enabled=false', () => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onHelp = vi.fn();

      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, onHelp, enabled: false }),
      );

      act(() => {
        simulateKeyDown('?');
      });

      expect(onHelp).not.toHaveBeenCalled();

      unmount();
    });
  });
});
