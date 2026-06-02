/**
 * useKeyboardShortcuts.ts — Keyboard shortcut event handler hook
 * Sprint55 E5: 键盘快捷键激活 (Undo/Redo 绑定)
 *
 * Reads active shortcuts from shortcutStore and dispatches to registered handlers.
 * Supports undo/redo via props (S55-E5) and global registered handlers.
 */
'use client';

import { useEffect, useCallback } from 'react';
import { useShortcutStore } from '@/stores/shortcutStore';

interface ShortcutHandler {
  (event: KeyboardEvent): void;
}

/** Map of action → handler functions registered by consuming components */
const registeredHandlers = new Map<string, ShortcutHandler>();

/** Register a handler for a specific shortcut action */
export function registerShortcutAction(action: string, handler: ShortcutHandler) {
  registeredHandlers.set(action, handler);
}

/** Unregister a handler */
export function unregisterShortcutAction(action: string) {
  registeredHandlers.delete(action);
}

function normalizeEventKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Cmd');

  let key = e.key;
  if (key === ' ') key = 'Space';
  if (key === 'ArrowUp') key = 'Up';
  if (key === 'ArrowDown') key = 'Down';
  if (key === 'ArrowLeft') key = 'Left';
  if (key === 'ArrowRight') key = 'Right';
  if (key.length === 1) key = key.toUpperCase();

  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return '';
  if (parts.length === 0) return key;
  return parts.join('+') + '+' + key;
}

export interface UseKeyboardShortcutsProps {
  /** Undo handler — called when Ctrl+Z / Cmd+Z is pressed */
  undo?: () => void;
  /** Redo handler — called when Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z is pressed */
  redo?: () => void;
  /** Called when Escape is pressed */
  onClearSelection?: () => void;
  /** Called when Ctrl+K or / is pressed */
  onOpenSearch?: () => void;
  /** Called when + is pressed */
  onZoomIn?: () => void;
  /** Called when - is pressed */
  onZoomOut?: () => void;
  /** Called when 0 is pressed */
  onZoomReset?: () => void;
  /** Enable/disable all shortcuts (default: true) */
  enabled?: boolean;
}

/**
 * Global keyboard shortcut hook.
 * Attach to root layout or app shell component.
 * Reads shortcuts from shortcutStore and dispatches to registered handlers.
 */
export function useKeyboardShortcuts(props: UseKeyboardShortcutsProps = {}) {
  const {
    undo,
    redo,
    onClearSelection,
    onOpenSearch,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    enabled = true,
  } = props;

  const shortcuts = useShortcutStore((s) => s.shortcuts);

  // Register undo/redo handlers with shortcutStore when props change
  useEffect(() => {
    const store = useShortcutStore.getState();
    if (undo) {
      store.registerUndoHandler(undo);
    }
    if (redo) {
      store.registerRedoHandler(redo);
    }
    return () => {
      const s = useShortcutStore.getState();
      if (undo) s.registerUndoHandler(() => {});
      if (redo) s.registerRedoHandler(() => {});
    };
  }, [undo, redo]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // S55-E5: Undo (Ctrl+Z / Cmd+Z) — always works, even in input fields
      // Ctrl+Z is the universal undo shortcut regardless of focus
      if (undo) {
        const ctrlZ =
          (e.ctrlKey || e.metaKey) &&
          e.key.toLowerCase() === 'z' &&
          !e.shiftKey;
        if (ctrlZ) {
          e.preventDefault();
          e.stopPropagation();
          useShortcutStore.getState().undo();
          return;
        }
      }

      // S55-E5: Redo (Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z)
      if (redo) {
        const ctrlY = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y';
        const ctrlShiftZ =
          (e.ctrlKey || e.metaKey) &&
          e.key.toLowerCase() === 'z' &&
          e.shiftKey;
        if (ctrlY || ctrlShiftZ) {
          e.preventDefault();
          e.stopPropagation();
          useShortcutStore.getState().redo();
          return;
        }
      }

      // Ignore if focus is in an input/textarea (unless it's a global modifier combo)
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      const hasModifiers = e.ctrlKey || e.altKey || e.metaKey;
      if (isEditable && !hasModifiers) return;

      // Escape → onClearSelection
      if (onClearSelection && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClearSelection();
        return;
      }

      // Search: / (without modifiers) or Ctrl+K / Cmd+K
      if (onOpenSearch) {
        const slashWithoutModifiers =
          e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
        const ctrlK =
          (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
        if (slashWithoutModifiers || ctrlK) {
          e.preventDefault();
          e.stopPropagation();
          onOpenSearch();
          return;
        }
      }

      // Zoom: + = zoom-in, - = zoom-out, 0 = zoom-reset
      if (e.key === '+' || e.key === '=') {
        if (onZoomIn) {
          e.preventDefault();
          e.stopPropagation();
          onZoomIn();
          return;
        }
      }
      if (e.key === '-') {
        if (onZoomOut) {
          e.preventDefault();
          e.stopPropagation();
          onZoomOut();
          return;
        }
      }
      if (e.key === '0') {
        if (onZoomReset) {
          e.preventDefault();
          e.stopPropagation();
          onZoomReset();
          return;
        }
      }

      // Global handler dispatch via shortcutStore shortcuts
      const combo = normalizeEventKey(e);
      if (!combo) return;

      const match = shortcuts.find((s) => s.currentKey === combo);
      if (!match) return;

      const handler = registeredHandlers.get(match.action);
      if (handler) {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      }
    },
    [shortcuts, enabled, undo, redo, onClearSelection, onOpenSearch, onZoomIn, onZoomOut, onZoomReset]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);
}
