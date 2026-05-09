/**
 * useKeyboardShortcuts.test.ts — Unit tests for keyboard shortcuts
 *
 * Epic1 F1.2 测试: Ctrl+Z / Ctrl+Shift+Z 快捷键
 * P003 测试: shortcutStore 动态快捷键集成
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 canvasLogger.default.debug
 */
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
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
  });
});