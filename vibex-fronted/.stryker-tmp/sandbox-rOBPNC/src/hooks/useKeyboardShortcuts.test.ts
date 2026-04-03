/**
 * useKeyboardShortcuts.test.ts — Unit tests for keyboard shortcuts
 *
 * Epic1 F1.2 测试: Ctrl+Z / Ctrl+Shift+Z 快捷键
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
// @ts-nocheck

import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';


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
    // Reset state between tests
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', () => {});
  });

  describe('Ctrl+Z / Cmd+Z → Undo', () => {
    it('should call undo when Ctrl+Z is pressed', () => {
      const undo = jest.fn().mockReturnValue(true);
      const redo = jest.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true })
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).toHaveBeenCalledTimes(1);
      expect(redo).not.toHaveBeenCalled();

      unmount();
    });

    it('should call undo when Meta+Z (Mac) is pressed', () => {
      const undo = jest.fn().mockReturnValue(true);
      const redo = jest.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true })
      );

      act(() => {
        simulateKeyDown('z', { metaKey: true });
      });

      expect(undo).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("should NOT call undo when Ctrl+Shift+Z is pressed (that's redo)", () => {
      const undo = jest.fn();
      const redo = jest.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true })
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true, shiftKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
    });

    it('should NOT call undo when focus is on an input element', () => {
      const undo = jest.fn();
      const redo = jest.fn();

      // Create and focus an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      // Explicitly set activeElement (JSDOM may not auto-set on focus())
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true })
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      // undo should NOT be called when focus is on input
      expect(undo).not.toHaveBeenCalled();

      unmount();
      // Restore activeElement
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
      document.body.removeChild(input);
    });

    it('should NOT call undo when Ctrl+Z is pressed in textarea', () => {
      const undo = jest.fn().mockReturnValue(true);
      const redo = jest.fn();

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      // Explicitly set activeElement (JSDOM may not auto-set on focus())
      Object.defineProperty(document, 'activeElement', {
        value: textarea,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true })
      );

      // Ctrl+Z in textarea should be handled by the browser (undo text editing)
      // not by the canvas undo/redo system
      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();

      unmount();
      // Restore activeElement
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
      const undo = jest.fn();
      const redo = jest.fn().mockReturnValue(true);

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true })
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true, shiftKey: true });
      });

      expect(redo).toHaveBeenCalledTimes(1);
      expect(undo).not.toHaveBeenCalled();

      unmount();
    });

    it('should call redo when Meta+Shift+Z (Mac) is pressed', () => {
      const undo = jest.fn();
      const redo = jest.fn().mockReturnValue(true);

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true })
      );

      act(() => {
        simulateKeyDown('z', { metaKey: true, shiftKey: true });
      });

      expect(redo).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call redo when Ctrl+Y (Windows) is pressed', () => {
      const undo = jest.fn();
      const redo = jest.fn().mockReturnValue(true);

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: true })
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
      const undo = jest.fn();
      const redo = jest.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ undo, redo, enabled: false })
      );

      act(() => {
        simulateKeyDown('z', { ctrlKey: true });
      });

      expect(undo).not.toHaveBeenCalled();
      expect(redo).not.toHaveBeenCalled();

      unmount();
    });
  });
});
