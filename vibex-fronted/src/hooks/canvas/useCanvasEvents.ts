/**
 * useCanvasEvents — global keyboard shortcuts and search dialog state for CanvasPage
 *
 * Extracts from CanvasPage.tsx:
 *  - Search dialog: isSearchOpen, openSearch, closeSearch
 *  - handleSearchSelect: scroll-to-node + highlight
 *  - F11 / Escape keyboard: maximize toggle
 *  - ? key: ShortcutHintPanel toggle
 *
 * Dependencies:
 *  - useCanvasState (E1): expandMode + toggleMaximize
 *
 * Epic: canvas-split-hooks / E5-useCanvasEvents
 * AGENTS.md: §2.1 Hook Template
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCanvasState } from './useCanvasState';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useGuidanceStore } from '@/stores/guidanceStore';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode, TreeType } from '@/lib/canvas/types';

// =============================================================================
// Types
// =============================================================================

export interface UseCanvasEventsSearchHandlers {
  /** Open the search dialog */
  openSearch: () => void;
  /** Close the search dialog */
  closeSearch: () => void;
  /** Handle clicking a search result — scroll + highlight */
  onSearchSelect: (result: { id: string; treeType: TreeType }) => void;
}

export interface UseCanvasEventsHandlers {
  /** Toggle the ShortcutHintPanel */
  toggleShortcutPanel: () => void;
}

export interface UseCanvasEventsReturn {
  // === Search dialog ===
  /** Whether the search dialog is open */
  isSearchOpen: boolean;
  /** Search-related handlers */
  search: UseCanvasEventsSearchHandlers;
  // === Shortcut panel ===
  /** Whether the shortcut hint panel is open */
  isShortcutPanelOpen: boolean;
  /** All handlers aggregated (useMemo) */
  handlers: UseCanvasEventsHandlers;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * useCanvasEvents — encapsulates search dialog state, node highlight/scroll,
 * and global keyboard shortcuts (F11 maximize, ? for shortcuts, Ctrl+F for search).
 *
 * @param contextNodes  — for handleSearchSelect context-node lookup
 * @param flowNodes     — for handleSearchSelect flow-node lookup
 * @param componentNodes — for handleSearchSelect component-node lookup
 *
 * @example
 * const { isSearchOpen, search, isShortcutPanelOpen, handlers } = useCanvasEvents(
 *   contextNodes, flowNodes, componentNodes
 * );
 */
export function useCanvasEvents(
  contextNodes: BoundedContextNode[],
  flowNodes: BusinessFlowNode[],
  componentNodes: ComponentNode[],
): UseCanvasEventsReturn {
  // Search dialog state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Shortcut panel state
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);

  // E1 state (for F11 / Escape maximize keyboard listener)
  const { expandMode, handlers: canvasStateHandlers } = useCanvasState();

  // =============================================================================
  // Search handlers
  // =============================================================================

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  /**
   * Handle clicking a search result:
   * 1. Switch active tree to the result's tree type
   * 2. Scroll the node into view
   * 3. Pulse-highlight the node for 2s
   */
  const onSearchSelect = useCallback(
    (result: { id: string; treeType: TreeType }) => {
      // Switch active tree
      useContextStore.getState().setActiveTree(result.treeType);

      // Scroll node into view
      const nodeEl = document.querySelector<HTMLElement>(
        `[data-node-id="${result.id}"]`,
      );
      nodeEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Pulse highlight for 2s
      nodeEl?.classList.add('searchHighlightNode');
      setTimeout(() => {
        nodeEl?.classList.remove('searchHighlightNode');
      }, 2000);
    },
    [],
  );

  // =============================================================================
  // Shortcut panel handler
  // =============================================================================

  const toggleShortcutPanel = useCallback(
    () => {
      setIsShortcutPanelOpen((v) => {
        const newState = !v;
        // F-2.2: 打开面板时隐藏 ShortcutBar，关闭时恢复
        if (newState) {
          useGuidanceStore.getState().hideShortcutBar();
        } else {
          useGuidanceStore.getState().showShortcutBar();
        }
        return newState;
      });
    },
    [],
  );

  // 监听 isShortcutPanelOpen 变化，确保状态同步
  useEffect(() => {
    if (isShortcutPanelOpen) {
      useGuidanceStore.getState().hideShortcutBar();
    } else {
      useGuidanceStore.getState().showShortcutBar();
    }
  }, [isShortcutPanelOpen]);

  // =============================================================================
  // Keyboard: F11 maximize + Escape (maximize only)
  // =============================================================================

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // F11 toggles maximize
      if (e.key === 'F11') {
        e.preventDefault();
        canvasStateHandlers.toggleMaximize();
      }
      // Escape exits maximize mode
      if (e.key === 'Escape' && expandMode === 'maximize') {
        // setExpandMode is available via useCanvasState but we use toggleMaximize
        // to keep consistent with F11
        canvasStateHandlers.toggleMaximize();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandMode, canvasStateHandlers]);

  // =============================================================================
  // Keyboard: ? toggles ShortcutHintPanel, Escape closes it
  // =============================================================================

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger ? key when not in an input field
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        if (!target || !(target instanceof Element)) {
          toggleShortcutPanel();
          return;
        }
        const tagName = target.tagName;
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT'
        )
          return;
        if (target.getAttribute?.('contenteditable') === 'true') return;
        const role = target.getAttribute?.('role');
        if (
          role === 'textbox' ||
          role === 'searchbox' ||
          role === 'combobox'
        )
          return;
        e.preventDefault();
        toggleShortcutPanel();
      }
      // Escape closes the shortcut panel
      if (e.key === 'Escape' && isShortcutPanelOpen) {
        setIsShortcutPanelOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleShortcutPanel, isShortcutPanelOpen]);

  // =============================================================================
  // Keyboard: Ctrl+F opens search
  // =============================================================================

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        openSearch();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  // =============================================================================
  // Aggregated handlers (useMemo — avoids reference churn)
  // =============================================================================

  const handlers = useMemo<UseCanvasEventsHandlers>(
    () => ({
      toggleShortcutPanel,
    }),
    [toggleShortcutPanel],
  );

  return {
    isSearchOpen,
    search: {
      openSearch,
      closeSearch,
      onSearchSelect,
    },
    isShortcutPanelOpen,
    handlers,
  };
}
