/**
 * canvasTabStore.test.ts — Sprint90 E1: Multi-Canvas Tabs
 *
 * Tests cover:
 * - openTab: opens new tab, focuses existing tab for same canvasId
 * - closeTab: removes tab, switches active if needed
 * - switchTab: changes activeTabId
 * - updateViewport: updates viewport for specific tab
 * - setDirty: marks tab as dirty/clean
 * - MAX_TABS=8 limit: 9th tab marks earliest as dormant
 * - hasDirtyTabs: returns true only if non-dormant dirty tabs exist
 * - wakeTab: brings dormant tab back
 * - renameTab: updates tab name
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCanvasTabStore } from '@/stores/dds/canvasTabStore';

function resetStore() {
  useCanvasTabStore.setState({
    tabs: [],
    activeTabId: null,
  });
}

describe('canvasTabStore', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    resetStore();
  });

  // ===== AC1: Open 3 different canvas tabs =====
  it('AC1: openTab creates 3 separate tabs for different canvasIds', () => {
    const id1 = useCanvasTabStore.getState().openTab('canvas-1', 'Canvas One');
    const id2 = useCanvasTabStore.getState().openTab('canvas-2', 'Canvas Two');
    const id3 = useCanvasTabStore.getState().openTab('canvas-3', 'Canvas Three');

    const tabs = useCanvasTabStore.getState().tabs;

    expect(tabs).toHaveLength(3);
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);

    // Each tab has its own canvasId
    expect(tabs.find((t) => t.id === id1)?.canvasId).toBe('canvas-1');
    expect(tabs.find((t) => t.id === id2)?.canvasId).toBe('canvas-2');
    expect(tabs.find((t) => t.id === id3)?.canvasId).toBe('canvas-3');
  });

  it('AC1: 3 tabs are all rendered (all non-dormant)', () => {
    useCanvasTabStore.getState().openTab('canvas-a', 'Tab A');
    useCanvasTabStore.getState().openTab('canvas-b', 'Tab B');
    useCanvasTabStore.getState().openTab('canvas-c', 'Tab C');

    const tabs = useCanvasTabStore.getState().tabs;
    expect(tabs.filter((t) => !t.dormant)).toHaveLength(3);
    expect(tabs.every((t) => !t.dormant)).toBe(true);
  });

  // ===== AC2: Tab switching preserves viewport =====
  it('AC2: switching tabs preserves viewport state per tab', () => {
    const id1 = useCanvasTabStore.getState().openTab('canvas-1', 'C1');
    const id2 = useCanvasTabStore.getState().openTab('canvas-2', 'C2');

    // Update viewport on tab 1
    useCanvasTabStore.getState().updateViewport(id1, { x: 100, y: 200, zoom: 1.5 });
    // Update viewport on tab 2
    useCanvasTabStore.getState().updateViewport(id2, { x: 300, y: 400, zoom: 0.75 });

    // Switch back to tab 1
    useCanvasTabStore.getState().switchTab(id1);
    const tab1 = useCanvasTabStore.getState().tabs.find((t) => t.id === id1);
    expect(tab1?.viewport).toEqual({ x: 100, y: 200, zoom: 1.5 });

    // Switch to tab 2
    useCanvasTabStore.getState().switchTab(id2);
    const tab2 = useCanvasTabStore.getState().tabs.find((t) => t.id === id2);
    expect(tab2?.viewport).toEqual({ x: 300, y: 400, zoom: 0.75 });
  });

  it('AC2: activeTabId is correctly updated on switch', () => {
    const id1 = useCanvasTabStore.getState().openTab('c1', 'Canvas 1');
    const id2 = useCanvasTabStore.getState().openTab('c2', 'Canvas 2');
    const id3 = useCanvasTabStore.getState().openTab('c3', 'Canvas 3');

    useCanvasTabStore.getState().switchTab(id2);
    expect(useCanvasTabStore.getState().activeTabId).toBe(id2);

    useCanvasTabStore.getState().switchTab(id3);
    expect(useCanvasTabStore.getState().activeTabId).toBe(id3);
  });

  // ===== AC3: beforeunload via hasDirtyTabs =====
  it('AC3: hasDirtyTabs returns true when non-dormant tab is dirty', () => {
    const id1 = useCanvasTabStore.getState().openTab('c1', 'Canvas 1');
    useCanvasTabStore.getState().openTab('c2', 'Canvas 2');

    expect(useCanvasTabStore.getState().hasDirtyTabs()).toBe(false);

    useCanvasTabStore.getState().setDirty(id1, true);
    expect(useCanvasTabStore.getState().hasDirtyTabs()).toBe(true);

    // Mark clean
    useCanvasTabStore.getState().setDirty(id1, false);
    expect(useCanvasTabStore.getState().hasDirtyTabs()).toBe(false);
  });

  it('AC3: hasDirtyTabs returns false for dormant dirty tabs', () => {
    const id1 = useCanvasTabStore.getState().openTab('c1', 'Canvas 1');
    useCanvasTabStore.getState().openTab('c2', 'Canvas 2');
    useCanvasTabStore.getState().openTab('c3', 'Canvas 3');
    useCanvasTabStore.getState().openTab('c4', 'Canvas 4');
    useCanvasTabStore.getState().openTab('c5', 'Canvas 5');
    useCanvasTabStore.getState().openTab('c6', 'Canvas 6');
    useCanvasTabStore.getState().openTab('c7', 'Canvas 7');
    useCanvasTabStore.getState().openTab('c8', 'Canvas 8');
    // 9th — id1 becomes dormant
    useCanvasTabStore.getState().openTab('c9', 'Canvas 9');

    // Mark the dormant tab as dirty
    useCanvasTabStore.getState().setDirty(id1, true);
    expect(useCanvasTabStore.getState().hasDirtyTabs()).toBe(false);
  });

  // ===== AC4: Max 8 tabs, earliest becomes dormant =====
  it('AC4: 9th tab marks earliest (first) tab as dormant', () => {
    const ids: string[] = [];
    for (let i = 1; i <= 9; i++) {
      ids.push(useCanvasTabStore.getState().openTab(`c${i}`, `Canvas ${i}`));
    }

    const tabs = useCanvasTabStore.getState().tabs;
    const activeTabs = tabs.filter((t) => !t.dormant);
    const dormantTabs = tabs.filter((t) => t.dormant);

    expect(activeTabs).toHaveLength(8);
    expect(dormantTabs).toHaveLength(1);
    expect(dormantTabs[0].id).toBe(ids[0]); // First tab is dormant
    expect(activeTabs.map((t) => t.id)).not.toContain(ids[0]);
  });

  it('AC4: max 8 active tabs in DOM (non-dormant)', () => {
    const ids: string[] = [];
    for (let i = 1; i <= 10; i++) {
      ids.push(useCanvasTabStore.getState().openTab(`c${i}`, `Canvas ${i}`));
    }

    const nonDormant = useCanvasTabStore.getState().tabs.filter((t) => !t.dormant);
    expect(nonDormant).toHaveLength(8);
  });

  it('AC4: 10th tab also marks earliest as dormant', () => {
    const ids: string[] = [];
    for (let i = 1; i <= 10; i++) {
      ids.push(useCanvasTabStore.getState().openTab(`c${i}`, `Canvas ${i}`));
    }

    const dormantTabs = useCanvasTabStore.getState().tabs.filter((t) => t.dormant);
    expect(dormantTabs).toHaveLength(2);
    expect(dormantTabs.map((t) => t.id)).toContain(ids[0]); // First
    expect(dormantTabs.map((t) => t.id)).toContain(ids[1]); // Second
  });

  // ===== Additional: closeTab =====
  it('closeTab removes the tab from list', () => {
    const id1 = useCanvasTabStore.getState().openTab('c1', 'C1');
    const id2 = useCanvasTabStore.getState().openTab('c2', 'C2');

    useCanvasTabStore.getState().closeTab(id1);
    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === id1)).toBeUndefined();
    expect(useCanvasTabStore.getState().tabs).toHaveLength(1);
  });

  it('closeTab of active tab switches to next available tab', () => {
    const id1 = useCanvasTabStore.getState().openTab('c1', 'C1');
    const id2 = useCanvasTabStore.getState().openTab('c2', 'C2');
    const id3 = useCanvasTabStore.getState().openTab('c3', 'C3');

    useCanvasTabStore.getState().switchTab(id2);
    expect(useCanvasTabStore.getState().activeTabId).toBe(id2);

    useCanvasTabStore.getState().closeTab(id2);
    // Should switch to tab before (id1), not id3
    expect(useCanvasTabStore.getState().activeTabId).toBe(id1);
  });

  it('closeTab returns true when closing active tab', () => {
    const id1 = useCanvasTabStore.getState().openTab('c1', 'C1');
    const id2 = useCanvasTabStore.getState().openTab('c2', 'C2');
    // id2 is active; closing it should return true and switch to id1
    const result = useCanvasTabStore.getState().closeTab(id2);
    expect(result).toBe(true);
    expect(useCanvasTabStore.getState().activeTabId).toBe(id1);
    // Closing inactive tab returns false
    const result2 = useCanvasTabStore.getState().closeTab(id1);
    expect(result2).toBe(true); // id1 is now active
  });

  it('closeTab returns false when tab not found', () => {
    useCanvasTabStore.getState().openTab('c1', 'C1');
    const result = useCanvasTabStore.getState().closeTab('non-existent-id');
    expect(result).toBe(false);
  });

  // ===== Additional: setDirty =====
  it('setDirty marks and unmarks tab correctly', () => {
    const id = useCanvasTabStore.getState().openTab('c1', 'C1');
    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === id)?.isDirty).toBe(false);

    useCanvasTabStore.getState().setDirty(id, true);
    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === id)?.isDirty).toBe(true);

    useCanvasTabStore.getState().setDirty(id, false);
    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === id)?.isDirty).toBe(false);
  });

  // ===== Additional: renameTab =====
  it('renameTab updates tab name', () => {
    const id = useCanvasTabStore.getState().openTab('c1', 'Old Name');
    useCanvasTabStore.getState().renameTab(id, 'New Name');
    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === id)?.name).toBe('New Name');
  });

  // ===== Additional: wakeTab =====
  it('wakeTab brings dormant tab back to active pool', () => {
    const ids: string[] = [];
    for (let i = 1; i <= 9; i++) {
      ids.push(useCanvasTabStore.getState().openTab(`c${i}`, `Canvas ${i}`));
    }

    // First tab should be dormant
    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === ids[0])?.dormant).toBe(true);

    // Wake it up
    useCanvasTabStore.getState().wakeTab(ids[0]);
    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === ids[0])?.dormant).toBe(false);
    expect(useCanvasTabStore.getState().activeTabId).toBe(ids[0]);
  });

  it('wakeTab marks earliest active as dormant if at limit', () => {
    const ids: string[] = [];
    for (let i = 1; i <= 9; i++) {
      ids.push(useCanvasTabStore.getState().openTab(`c${i}`, `Canvas ${i}`));
    }

    // Wake the dormant first tab — this should push out the now-earliest active tab
    useCanvasTabStore.getState().wakeTab(ids[0]);

    const tabs = useCanvasTabStore.getState().tabs;
    const dormantCount = tabs.filter((t) => t.dormant).length;
    const activeCount = tabs.filter((t) => !t.dormant).length;
    // After waking ids[0]: ids[1] becomes dormant, ids[0] becomes active → 1 dormant
    expect(activeCount).toBe(8);
    expect(dormantCount).toBe(1);
  });

  // ===== Additional: opening same canvasId focuses existing tab =====
  it('openTab for same canvasId returns existing tab id (no duplicate)', () => {
    const id1 = useCanvasTabStore.getState().openTab('c1', 'C1');
    const id1Again = useCanvasTabStore.getState().openTab('c1', 'C1');

    expect(id1).toBe(id1Again);
    expect(useCanvasTabStore.getState().tabs).toHaveLength(1);
    expect(useCanvasTabStore.getState().activeTabId).toBe(id1);
  });

  it('openTab for dormant same canvasId wakes it', () => {
    const ids: string[] = [];
    for (let i = 1; i <= 9; i++) {
      ids.push(useCanvasTabStore.getState().openTab(`c${i}`, `Canvas ${i}`));
    }

    // ids[0] is now dormant
    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === ids[0])?.dormant).toBe(true);

    // Open same canvasId again
    useCanvasTabStore.getState().openTab('c1', 'Canvas 1');

    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === ids[0])?.dormant).toBe(false);
    expect(useCanvasTabStore.getState().activeTabId).toBe(ids[0]);
  });

  // ===== Additional: switchTab does nothing for dormant =====
  it('switchTab ignores dormant tabs', () => {
    const ids: string[] = [];
    for (let i = 1; i <= 9; i++) {
      ids.push(useCanvasTabStore.getState().openTab(`c${i}`, `Canvas ${i}`));
    }

    useCanvasTabStore.getState().switchTab(ids[0]); // dormant — should not switch
    expect(useCanvasTabStore.getState().activeTabId).not.toBe(ids[0]);
  });

  // ===== Additional: partial viewport update =====
  it('updateViewport merges partial viewport', () => {
    const id = useCanvasTabStore.getState().openTab('c1', 'C1');

    useCanvasTabStore.getState().updateViewport(id, { x: 100, y: 200, zoom: 1 });
    useCanvasTabStore.getState().updateViewport(id, { zoom: 2 }); // partial update

    expect(useCanvasTabStore.getState().tabs.find((t) => t.id === id)?.viewport).toEqual({
      x: 100,
      y: 200,
      zoom: 2,
    });
  });

  // ===== Additional: close last tab sets activeTabId to null =====
  it('closeTab of last remaining tab sets activeTabId to null', () => {
    const id = useCanvasTabStore.getState().openTab('c1', 'C1');
    expect(useCanvasTabStore.getState().activeTabId).toBe(id);

    useCanvasTabStore.getState().closeTab(id);
    expect(useCanvasTabStore.getState().tabs).toHaveLength(0);
    expect(useCanvasTabStore.getState().activeTabId).toBeNull();
  });
});
