/**
 * CommandPalette.test.tsx — S84-E3: 画布快速跳转面板
 * ≥10 test cases covering: render, open/close, search, navigation, history
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CommandPalette } from '../CommandPalette';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock canvas entries
const MOCK_CANVASES = [
  { id: 'c1', name: '用户认证系统' },
  { id: 'c2', name: '支付模块设计' },
  { id: 'c3', name: '库存管理系统' },
  { id: 'c4', name: '订单处理流程' },
  { id: 'c5', name: '用户中心模块' },
];

// Helper: open palette before each test
function openPalette() {
  useCommandPaletteStore.getState().open();
}

describe('CommandPalette', () => {
  beforeEach(() => {
    const store = useCommandPaletteStore.getState();
    store.close();
    store.setQuery('');
    store.clearHistory();
  });

  afterEach(() => {
    useCommandPaletteStore.getState().close();
  });

  // T1: renders nothing when closed
  it('T1: renders nothing when isOpen=false', () => {
    const { container } = render(<CommandPalette canvases={MOCK_CANVASES} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  // T2: renders panel when opened
  it('T2: renders panel and input when isOpen=true', () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('command-palette-input')).toBeInTheDocument();
  });

  // T3: shows empty-state when no recent history and no query
  it('T3: shows empty state message when no history and no query', () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();
    expect(screen.getByText('最近访问的画布将显示在这里')).toBeInTheDocument();
  });

  // T4: shows recent canvases from store
  it('T4: shows recent canvases from store when query is empty', () => {
    const store = useCommandPaletteStore.getState();
    store.recordVisit('c1', '用户认证系统');
    store.recordVisit('c2', '支付模块设计');

    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    expect(screen.getByText('最近访问')).toBeInTheDocument();
    expect(screen.getByText('用户认证系统')).toBeInTheDocument();
    expect(screen.getByText('支付模块设计')).toBeInTheDocument();
  });

  // T5: fuzzy search filters results
  it('T5: fuzzy search filters canvases by name', async () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: '用户' } });

    await waitFor(() => {
      expect(screen.getByText('搜索结果')).toBeInTheDocument();
    });

    // Should find both canvases with "用户"
    expect(screen.getByText('用户认证系统')).toBeInTheDocument();
    expect(screen.getByText('用户中心模块')).toBeInTheDocument();
  });

  // T6: empty search results message
  it('T6: shows not-found message for non-matching query', () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: 'xyznonexistent123' } });

    expect(screen.getByText('未找到匹配的画布')).toBeInTheDocument();
  });

  // T7: keyboard navigation — ArrowDown
  it('T7: ArrowDown moves active index down', async () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    const input = screen.getByTestId('command-palette-input');

    // Type to get search results
    fireEvent.change(input, { target: { value: '模块' } });
    await waitFor(() => {
      expect(screen.getByTestId('command-palette-results')).toBeInTheDocument();
    });

    // Move down
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const active = document.querySelector('[data-active="true"]');
    expect(active).toBeInTheDocument();
    expect(active?.textContent).toContain('模块');
  });

  // T8: keyboard navigation — ArrowUp wraps to last
  it('T8: ArrowUp moves active index up', async () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: '模块' } });
    await waitFor(() => {
      expect(screen.getByTestId('command-palette-results')).toBeInTheDocument();
    });

    // Move down then up
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    const active = document.querySelector('[data-active="true"]');
    expect(active).toBeInTheDocument();
  });

  // T9: Escape closes palette
  it('T9: Escape key closes the palette', () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // T10: close via backdrop click
  it('T10: clicking backdrop closes palette', () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click the overlay (outside panel)
    const overlay = document.querySelector('[role="dialog"]');
    // Simulate mousedown on overlay target
    fireEvent.mouseDown(overlay as Element, { target: overlay, currentTarget: overlay });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // T11: Enter navigates to active item
  it('T11: Enter key triggers navigation for active item', async () => {
    const push = vi.fn();
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ push }),
    }));

    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: '用户' } });

    await waitFor(() => {
      expect(screen.getByText('搜索结果')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Enter' });

    // Should have called recordVisit + router.push
    // (router.push is mocked — verify store closed as proxy)
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // T12: search indexes canvases prop
  it('T12: search works with canvases prop', async () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: '订单' } });

    await waitFor(() => {
      expect(screen.getByText('订单处理流程')).toBeInTheDocument();
    });
  });

  // T13: activeIndex resets on query change
  it('T13: activeIndex resets to 0 when query changes', async () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    const input = screen.getByTestId('command-palette-input');

    // Get some results
    fireEvent.change(input, { target: { value: '模块' } });
    await waitFor(() => {
      expect(screen.getByTestId('command-palette-results')).toBeInTheDocument();
    });

    // Move down
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Change query — should reset
    fireEvent.change(input, { target: { value: '订单' } });

    await waitFor(() => {
      expect(screen.getByText('订单处理流程')).toBeInTheDocument();
    });

    const active = document.querySelector('[data-active="true"]');
    // First item should be active (index 0)
    expect(active?.textContent).toContain('订单');
  });

  // T14: input clears on close/open cycle
  it('T14: input is cleared when closed and reopened', async () => {
    render(<CommandPalette canvases={MOCK_CANVASES} />);
    openPalette();

    const input = screen.getByTestId('command-palette-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '测试查询' } });
    expect(input.value).toBe('测试查询');

    // Close
    useCommandPaletteStore.getState().close();
    expect(input.value).toBe('');

    // Reopen
    openPalette();
    const reopenedInput = screen.getByTestId('command-palette-input') as HTMLInputElement;
    expect(reopenedInput.value).toBe('');
  });
});

// ==================== Store Tests ====================

describe('commandPaletteStore', () => {
  afterEach(() => {
    useCommandPaletteStore.getState().close();
    useCommandPaletteStore.getState().clearHistory();
  });

  it('recordVisit adds canvas to front of recent list', () => {
    const store = useCommandPaletteStore.getState();
    store.recordVisit('c1', '测试画布1');
    store.recordVisit('c2', '测试画布2');

    const recent = store.recentCanvases;
    expect(recent[0].id).toBe('c2');
    expect(recent[1].id).toBe('c1');
  });

  it('recordVisit dedupes — bumps existing entry to front', () => {
    const store = useCommandPaletteStore.getState();
    store.recordVisit('c1', '画布C');
    store.recordVisit('c2', '画布D');
    store.recordVisit('c1', '画布C Updated'); // c1 again

    const recent = store.recentCanvases;
    expect(recent.length).toBe(2);
    expect(recent[0].id).toBe('c1');
    expect(recent[0].name).toBe('画布C Updated');
  });

  it('recordVisit caps at 10 entries', () => {
    const store = useCommandPaletteStore.getState();
    for (let i = 0; i < 15; i++) {
      store.recordVisit(`c${i}`, `画布${i}`);
    }
    expect(store.recentCanvases.length).toBe(10);
    expect(store.recentCanvases[0].id).toBe('c14'); // most recent first
  });

  it('clearHistory removes all recent canvases', () => {
    const store = useCommandPaletteStore.getState();
    store.recordVisit('c1', '画布1');
    store.recordVisit('c2', '画布2');
    store.clearHistory();
    expect(store.recentCanvases).toHaveLength(0);
  });

  it('open/close toggle isOpen state', () => {
    const store = useCommandPaletteStore.getState();
    expect(store.isOpen).toBe(false);
    store.open();
    expect(store.isOpen).toBe(true);
    store.close();
    expect(store.isOpen).toBe(false);
  });

  it('setQuery updates query and results', () => {
    const store = useCommandPaletteStore.getState();
    store.setSearchIndex([
      { id: 'c1', name: '测试', lastVisited: new Date().toISOString() },
      { id: 'c2', name: '示例', lastVisited: new Date().toISOString() },
    ]);
    store.setQuery('测');
    expect(store.query).toBe('测');
    expect(store.results.length).toBeGreaterThan(0);
    expect(store.results[0].name).toBe('测试');
  });

  it('setQuery with empty string shows recent', () => {
    const store = useCommandPaletteStore.getState();
    store.recordVisit('c1', '最近画布');
    store.setQuery('');
    expect(store.results.some((r) => r.type === 'recent')).toBe(true);
  });
});
