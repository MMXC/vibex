/**
 * CanvasTabBar.test.tsx — Sprint90 E1: Multi-Canvas Tabs
 *
 * AC1: 3 tabs are all rendered
 * AC2: Tab switching calls switchTab
 * AC3: Dirty tab shows · marker; beforeunload is registered
 * AC4: Dormant tabs are not rendered in tab bar
 *
 * Pattern: vi.mock + module-level Zustand test store (Pattern F)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { create } from 'zustand';
import { CanvasTabBar } from '../CanvasTabBar';
import type { CanvasTab } from '@/stores/dds/canvasTabStore';

// ============ Test store (mirrors real canvasTabStore shape) ============
interface TestTabStore {
  tabs: CanvasTab[];
  activeTabId: string | null;
  switchTab: ReturnType<typeof vi.fn>;
  closeTab: ReturnType<typeof vi.fn>;
  hasDirtyTabs: () => boolean;
}

const testTabStore = create<TestTabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  switchTab: vi.fn((tabId: string) => {
    set({ activeTabId: tabId });
  }),
  closeTab: vi.fn((tabId: string) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter((t) => t.id !== tabId);
    let newActiveTabId: string | null = null;
    if (activeTabId === tabId) {
      const idx = tabs.findIndex((t) => t.id === tabId);
      const next = newTabs[idx - 1] ?? newTabs[idx] ?? null;
      newActiveTabId = next ? next.id : null;
    } else {
      newActiveTabId = activeTabId;
    }
    set({ tabs: newTabs, activeTabId: newActiveTabId });
  }),
  hasDirtyTabs: () => get().tabs.some((t) => t.isDirty && !t.dormant),
}));

// ============ Mock the real store with test store ============
vi.mock('@/stores/dds/canvasTabStore', () => ({
  useCanvasTabStore:
    (selector?: (s: TestTabStore) => unknown) => {
      const state = testTabStore.getState();
      if (typeof selector === 'function') return selector(state);
      return state;
    },
}));

// ============ Tests ============
describe('CanvasTabBar', () => {
  beforeEach(() => {
    testTabStore.setState({
      tabs: [
        { id: 'tab-1', canvasId: 'canvas-1', name: 'Canvas One', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: false, dormant: false, createdAt: 1000 },
        { id: 'tab-2', canvasId: 'canvas-2', name: 'Canvas Two', viewport: { x: 100, y: 200, zoom: 1.5 }, isDirty: false, dormant: false, createdAt: 2000 },
        { id: 'tab-3', canvasId: 'canvas-3', name: 'Canvas Three', viewport: { x: 300, y: 400, zoom: 0.75 }, isDirty: false, dormant: false, createdAt: 3000 },
      ],
      activeTabId: 'tab-1',
    });
    vi.clearAllMocks();
    // Reset mock functions to be fresh
    testTabStore.setState({
      switchTab: vi.fn((tabId: string) => {
        testTabStore.setState({ activeTabId: tabId });
      }),
      closeTab: vi.fn((tabId: string) => {
        const { tabs, activeTabId } = testTabStore.getState();
        const newTabs = tabs.filter((t) => t.id !== tabId);
        let newActiveTabId: string | null = null;
        if (activeTabId === tabId) {
          const idx = tabs.findIndex((t) => t.id === tabId);
          const next = newTabs[idx - 1] ?? newTabs[idx] ?? null;
          newActiveTabId = next ? next.id : null;
        } else {
          newActiveTabId = activeTabId;
        }
        testTabStore.setState({ tabs: newTabs, activeTabId: newActiveTabId });
      }),
      hasDirtyTabs: () => testTabStore.getState().tabs.some((t) => t.isDirty && !t.dormant),
    });
  });

  afterEach(() => {
    cleanup();
  });

  // ===== AC1: 3 tabs rendered =====
  it('AC1: renders 3 tab buttons when there are 3 non-dormant tabs', () => {
    render(<CanvasTabBar />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('AC1: tab names are displayed correctly', () => {
    render(<CanvasTabBar />);
    expect(screen.getByText('Canvas One')).toBeInTheDocument();
    expect(screen.getByText('Canvas Two')).toBeInTheDocument();
    expect(screen.getByText('Canvas Three')).toBeInTheDocument();
  });

  it('AC1: aria-selected is true for active tab', () => {
    render(<CanvasTabBar />);
    const tab1 = screen.getByRole('tab', { name: /Canvas One/i });
    expect(tab1).toHaveAttribute('aria-selected', 'true');
  });

  it('AC1: aria-selected is false for inactive tabs', () => {
    render(<CanvasTabBar />);
    const tab2 = screen.getByRole('tab', { name: /Canvas Two/i });
    expect(tab2).toHaveAttribute('aria-selected', 'false');
  });

  // ===== AC2: Tab switching =====
  it('AC2: clicking an inactive tab calls switchTab', () => {
    render(<CanvasTabBar />);
    const tab2 = screen.getByRole('tab', { name: /Canvas Two/i });
    fireEvent.click(tab2);
    const switchTab = testTabStore.getState().switchTab;
    expect(switchTab).toHaveBeenCalledWith('tab-2');
  });

  it('AC2: clicking active tab also calls switchTab', () => {
    render(<CanvasTabBar />);
    const tab1 = screen.getByRole('tab', { name: /Canvas One/i });
    fireEvent.click(tab1);
    const switchTab = testTabStore.getState().switchTab;
    expect(switchTab).toHaveBeenCalledWith('tab-1');
  });

  // ===== AC3: Dirty marker =====
  it('AC3: dirty tab shows · marker', () => {
    testTabStore.setState({
      tabs: [
        { id: 'tab-1', canvasId: 'canvas-1', name: 'Dirty Canvas', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: true, dormant: false, createdAt: 1000 },
      ],
      activeTabId: 'tab-1',
    });
    render(<CanvasTabBar />);
    expect(screen.getByTestId('dirty-marker')).toBeInTheDocument();
    expect(screen.getByTestId('dirty-marker')).toHaveTextContent('·');
  });

  it('AC3: clean tab does NOT show dirty marker', () => {
    testTabStore.setState({
      tabs: [
        { id: 'tab-1', canvasId: 'canvas-1', name: 'Clean Canvas', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: false, dormant: false, createdAt: 1000 },
      ],
      activeTabId: 'tab-1',
    });
    render(<CanvasTabBar />);
    expect(screen.queryByTestId('dirty-marker')).not.toBeInTheDocument();
  });

  it('AC3: beforeunload is registered when component mounts', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    render(<CanvasTabBar />);
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });

  it('AC3: beforeunload handler calls preventDefault on dirty tabs', () => {
    testTabStore.setState({
      tabs: [
        { id: 'tab-1', canvasId: 'canvas-1', name: 'Dirty', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: true, dormant: false, createdAt: 1000 },
      ],
      activeTabId: 'tab-1',
    });
    const preventDefault = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'beforeunload') {
        (handler as (e: BeforeUnloadEvent) => void)({ preventDefault } as BeforeUnloadEvent);
      }
    });
    render(<CanvasTabBar />);
    expect(preventDefault).toHaveBeenCalled();
    addEventListenerSpy.mockRestore();
  });

  it('AC3: confirm dialog shown on close of dirty tab (user cancels)', () => {
    testTabStore.setState({
      tabs: [
        { id: 'tab-1', canvasId: 'canvas-1', name: 'Dirty', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: true, dormant: false, createdAt: 1000 },
      ],
      activeTabId: 'tab-1',
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CanvasTabBar />);
    const closeBtn = screen.getByTestId('close-tab-tab-1');
    fireEvent.click(closeBtn);
    expect(window.confirm).toHaveBeenCalledWith('Tab "Dirty" has unsaved changes. Close anyway?');
    expect(testTabStore.getState().closeTab).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('AC3: closeTab called after confirm(true) on dirty tab', () => {
    testTabStore.setState({
      tabs: [
        { id: 'tab-1', canvasId: 'canvas-1', name: 'Dirty', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: true, dormant: false, createdAt: 1000 },
      ],
      activeTabId: 'tab-1',
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CanvasTabBar />);
    const closeBtn = screen.getByTestId('close-tab-tab-1');
    fireEvent.click(closeBtn);
    expect(testTabStore.getState().closeTab).toHaveBeenCalledWith('tab-1');
    confirmSpy.mockRestore();
  });

  it('AC3: closeTab called directly for non-dirty tab (no confirm)', () => {
    testTabStore.setState({
      tabs: [
        { id: 'tab-1', canvasId: 'canvas-1', name: 'Clean', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: false, dormant: false, createdAt: 1000 },
      ],
      activeTabId: 'tab-1',
    });
    const confirmSpy = vi.spyOn(window, 'confirm');
    render(<CanvasTabBar />);
    const closeBtn = screen.getByTestId('close-tab-tab-1');
    fireEvent.click(closeBtn);
    expect(window.confirm).not.toHaveBeenCalled();
    expect(testTabStore.getState().closeTab).toHaveBeenCalledWith('tab-1');
    confirmSpy.mockRestore();
  });

  // ===== AC4: Dormant tabs hidden =====
  it('AC4: dormant tabs are not rendered in tab bar', () => {
    testTabStore.setState({
      tabs: [
        { id: 'tab-1', canvasId: 'canvas-1', name: 'Dormant', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: false, dormant: true, createdAt: 1000 },
        { id: 'tab-2', canvasId: 'canvas-2', name: 'Active', viewport: { x: 0, y: 0, zoom: 1 }, isDirty: false, dormant: false, createdAt: 2000 },
      ],
      activeTabId: 'tab-2',
    });
    render(<CanvasTabBar />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(screen.queryByText('Dormant')).not.toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  // ===== Additional: Add tab button =====
  it('renders add tab button when onNewTab is provided', () => {
    const onNewTab = vi.fn();
    render(<CanvasTabBar onNewTab={onNewTab} />);
    expect(screen.getByTestId('add-canvas-tab')).toBeInTheDocument();
  });

  it('does not render add tab button when onNewTab is omitted', () => {
    render(<CanvasTabBar />);
    expect(screen.queryByTestId('add-canvas-tab')).not.toBeInTheDocument();
  });

  it('calls onNewTab when add button is clicked', () => {
    const onNewTab = vi.fn();
    render(<CanvasTabBar onNewTab={onNewTab} />);
    fireEvent.click(screen.getByTestId('add-canvas-tab'));
    expect(onNewTab).toHaveBeenCalledTimes(1);
  });

  // ===== Additional: renders null when no tabs =====
  it('renders nothing when there are no non-dormant tabs', () => {
    testTabStore.setState({ tabs: [], activeTabId: null });
    render(<CanvasTabBar />);
    expect(screen.queryByTestId('canvas-tab-bar')).not.toBeInTheDocument();
  });

  // ===== Additional: tab bar accessibility =====
  it('has correct role and aria-label on the container', () => {
    render(<CanvasTabBar />);
    const bar = screen.getByTestId('canvas-tab-bar');
    expect(bar).toHaveAttribute('role', 'tablist');
    expect(bar).toHaveAttribute('aria-label', 'Canvas tabs');
  });

  it('close button has aria-label', () => {
    render(<CanvasTabBar />);
    const closeBtn = screen.getByTestId('close-tab-tab-1');
    expect(closeBtn).toHaveAttribute('aria-label', 'Close tab: Canvas One');
  });
});
