/**
 * canvasTabStore — Sprint90 E1: Multi-Canvas Tabs
 *
 * Manages up to 8 canvas tabs for parallel editing and comparison.
 * Each tab independently maintains its viewport state (zoom/pan).
 * When the 9th tab is opened, the earliest tab is marked as "dormant".
 *
 * Tab structure:
 * - id: unique tab identifier
 * - canvasId: the underlying canvas project ID
 * - name: display name (canvas title)
 * - viewport: saved viewport state (x, y, zoom)
 * - isDirty: whether the tab has unsaved changes (shown as "·" marker)
 * - dormant: whether the tab is hibernated (persisted metadata only, no active state)
 *
 * Limits:
 * - MAX_TABS = 8 active tabs at any time
 * - Exceeding limit marks earliest tab as dormant
 */

import { create } from 'zustand';
import type { CanvasViewport } from '@/lib/canvas/stores/canvasViewportStore';

export interface CanvasTab {
  id: string;
  canvasId: string;
  name: string;
  viewport: CanvasViewport;
  isDirty: boolean;
  dormant: boolean;
  createdAt: number;
}

const MAX_TABS = 8;

/** Generate a short unique ID */
function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface CanvasTabStore {
  /** All tabs (active + dormant) ordered by creation time */
  tabs: CanvasTab[];
  /** Currently active (visible) tab ID */
  activeTabId: string | null;

  /** Open a new canvas tab (or focus existing tab for same canvasId) */
  openTab: (canvasId: string, name: string) => string;
  /** Close a tab by ID. Returns true if closed tab was active. */
  closeTab: (tabId: string) => boolean;
  /** Switch to a different tab. Saves current viewport before switching. */
  switchTab: (tabId: string) => void;
  /** Update viewport state for a specific tab */
  updateViewport: (tabId: string, viewport: Partial<CanvasViewport>) => void;
  /** Mark a tab as dirty (unsaved changes) or clean */
  setDirty: (tabId: string, dirty: boolean) => void;
  /** Rename a tab */
  renameTab: (tabId: string, name: string) => void;
  /** Wake up a dormant tab (bring back into active pool) */
  wakeTab: (tabId: string) => void;
  /** Check if any tab has unsaved changes (for beforeunload) */
  hasDirtyTabs: () => boolean;
}

export const useCanvasTabStore = create<CanvasTabStore>()((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (canvasId: string, name: string): string => {
    const { tabs } = get();

    // If a tab for this canvasId already exists (even dormant), wake/focus it
    const existing = tabs.find((t) => t.canvasId === canvasId);
    if (existing) {
      if (existing.dormant) {
        // Wake up the dormant tab
        set((state) => {
          const activeTabs = state.tabs.filter((t) => !t.dormant);
          if (activeTabs.length >= MAX_TABS) {
            // Mark earliest active as dormant to make room
            const earliest = activeTabs[0];
            return {
              tabs: state.tabs.map((t) =>
                t.id === earliest.id ? { ...t, dormant: true } :
                t.id === existing.id ? { ...t, dormant: false } : t
              ),
              activeTabId: existing.id,
            };
          }
          return {
            tabs: state.tabs.map((t) =>
              t.id === existing.id ? { ...t, dormant: false } : t
            ),
            activeTabId: existing.id,
          };
        });
      } else {
        // Just switch to it
        set({ activeTabId: existing.id });
      }
      return existing.id;
    }

    // New tab
    const newTab: CanvasTab = {
      id: generateTabId(),
      canvasId,
      name,
      viewport: { x: 0, y: 0, zoom: 1 },
      isDirty: false,
      dormant: false,
      createdAt: Date.now(),
    };

    set((state) => {
      const activeTabs = state.tabs.filter((t) => !t.dormant);

      if (activeTabs.length >= MAX_TABS) {
        // Mark the earliest as dormant
        const earliest = activeTabs[0];
        return {
          tabs: [
            ...state.tabs.map((t) =>
              t.id === earliest.id
                ? { ...t, dormant: true }
                : t
            ),
            newTab,
          ],
          activeTabId: newTab.id,
        };
      }

      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    });

    return newTab.id;
  },

  closeTab: (tabId: string): boolean => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return false;

    const wasActive = activeTabId === tabId;
    const newTabs = tabs.filter((t) => t.id !== tabId);

    let newActiveTabId: string | null = null;
    if (wasActive) {
      // Switch to the tab before this one, or the one after, or null
      const nextCandidate = newTabs[tabIndex - 1] ?? newTabs[tabIndex] ?? null;
      newActiveTabId = nextCandidate ? nextCandidate.id : null;
    } else {
      newActiveTabId = activeTabId;
    }

    set({ tabs: newTabs, activeTabId: newActiveTabId });
    return wasActive;
  },

  switchTab: (tabId: string): void => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab || tab.dormant) return;
    set({ activeTabId: tabId });
  },

  updateViewport: (tabId: string, viewport: Partial<CanvasViewport>): void => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId
          ? { ...t, viewport: { ...t.viewport, ...viewport } }
          : t
      ),
    }));
  },

  setDirty: (tabId: string, dirty: boolean): void => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isDirty: dirty } : t
      ),
    }));
  },

  renameTab: (tabId: string, name: string): void => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, name } : t
      ),
    }));
  },

  wakeTab: (tabId: string): void => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab || !tab.dormant) return;

    const activeTabs = tabs.filter((t) => !t.dormant);
    if (activeTabs.length >= MAX_TABS) {
      // Mark the earliest active tab as dormant to make room
      const earliest = activeTabs[0];
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === earliest.id ? { ...t, dormant: true } :
          t.id === tabId ? { ...t, dormant: false } : t
        ),
        activeTabId: tabId,
      }));
    } else {
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === tabId ? { ...t, dormant: false } : t
        ),
        activeTabId: tabId,
      }));
    }
  },

  hasDirtyTabs: (): boolean => {
    return get().tabs.some((t) => t.isDirty && !t.dormant);
  },
}));
