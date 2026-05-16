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
 * - Tab: Next tab (nextTab)
 * - Shift+Tab: Previous tab (prevTab)
 * - Ctrl+N: Create new node (onNewNode)
 * - Esc: Cancel / close dialogs
 *
 * P003: Dynamically reads shortcutStore to register custom shortcuts at runtime.
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 canvasLogger.default.debug
 * - 焦点在输入框时不触发画布快捷键（除 Esc 外）
 */
'use client';

import { useEffect, useMemo, useRef } from 'react';

import { canvasLogger } from '@/lib/canvas/canvasLogger';
import { useShortcutStore, parseKeyEvent } from '@/stores/shortcutStore';

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
  /** [E002] Next tab (Tab key) */
  onNextTab?: () => void;
  /** [E002] Previous tab (Shift+Tab key) */
  onPrevTab?: () => void;
  /** [S16-P0-1] Design Review (Ctrl+Shift+R / Cmd+Shift+R) */
  onDesignReview?: () => void;
  /** [E003] Help overlay (?: toggle help) */
  onHelp?: () => void;
  /** Whether shortcuts should be active */
  enabled?: boolean;
}

// Mapping from shortcutStore action names to callbacks
type ActionName =
  | 'undo'
  | 'redo'
  | 'open-search'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
  | 'delete'
  | 'selectall'
  | 'clear-selection'
  | 'new-node'
  | 'quick-generate'
  | 'confirm-selected'
  | 'generate-context'
  | 'switch-to-context'
  | 'switch-to-flow'
  | 'switch-to-component'
  | 'next-tab'
  | 'prev-tab'
  | 'design-review'
  | 'help';

// Actions that have hardcoded handlers in useKeyboardShortcuts.
// The dynamic shortcutStore system should NOT re-register these to avoid duplicate calls.
// Users can still customize these via shortcutStore, but the hardcoded handler takes precedence.
const HARDCODE_ACTIONS = new Set<ActionName>([
  'undo',
  'redo',
  'open-search',
  'zoom-in',
  'zoom-out',
  'zoom-reset',
  'delete',
  'new-node',
  'selectall',
  'clear-selection',
  'quick-generate',
  'confirm-selected',
  'generate-context',
  'switch-to-context',
  'switch-to-flow',
  'switch-to-component',
  'next-tab',
  'prev-tab',
  'design-review',
  'help',
]);

function isInTextInput(target: EventTarget | null): boolean {
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
 * - Tab: Next tab (onNextTab)
 * - Shift+Tab: Previous tab (onPrevTab)
 * - Ctrl+N / Cmd+N: Create new node (onNewNode)
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
  onNextTab,
  onPrevTab,
  onDesignReview,
  onHelp,
  enabled = true,
}: KeyboardShortcutsOptions) {
  // P003 U1-P003: action map from shortcutStore action names to callbacks
  const actionMap = useMemo<Record<ActionName, () => void>>(
    () => ({
      undo: undo as () => void,
      redo: redo as () => void,
      'open-search': onOpenSearch as () => void,
      'zoom-in': onZoomIn as () => void,
      'zoom-out': onZoomOut as () => void,
      'zoom-reset': onZoomReset as () => void,
      delete: onDelete as () => void,
      selectall: onSelectAll as () => void,
      'clear-selection': onClearSelection as () => void,
      'new-node': onNewNode as () => void,
      'quick-generate': onQuickGenerate as () => void,
      'confirm-selected': onConfirmSelected as () => void,
      'generate-context': onGenerateContext as () => void,
      'switch-to-context': onSwitchToContext as () => void,
      'switch-to-flow': onSwitchToFlow as () => void,
      'switch-to-component': onSwitchToComponent as () => void,
      'next-tab': onNextTab as () => void,
      'prev-tab': onPrevTab as () => void,
      'design-review': onDesignReview as () => void,
      'help': onHelp as () => void,
    }),
    [
      undo, redo, onOpenSearch, onZoomIn, onZoomOut, onZoomReset,
      onDelete, onSelectAll, onClearSelection, onNewNode,
      onQuickGenerate, onConfirmSelected, onGenerateContext,
      onSwitchToContext, onSwitchToFlow, onSwitchToComponent, onNextTab, onPrevTab, onDesignReview,
      onHelp, enabled,
    ],
  );

  // Track dynamic shortcut handlers for cleanup
  const dynamicHandlersRef = useRef<
    Array<{ key: string; handler: (e: KeyboardEvent) => void }>
  >([]);

  // P003 U1-P003: subscribe shortcutStore to dynamically register shortcuts from user config
  useEffect(() => {
    if (!enabled) return;

    function unregisterAllDynamic() {
      dynamicHandlersRef.current.forEach(({ handler }) => {
        document.removeEventListener('keydown', handler, false);
      });
      dynamicHandlersRef.current = [];
    }

    function registerFromStore(
      state: ReturnType<typeof useShortcutStore.getState>,
    ) {
      unregisterAllDynamic();

      state.shortcuts
        .filter((s) => s.currentKey && !HARDCODE_ACTIONS.has(s.action as ActionName))
        .forEach((s) => {
          const callback = actionMap[s.action as ActionName];
          if (!callback) return;

          const handler = (e: KeyboardEvent) => {
            const keyStr = parseKeyEvent(e);
            if (keyStr !== s.currentKey) return;

            // Focus protection — skip in input fields except Escape
            if (isInTextInput(e.target) && keyStr !== 'Escape') return;

            e.preventDefault();
            callback();
          };

          document.addEventListener('keydown', handler, false);
          dynamicHandlersRef.current.push({ key: s.currentKey, handler });
        });
    }

    // Subscribe to store changes
    const unsubscribe = useShortcutStore.subscribe((state) => {
      registerFromStore(state);
    });

    // Initial registration
    registerFromStore(useShortcutStore.getState());

    return () => {
      unregisterAllDynamic();
      unsubscribe();
    };
  }, [enabled, actionMap]);

  // Hardcoded shortcuts baseline — always active as fallback
  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      const isMeta = e.metaKey;
      const isCtrl = e.ctrlKey;
      const isInputFocused = isInTextInput(e.target);

      // === Undo: Ctrl+Z / Cmd+Z ===
      if ((isCtrl || isMeta) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (isInputFocused) return;
        e.preventDefault();
        undo();
        return;
      }

      // === Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y ===
      if ((isCtrl || isMeta) && e.shiftKey && e.key.toLowerCase() === 'z') {
        if (isInputFocused) return;
        e.preventDefault();
        redo();
        return;
      }
      if ((isCtrl || isMeta) && e.key.toLowerCase() === 'y') {
        if (isInputFocused) return;
        e.preventDefault();
        redo();
        return;
      }

      // === Search: '/' key ===
      if (e.key === '/' && !isCtrl && !isMeta && !e.shiftKey) {
        if (!isInputFocused) {
          e.preventDefault();
          onOpenSearch?.();
        }
        return;
      }

      // === Search: Ctrl+K / Cmd+K ===
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

      // === New Node: N key ===
      if (e.key === 'n' && !isCtrl && !isMeta && !isInputFocused) {
        e.preventDefault();
        onNewNode?.();
        return;
      }

      // === Select All: Ctrl+A / Cmd+A ===
      if ((isCtrl || isMeta) && e.key.toLowerCase() === 'a') {
        if (isInputFocused) return;
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

      // === [S16-P0-1] Design Review: Ctrl+Shift+R / Cmd+Shift+R ===
      if ((isCtrl || isMeta) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onDesignReview?.();
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

      // === [E002] Previous Tab: Shift+Tab (must come before plain Tab) ===
      if (e.key === 'Tab' && !isCtrl && !isMeta && e.shiftKey && !isInputFocused) {
        e.preventDefault();
        onPrevTab?.();
        return;
      }

      // === [E002] Next Tab: Tab key ===
      if (e.key === 'Tab' && !isCtrl && !isMeta && !isInputFocused) {
        e.preventDefault();
        onNextTab?.();
        return;
      }

      // === [E002] New Node: Ctrl+N / Cmd+N ===
      if ((isCtrl || isMeta) && e.key.toLowerCase() === 'n') {
        if (isInputFocused) return;
        e.preventDefault();
        onNewNode?.();
        return;
      }

      // === [E003] Help: ? key (show keyboard shortcuts overlay) ===
      if (e.key === '?' && !isInputFocused && !isCtrl && !isMeta) {
        e.preventDefault();
        onHelp?.();
        return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [
    undo, redo, onOpenSearch, onZoomIn, onZoomOut, onZoomReset,
    onDelete, onSelectAll, onClearSelection, onNewNode,
    onQuickGenerate, onConfirmSelected, onGenerateContext,
      onSwitchToContext, onSwitchToFlow, onSwitchToComponent, onNextTab, onPrevTab, onDesignReview,
    onHelp, enabled,
  ]);
}