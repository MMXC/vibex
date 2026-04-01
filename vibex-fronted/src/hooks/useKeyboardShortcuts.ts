/**
 * useKeyboardShortcuts — Global keyboard shortcuts for canvas
 *
 * Handles:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y / Cmd+Y: Redo
 * - Ctrl+K / Cmd+K: Open search dialog
 * - /: Open search dialog (alternative)
 * - +/-: Zoom in/out
 * - 0: Reset zoom
 * - Del/Backspace: Delete selected node
 * - N: New node (active tree)
 * - Esc: Cancel / close dialogs
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 * - 焦点在输入框时不触发画布快捷键（除 Esc 外）
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
  /** Select all nodes in active tree */
  onSelectAll?: () => void;
  /** Clear node selection */
  onClearSelection?: () => void;
  /** Create new node in active tree */
  onNewNode?: () => void;
  /** Quick generate (Ctrl+G) - cascade Context → Flow → Component */
  onQuickGenerate?: () => void;
  /** [E4] Confirm selected nodes (Ctrl+Shift+C) */
  onConfirmSelected?: () => void;
  /** [E4] Generate context from selected (Ctrl+Shift+G) */
  onGenerateContext?: () => void;
  /** Switch to Context tab (Alt+1) */
  onSwitchToContext?: () => void;
  /** Switch to Flow tab (Alt+2) */
  onSwitchToFlow?: () => void;
  /** Switch to Component tab (Alt+3) */
  onSwitchToComponent?: () => void;
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
 * - Ctrl+K / Cmd+K: Open search dialog
 * - /: Open search dialog (alternative)
 * - +/=: Zoom in
 * - -: Zoom out
 * - 0: Reset zoom
 * - Del / Backspace: Delete selected node
 * - N: New node (active tree)
 * - Esc: Cancel / close dialogs
 */
export function useKeyboardShortcuts({
  undo,
  redo,
  onOpenSearch,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onDelete,
  onSelectAll,
  onClearSelection,
  onNewNode,
  onQuickGenerate,
  onConfirmSelected,
  onGenerateContext,
  onSwitchToContext,
  onSwitchToFlow,
  onSwitchToComponent,
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

      // === Search: Ctrl+K / Cmd+K (always, even in input for search ===
      if ((isCtrl || isMeta) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch?.();
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

      // === New Node: N key (only when not in text input) ===
      if (e.key === 'n' && !isCtrl && !isMeta && !isInputFocused) {
        e.preventDefault();
        onNewNode?.();
        return;
      }

      // === Select All: Ctrl+A / Cmd+A ===
      if ((isCtrl || isMeta) && e.key.toLowerCase() === 'a') {
        if (isInputFocused) return; // Let browser handle select-all in inputs
        e.preventDefault();
        onSelectAll?.();
        return;
      }

      // === Clear Selection: Escape ===
      if (e.key === 'Escape' && !isInputFocused) {
        e.preventDefault();
        onClearSelection?.();
        return;
      }

      // === [E4] Confirm Selected: Ctrl+Shift+C / Cmd+Shift+C ===
      if ((isCtrl || isMeta) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onConfirmSelected?.();
        return;
      }

      // === [E4] Generate Context: Ctrl+Shift+G / Cmd+Shift+G ===
      if ((isCtrl || isMeta) && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        onGenerateContext?.();
        return;
      }

      // === Quick Generate: Ctrl+G / Cmd+G ===
      if ((isCtrl || isMeta) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        onQuickGenerate?.();
        return;
      }

      // === Tab Switch: Alt+1 (Context) ===
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        onSwitchToContext?.();
        return;
      }

      // === Tab Switch: Alt+2 (Flow) ===
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        onSwitchToFlow?.();
        return;
      }

      // === Tab Switch: Alt+3 (Component) ===
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        onSwitchToComponent?.();
        return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, redo, onOpenSearch, onZoomIn, onZoomOut, onZoomReset, onDelete, onSelectAll, onClearSelection, onNewNode, onQuickGenerate, onConfirmSelected, onGenerateContext, onSwitchToContext, onSwitchToFlow, onSwitchToComponent, enabled]);
}
