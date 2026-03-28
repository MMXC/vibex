/**
 * useKeyboardShortcuts — Global keyboard shortcuts for canvas
 *
 * Handles:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y / Cmd+Y: Redo
 * - /: Open search dialog
 * - +/-: Zoom in/out
 * - 0: Reset zoom
 * - Del/Backspace: Delete selected node
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 * - 焦点在输入框时不触发画布快捷键（除 / 外）
 */
'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  /** Actions from useCanvasHistory */
  undo: () => boolean;
  redo: () => boolean;
  /** Open search dialog */
  onOpenSearch?: () => void;
  /** Zoom in */
  onZoomIn?: () => void;
  /** Zoom out */
  onZoomOut?: () => void;
  /** Reset zoom to default */
  onZoomReset?: () => void;
  /** Delete selected node(s) */
  onDelete?: () => void;
  /** Whether shortcuts should be active */
  enabled?: boolean;
}

/**
 * Register global keyboard shortcuts for canvas operations.
 *
 * Shortcuts:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 * - Ctrl+Y / Cmd+Y: Redo (Windows)
 * - /: Open search (when not in input)
 * - +/=: Zoom in
 * - -: Zoom out
 * - 0: Reset zoom
 * - Del / Backspace: Delete selected node
 */
export function useKeyboardShortcuts({
  undo,
  redo,
  onOpenSearch,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onDelete,
  enabled = true,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    function isInTextInput(_target: EventTarget | null): boolean {
      const activeEl = document.activeElement;
      if (!activeEl || !(activeEl instanceof HTMLElement)) return false;
      const tagName = activeEl.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return true;
      }
      if (activeEl.getAttribute('contenteditable') === 'true') {
        return true;
      }
      const role = activeEl.getAttribute('role');
      if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
        return true;
      }
      return false;
    }

    function handler(e: KeyboardEvent) {
      const isMeta = e.metaKey;
      const isCtrl = e.ctrlKey;
      const isInputFocused = isInTextInput(e.target);

      // === Undo: Ctrl+Z / Cmd+Z (skip if input is focused) ===
      if ((isCtrl || isMeta) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (isInputFocused) return; // Skip if focus is on input
        e.preventDefault();
        undo();
        return;
      }

      // === Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y (skip if input is focused) ===
      if ((isCtrl || isMeta) && e.shiftKey && e.key.toLowerCase() === 'z') {
        if (isInputFocused) return; // Skip if focus is on input
        e.preventDefault();
        redo();
        return;
      }
      if ((isCtrl || isMeta) && e.key.toLowerCase() === 'y') {
        if (isInputFocused) return; // Skip if focus is on input
        e.preventDefault();
        redo();
        return;
      }

      // === Search: '/' key (only when not in text input) ===
      if (e.key === '/' && !isCtrl && !isMeta && !e.shiftKey) {
        if (!isInputFocused) {
          e.preventDefault();
          onOpenSearch?.();
        }
        return;
      }

      // === Zoom In: + or = ===
      if ((e.key === '+' || e.key === '=') && !isCtrl && !isMeta && !isInputFocused) {
        e.preventDefault();
        onZoomIn?.();
        return;
      }

      // === Zoom Out: - ===
      if (e.key === '-' && !isCtrl && !isMeta && !isInputFocused) {
        e.preventDefault();
        onZoomOut?.();
        return;
      }

      // === Reset Zoom: 0 ===
      if (e.key === '0' && !isCtrl && !isMeta && !isInputFocused) {
        e.preventDefault();
        onZoomReset?.();
        return;
      }

      // === Delete: Del or Backspace ===
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !isInputFocused &&
        !isCtrl &&
        !isMeta
      ) {
        e.preventDefault();
        onDelete?.();
        return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, redo, onOpenSearch, onZoomIn, onZoomOut, onZoomReset, onDelete, enabled]);
}
