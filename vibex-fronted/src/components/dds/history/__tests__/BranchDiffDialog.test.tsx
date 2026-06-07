/**
 * BranchDiffDialog — Component Tests
 * S74-E3: 画布分支对比视图
 *
 * Uses a shared mutable mockRef so beforeEach can update the mock
 * without relying on module re-import or dynamic import isolation.
 * Full BranchDiffResult logic (compareBranches) is tested in
 * canvasHistoryStore.test.ts — these tests cover UI rendering only.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Shared mutable ref — same object across all beforeEach calls
const mockRef = {
  compareBranches: vi.fn(),
};

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: Object.assign(
    (selector?: (s: any) => unknown) => {
      if (selector) return selector({ compareBranches: mockRef.compareBranches });
      return { compareBranches: mockRef.compareBranches };
    },
    {
      getState: () => ({ compareBranches: mockRef.compareBranches }),
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
    mockRef.compareBranches.mockResolvedValue({
      error: null,
      diffs: { added: [], removed: [], modified: [] },
      summary: { totalChanges: 0, contextsAdded: 0, contextsRemoved: 0, contextsModified: 0, edgesAdded: 0, edgesRemoved: 0, edgesModified: 0 },
    });
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
});
