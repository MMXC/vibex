/**
 * useKeyboardShortcuts.ts — Keyboard shortcut event handler hook
 * Sprint52 E5: 键盘快捷键可配置化
 *
 * Reads active shortcuts from shortcutStore and registers global keydown listeners.
 * Dispatches to registered action handlers.
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

/**
 * Global keyboard shortcut hook.
 * Attach to root layout or app shell component.
 * Reads shortcuts from shortcutStore and dispatches to registered handlers.
 */
export function useKeyboardShortcuts() {
  const shortcuts = useShortcutStore((s) => s.shortcuts);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if focus is in an input/textarea (unless it's a global modifier combo)
      const target = e.target as HTMLElement;
      const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const hasModifiers = e.ctrlKey || e.altKey || e.metaKey;
      if (isEditable && !hasModifiers) return;

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
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);
}
