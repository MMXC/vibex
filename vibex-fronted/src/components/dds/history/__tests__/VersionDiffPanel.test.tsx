/**
 * VersionDiffPanel — vitest tests
 * S84-E1: Canvas Version Diff
 * S86-E5: Add side-by-side two-column layout mode
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Mock diff data ────────────────────────────────────────────────────────────

const mockDiffData = {
  fromSnapshotId: 'snap-001',
  toSnapshotId: 'snap-002',
  mode: 'unidirectional' as const,
  fromName: 'v1.0.0',
  toName: 'v1.1.0',
  fromVersion: 1,
  toVersion: 2,
  diff: {
    added: [
      { nodeId: 'n3', name: 'NewComponent', type: 'component', changeType: 'added', after: { name: 'NewComponent', type: 'component' } },
      { nodeId: 'n4', name: 'Utils', type: 'module', changeType: 'added', after: { name: 'Utils', type: 'module' } },
    ],
    removed: [
      { nodeId: 'n1', name: 'OldComponent', type: 'component', changeType: 'removed', before: { name: 'OldComponent', type: 'component' } },
    ],
    modified: [
      {
        nodeId: 'n2',
        name: 'App',
        type: 'component',
        changeType: 'modified',
        before: { name: 'App', type: 'page' },
        after: { name: 'App', type: 'component' },
      },
    ],
    unchanged: 5,
    stats: { added: 2, removed: 1, modified: 1, unchanged: 5 },
  },
};

// ─── Mock store ────────────────────────────────────────────────────────────────

const mockStore = {
  isDiffPanelOpen: false,
  closeDiffPanel: vi.fn(),
  diffData: null,
  diffMode: 'unidirectional' as const,
  setDiffMode: vi.fn(),
  compareSnapshotId: null,
};

vi.mock('@/stores/dds/canvasTimelineStore', () => ({
  useCanvasTimelineStore: () => mockStore,
}));

// ─── Component import ─────────────────────────────────────────────────────────

let VersionDiffPanel: React.ComponentType<{
  projectId: string;
  currentSnapshotId: string | null;
  isLoading?: boolean;
  error?: string | null;
}>;

beforeEach(async () => {
  vi.clearAllMocks();
  mockStore.isDiffPanelOpen = false;
  mockStore.diffData = null;
  mockStore.diffMode = 'unidirectional';

  const mod = await import('@/components/dds/history/VersionDiffPanel');
  VersionDiffPanel = mod.VersionDiffPanel;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VersionDiffPanel — list mode (S84-E1)', () => {
  it('renders nothing when panel is closed', () => {
    mockStore.isDiffPanelOpen = false;
    const { container } = render(
      <VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders panel when open with diff data', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    expect(screen.getByTestId('version-diff-panel')).toBeInTheDocument();
    expect(screen.getByText('版本对比')).toBeInTheDocument();
  });

  it('shows correct diff stats', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    expect(screen.getByTestId('diff-stats')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('−1')).toBeInTheDocument();
    expect(screen.getByText('~1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows added nodes with green badge', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    const addedRows = screen.getAllByTestId('diff-row-added');
    expect(addedRows).toHaveLength(2);
    expect(addedRows[0]).toHaveTextContent('新增');
    expect(addedRows[0]).toHaveTextContent('NewComponent');
  });

  it('shows removed nodes with red badge', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    const removedRows = screen.getAllByTestId('diff-row-removed');
    expect(removedRows).toHaveLength(1);
    expect(removedRows[0]).toHaveTextContent('删除');
    expect(removedRows[0]).toHaveTextContent('OldComponent');
  });

  it('shows modified nodes with yellow badge and field changes', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    const modifiedRows = screen.getAllByTestId('diff-row-modified');
    expect(modifiedRows).toHaveLength(1);
    expect(modifiedRows[0]).toHaveTextContent('修改');
    expect(modifiedRows[0]).toHaveTextContent('App');
  });

  it('shows loading state', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = null;

    render(
      <VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" isLoading={true} />
    );

    expect(screen.getByTestId('diff-loading')).toBeInTheDocument();
    expect(screen.getByText('加载对比数据...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = null;

    render(
      <VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" error="Failed to load diff" />
    );

    expect(screen.getByTestId('diff-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load diff')).toBeInTheDocument();
  });

  it('calls closeDiffPanel when close button is clicked', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    fireEvent.click(screen.getByTestId('diff-close-btn'));
    expect(mockStore.closeDiffPanel).toHaveBeenCalledTimes(1);
  });

  it('shows no-changes message when all diff arrays are empty', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = {
      ...mockDiffData,
      diff: {
        added: [],
        removed: [],
        modified: [],
        unchanged: 10,
        stats: { added: 0, removed: 0, modified: 0, unchanged: 10 },
      },
    };

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    expect(screen.getByTestId('diff-no-changes')).toBeInTheDocument();
    expect(screen.getByText('两个版本完全相同，无变化')).toBeInTheDocument();
  });

  it('shows mode select when diff data is present', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    expect(screen.getByTestId('diff-mode-select')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '单向对比' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '双向对比' })).toBeInTheDocument();
  });

  it('shows snapshot labels when diff data is present', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    expect(screen.getByTestId('diff-snapshot-labels')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v1.1.0')).toBeInTheDocument();
  });
});

describe('VersionDiffPanel — side-by-side mode (S86-E5)', () => {
  it('renders view mode select with list and sideBySide options', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    expect(screen.getByTestId('diff-view-mode-select')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '列表视图' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '双栏对比' })).toBeInTheDocument();
  });

  it('defaults to list mode', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    const select = screen.getByTestId('diff-view-mode-select') as HTMLSelectElement;
    expect(select.value).toBe('list');
  });

  it('switches to side-by-side mode when selected', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    const select = screen.getByTestId('diff-view-mode-select');
    fireEvent.change(select, { target: { value: 'sideBySide' } });

    expect(screen.getByTestId('diff-side-by-side')).toBeInTheDocument();
  });

  it('renders side-by-side column headers with snapshot labels', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    // Switch to side-by-side mode
    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'sideBySide' } });

    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v1.1.0')).toBeInTheDocument();
    expect(screen.getByText('基准')).toBeInTheDocument();
    expect(screen.getByText('对比')).toBeInTheDocument();
  });

  it('renders left and right columns in side-by-side mode', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'sideBySide' } });

    expect(screen.getByTestId('diff-side-left')).toBeInTheDocument();
    expect(screen.getByTestId('diff-side-right')).toBeInTheDocument();
    expect(screen.getByTestId('diff-side-scroller')).toBeInTheDocument();
  });

  it('renders removed node in left column with red highlight', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'sideBySide' } });

    // OldComponent was removed — appears in left column with 移除 badge
    expect(screen.getByText('OldComponent')).toBeInTheDocument();
  });

  it('renders added nodes in right column with green highlight', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'sideBySide' } });

    // NewComponent was added — appears in right column
    expect(screen.getByText('NewComponent')).toBeInTheDocument();
  });

  it('renders modified node with orange badge in right column', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'sideBySide' } });

    // Right column has at least one row containing 修改 badge
    const rightRows = screen.getAllByTestId('diff-side-right-row');
    const rightText = rightRows.map(r => r.textContent).join(' ');
    expect(rightText).toContain('App');
    expect(rightText).toContain('修改');
  });

  it('shows empty cell (—) for nodes only in right column on left side', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'sideBySide' } });

    // Left column should have at least one empty cell marker for added nodes
    const leftColumn = screen.getByTestId('diff-side-left');
    expect(leftColumn.textContent).toContain('—');
  });

  it('switches back to list mode when list option selected', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = mockDiffData;

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    // Switch to side-by-side
    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'sideBySide' } });
    expect(screen.getByTestId('diff-side-by-side')).toBeInTheDocument();

    // Switch back to list
    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'list' } });
    expect(screen.queryByTestId('diff-side-by-side')).not.toBeInTheDocument();
    expect(screen.getByTestId('diff-stats')).toBeInTheDocument();
  });

  it('renders side-by-side mode even with empty diff', () => {
    mockStore.isDiffPanelOpen = true;
    mockStore.diffData = {
      ...mockDiffData,
      diff: {
        added: [],
        removed: [],
        modified: [],
        unchanged: 10,
        stats: { added: 0, removed: 0, modified: 0, unchanged: 10 },
      },
    };

    render(<VersionDiffPanel projectId="proj-1" currentSnapshotId="snap-001" />);

    fireEvent.change(screen.getByTestId('diff-view-mode-select'), { target: { value: 'sideBySide' } });

    // Renders container and column headers (snapshotLabels hidden in side-by-side)
    expect(screen.getByTestId('diff-side-by-side')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v1.1.0')).toBeInTheDocument();
  });
});
