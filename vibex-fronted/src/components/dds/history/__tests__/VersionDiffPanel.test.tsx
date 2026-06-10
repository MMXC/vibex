/**
 * VersionDiffPanel — vitest tests
 * S84-E1: Canvas Version Diff
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

// ─── Tests ────────────────────────────────────────────────────────────────────

// Dynamic import after mocking
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

  // Re-import to get fresh component with current mock
  const mod = await import('@/components/dds/history/VersionDiffPanel');
  VersionDiffPanel = mod.VersionDiffPanel;
});

describe('VersionDiffPanel', () => {
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
    // Stats display: +2, -1, ~1, 5
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
