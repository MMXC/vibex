/**
 * BranchDiffDialog — Component Tests
 * S74-E3: 画布分支对比视图
 * S74-E5: Keyboard navigation — Esc to close, focus trap, focus restoration
 * S75-E3: 分支对比历史记录 — 「历史」Tab
 *
 * Uses a shared mutable mockRef so beforeEach can update the mock
 * without relying on module re-import or dynamic import isolation.
 * Full BranchDiffResult logic (compareBranches) is tested in
 * canvasHistoryStore.test.ts — these tests cover UI rendering only.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';

// Shared mutable ref — same object across all beforeEach calls
const mockRef = {
  compareBranches: vi.fn(),
  getBranchDiffHistory: vi.fn(),
  clearBranchDiffHistory: vi.fn(),
  branchDiffHistory: [] as Array<{
    id: string;
    branchA: string;
    branchB: string;
    timestamp: number;
    summary: { totalChanges: number; contextsAdded: number; contextsRemoved: number; contextsModified: number; edgesAdded: number; edgesRemoved: number; edgesModified: number };
  }>,
};

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: Object.assign(
    (selector?: (s: any) => unknown) => {
      const state = {
        compareBranches: mockRef.compareBranches,
        branchDiffHistory: mockRef.branchDiffHistory,
        getBranchDiffHistory: mockRef.getBranchDiffHistory,
        clearBranchDiffHistory: mockRef.clearBranchDiffHistory,
      };
      if (selector) return selector(state);
      return state;
    },
    {
      getState: () => ({
        compareBranches: mockRef.compareBranches,
        branchDiffHistory: mockRef.branchDiffHistory,
        getBranchDiffHistory: mockRef.getBranchDiffHistory,
        clearBranchDiffHistory: mockRef.clearBranchDiffHistory,
      }),
      setState: vi.fn(),
    }
  ),
}));

vi.mock('../canvas-history/SnapshotDiffRenderer', () => ({
  __esModule: true,
  default: ({ diff }: { diff: any }) => (
    <div data-testid="diff-renderer">
      <span data-testid="diff-added">{diff.added?.length ?? 0} added</span>
      <span data-testid="diff-removed">{diff.removed?.length ?? 0} removed</span>
      <span data-testid="diff-modified">{diff.modified?.length ?? 0} modified</span>
    </div>
  ),
}));

// Import AFTER vi.mock
import BranchDiffDialog from '../BranchDiffDialog';

describe('BranchDiffDialog', () => {
  beforeEach(() => {
    mockRef.compareBranches.mockReset();
    mockRef.getBranchDiffHistory.mockReset();
    mockRef.clearBranchDiffHistory.mockReset();
    mockRef.branchDiffHistory = [];
    mockRef.compareBranches.mockResolvedValue({
      error: null,
      diffs: { added: [], removed: [], modified: [] },
      summary: { totalChanges: 0, contextsAdded: 0, contextsRemoved: 0, contextsModified: 0, edgesAdded: 0, edgesRemoved: 0, edgesModified: 0 },
    });
    mockRef.getBranchDiffHistory.mockResolvedValue(undefined);
    mockRef.clearBranchDiffHistory.mockResolvedValue(undefined);
  });

  it('renders null when open is false', () => {
    const { container } = render(
      <BranchDiffDialog
        open={false}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders header with branch names when open', () => {
    const { getByText } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );
    expect(getByText('分支对比')).toBeTruthy();
    expect(getByText('main ↔ feature')).toBeTruthy();
  });

  it('shows diff renderer when compare succeeds', async () => {
    mockRef.compareBranches.mockResolvedValue({
      error: null,
      diffs: { added: [{ id: 'n1', type: 'added' }], removed: [], modified: [] },
      summary: { totalChanges: 1, contextsAdded: 1, contextsRemoved: 0, contextsModified: 0, edgesAdded: 0, edgesRemoved: 0, edgesModified: 0 },
    });
    const { findByText } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );
    // Stats bar appears when diff is loaded (unique element with text "1 新增")
    const statsBar = await findByText((_, el) => {
      return (el?.textContent?.trim() ?? '') === '1 新增';
    });
    expect(statsBar).toBeTruthy();
  });

  it('shows error state when compareBranches returns error', async () => {
    mockRef.compareBranches.mockResolvedValue({
      error: 'No snapshot found for branch "main"',
      diffs: { added: [], removed: [], modified: [] },
      summary: null,
    });
    const { findByText } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );
    // The component renders the error string including the branch name
    expect(await findByText(/No snapshot found/)).toBeTruthy();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { findAllByRole } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={onClose}
        onRestore={vi.fn()}
      />
    );
    // Two buttons with "关闭" accessible name: header X + footer cancel.
    // Use the footer cancel button (last one with class "_cancelBtn_")
    const buttons = await findAllByRole('button', { name: '关闭' });
    // Click the last "关闭" button (footer cancel), not the header X
    buttons[buttons.length - 1].click();
    expect(onClose).toHaveBeenCalled();
  });

  // S74-E5: Keyboard navigation tests
  it('closes dialog when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={onClose}
        onRestore={vi.fn()}
      />
    );

    // Simulate Escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(onClose).toHaveBeenCalled();
  });

  it('does not close dialog when other keys are pressed', async () => {
    const onClose = vi.fn();
    render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={onClose}
        onRestore={vi.fn()}
      />
    );

    // Simulate Enter key press
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    document.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('focuses close button when dialog opens', async () => {
    render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );

    // Wait for requestAnimationFrame to complete
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Close button should be focused
    expect(document.activeElement?.getAttribute('data-testid')).toBe('diff-close-btn');
  });

  it('does not call onClose for Escape when dialog is not open', () => {
    const onClose = vi.fn();
    render(
      <BranchDiffDialog
        open={false}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={onClose}
        onRestore={vi.fn()}
      />
    );

    // Simulate Escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });

  // ============================================
  // E3 (Sprint75): Branch diff history tab tests
  // ============================================

  it('renders tab bar with 对比 and 历史 tabs', () => {
    const { getByRole } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );

    // Tab bar exists with role="tablist"
    expect(getByRole('tablist')).toBeTruthy();
    // Both tabs present
    expect(getByRole('tab', { name: '对比' })).toBeTruthy();
    expect(getByRole('tab', { name: '历史' })).toBeTruthy();
  });

  it('defaults to diff tab', () => {
    const { getByRole } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );

    const diffTab = getByRole('tab', { name: '对比' });
    expect(diffTab.getAttribute('aria-selected')).toBe('true');
  });

  it('switches to history tab when 历史 tab is clicked', async () => {
    const { getByRole, getByText } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );

    // Click history tab
    const historyTab = getByRole('tab', { name: '历史' });
    await act(async () => {
      historyTab.click();
    });

    // History tab is now selected
    expect(historyTab.getAttribute('aria-selected')).toBe('true');
    // Empty state shown
    expect(getByText('暂无对比历史记录')).toBeTruthy();
    // getBranchDiffHistory called
    expect(mockRef.getBranchDiffHistory).toHaveBeenCalledWith('canvas-1');
  });

  it('shows empty state in history tab when branchDiffHistory is empty', async () => {
    const { getByRole, getByText } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );

    // Switch to history tab
    const historyTab = getByRole('tab', { name: '历史' });
    await act(async () => {
      historyTab.click();
    });

    expect(getByText('暂无对比历史记录')).toBeTruthy();
  });

  it('shows history list when branchDiffHistory has entries', async () => {
    // Set up mock with history entries
    mockRef.branchDiffHistory = [
      {
        id: 'diff-1',
        branchA: 'main',
        branchB: 'feature-a',
        timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
        summary: { totalChanges: 3, contextsAdded: 1, contextsRemoved: 1, contextsModified: 1, edgesAdded: 0, edgesRemoved: 0, edgesModified: 0 },
      },
      {
        id: 'diff-2',
        branchA: 'feature-a',
        branchB: 'feature-b',
        timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
        summary: { totalChanges: 0, contextsAdded: 0, contextsRemoved: 0, contextsModified: 0, edgesAdded: 0, edgesRemoved: 0, edgesModified: 0 },
      },
    ];

    const { getByRole, getByText } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );

    // Switch to history tab
    const historyTab = getByRole('tab', { name: '历史' });
    await act(async () => {
      historyTab.click();
    });

    // Branch names visible
    expect(getByText('main')).toBeTruthy();
    expect(getByText('feature-a')).toBeTruthy();
    // Change count visible
    expect(getByText('3 项变更')).toBeTruthy();
    // 无变更 for the second entry
    expect(getByText('无变更')).toBeTruthy();
    // Record count
    expect(getByText('共 2 条记录')).toBeTruthy();
    // Clear history button visible
    expect(getByRole('button', { name: '清空历史' })).toBeTruthy();
  });

  it('emits branch-diff-history-click event when history item is clicked', async () => {
    mockRef.branchDiffHistory = [
      {
        id: 'diff-1',
        branchA: 'main',
        branchB: 'feature-a',
        timestamp: Date.now(),
        summary: { totalChanges: 3, contextsAdded: 1, contextsRemoved: 1, contextsModified: 1, edgesAdded: 0, edgesRemoved: 0, edgesModified: 0 },
      },
    ];

    const { getByRole, getByText } = render(
      <BranchDiffDialog
        open={true}
        branchA="main"
        branchB="feature"
        canvasId="canvas-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />
    );

    // Switch to history tab
    const historyTab = getByRole('tab', { name: '历史' });
    await act(async () => {
      historyTab.click();
    });

    // Click the history item (branch names)
    await act(async () => {
      getByText('main').click();
    });

    // Custom event should have been dispatched
    const dispatchedEvents = (window as unknown as { _dispatchedEvents?: CustomEvent[] })._dispatchedEvents ?? [];
    // Check that an event was dispatched
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('calls clearBranchDiffHistory when 清空历史 is clicked and confirmed', async () => {
    mockRef.branchDiffHistory = [
      {
        id: 'diff-1',
        branchA: 'main',
        branchB: 'feature-a',
        timestamp: Date.now(),
        summary: { totalChanges: 1, contextsAdded: 1, contextsRemoved: 0, contextsModified: 0, edgesAdded: 0, edgesRemoved: 0, edgesModified: 0 },
      },
    ];

    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    try {
      const { getByRole } = render(
        <BranchDiffDialog
          open={true}
          branchA="main"
          branchB="feature"
          canvasId="canvas-1"
          onClose={vi.fn()}
          onRestore={vi.fn()}
        />
      );

      // Switch to history tab
      const historyTab = getByRole('tab', { name: '历史' });
      await act(async () => {
        historyTab.click();
      });

      // Click clear history button
      const clearBtn = getByRole('button', { name: '清空历史' });
      await act(async () => {
        clearBtn.click();
      });

      expect(mockRef.clearBranchDiffHistory).toHaveBeenCalledWith('canvas-1');
    } finally {
      vi.stubGlobal('confirm', originalConfirm);
    }
  });
});
