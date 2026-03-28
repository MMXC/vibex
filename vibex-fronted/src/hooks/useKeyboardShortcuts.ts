/**
 * useKeyboardShortcuts — Global keyboard shortcuts for canvas
 *
 * Handles:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y / Cmd+Y: Redo
 * - ?: Shortcut hint toggle (optional, handled externally)
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 * - 焦点在输入框时不触发画布快捷键
 */
'use client';

import { useEffect } from 'react';
interface KeyboardShortcutsOptions {
  /** Actions from useCanvasHistory */
  undo: () => boolean;
  redo: () => boolean;
  /** Optional: open search dialog */
  onOpenSearch?: () => void;
  /** Whether shortcuts should be active */
  enabled?: boolean;
}

/**
 * Register global keyboard shortcuts for canvas operations.
 *
 * Shortcuts:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 * - Ctrl+Y / Cmd+Y: Redo (Windows alternative)
 * - /: Open search (when not in input, handled by parent)
 */
export function useKeyboardShortcuts({
  undo,
  redo,
  onOpenSearch,
  enabled = true,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    function isInTextInput(target: EventTarget | null): boolean {
      // Check both e.target and document.activeElement for reliability
      const activeEl = document.activeElement;
      if (!activeEl || !(activeEl instanceof HTMLElement)) return false;
      const tagName = activeEl.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return true;
      }
      // Also check for contenteditable elements
      if (activeEl.getAttribute('contenteditable') === 'true') {
        return true;
      }
      // Check if the element has role="textbox" or similar
      const role = activeEl.getAttribute('role');
      if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
        return true;
      }
      return false;
    }

    function handler(e: KeyboardEvent) {
      const isMeta = e.metaKey;
      const isCtrl = e.ctrlKey;

      // Skip canvas shortcuts when focus is on text input (except / which doesn't interfere)
      if (isInTextInput(e.target)) {
        // Only allow / for search even in inputs (common in VS Code)
        if (e.key === '/' && !isCtrl && !isMeta && !e.shiftKey) {
          e.preventDefault();
          onOpenSearch?.();
        }
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z (no shift)
      if ((isCtrl || isMeta) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if ((isCtrl || isMeta) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
        return;
      }
      if ((isCtrl || isMeta) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Search: '/' key (only when not in text input)
      if (e.key === '/' && !isCtrl && !isMeta && !e.shiftKey) {
        e.preventDefault();
        onOpenSearch?.();
        return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, redo, onOpenSearch, enabled]);
}
