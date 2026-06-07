/**
 * SnapshotManagerPanel.test.tsx — E5 (Sprint75) Snapshot Manager Panel Tests
 *
 * Zustand mock pattern: create a real Zustand store with `create` from zustand.
 * Pre-populate snapshots BEFORE render (simulates prior store actions like saveSnapshot).
 * The component's useEffect calls listSnapshots but listSnapshots returns data without
 * calling set() — so snapshots must already be in the store state before mount.
 *
 * The key insight: listSnapshots() in the real store does NOT call set({snapshots}).
 * It returns data from IndexedDB. The Zustand store's snapshots field is populated
 * by OTHER actions (saveSnapshot, deleteSnapshot, etc.) BEFORE listSnapshots is called.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { create } from 'zustand';

interface MockSnapshot {
  id: string;
  name: string;
  timestamp: number;
  data: { nodes: unknown[] };
  isStarred?: boolean;
  branchName?: string;
}

const SNAPSHOTS: MockSnapshot[] = [
  {
    id: 'snap-1',
    name: 'Working Draft',
    timestamp: 1718000000000,
    data: { nodes: [{ id: 'n1' }, { id: 'n2' }] },
    isStarred: true,
    branchName: 'main',
  },
  {
    id: 'snap-2',
    name: 'After refactor',
    timestamp: 1718001000000,
    data: { nodes: [{ id: 'n1' }, { id: 'n3' }] },
  },
  {
    id: 'snap-3',
    name: 'Final version',
    timestamp: 1718002000000,
    data: { nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }] },
    branchName: 'feature-x',
  },
];

// Create a real Zustand store for the mock
// This gives us the real Zustand subscription/re-render mechanism
const mockHistoryStore = create<Record<string, unknown>>((set) => ({
  snapshots: [] as MockSnapshot[],
  // Must be 'test-canvas' to match canvasId prop — component uses prop when provided
  canvasId: 'test-canvas',
  listSnapshots: vi.fn<(canvasId: string) => Promise<MockSnapshot[]>>(),
  deleteSnapshots: vi.fn<() => Promise<void>>(),
  restoreSnapshot: vi.fn<() => Promise<void>>(),
  restoringSnapshotId: null,
  saveSnapshot: vi.fn(),
  loadSnapshot: vi.fn(),
  deleteSnapshot: vi.fn(),
  setRestoringSnapshotId: vi.fn(),
  compareSnapshots: vi.fn(),
  updateSnapshotMetadata: vi.fn(),
  autoSnapshotMs: null,
  startAutoSnapshot: vi.fn(),
  stopAutoSnapshot: vi.fn(),
  saveNamedSnapshot: vi.fn(),
  createBranch: vi.fn(),
  renameBranch: vi.fn(),
  deleteBranch: vi.fn(),
  mergeBranch: vi.fn(),
  compareBranches: vi.fn(),
  past: [],
  future: [],
  isPerforming: false,
  baseRevision: 0,
  onRevisionConflict: null,
}));

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = mockHistoryStore.getState();
    if (selector) return selector(state);
    return state;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockHistoryStore.setState({
    snapshots: [],
    restoringSnapshotId: null,
    listSnapshots: vi.fn<(canvasId: string) => Promise<MockSnapshot[]>>().mockResolvedValue([]),
    deleteSnapshots: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    restoreSnapshot: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  });
});

let SnapshotManagerPanel: ComponentType<{ canvasId: string }>;
beforeAll(async () => {
  const mod = await import('@/components/dds/history/SnapshotManagerPanel');
  SnapshotManagerPanel = mod.SnapshotManagerPanel;
});

describe('SnapshotManagerPanel', () => {
  it('renders empty state when no snapshots', () => {
    render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/暂无快照/i)).toBeInTheDocument();
  });

  it('batch delete button absent when nothing selected', async () => {
    // Pre-populate Zustand store with snapshots (simulates prior saveSnapshot actions)
    mockHistoryStore.setState({ snapshots: SNAPSHOTS });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /批量删除/i })).not.toBeInTheDocument();
    unmount();
  });

  it('renders snapshot count in header', async () => {
    mockHistoryStore.setState({ snapshots: SNAPSHOTS });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();
    unmount();
  });

  it('shows selection count when items are selected', async () => {
    mockHistoryStore.setState({ snapshots: SNAPSHOTS });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /选择快照 Working Draft/i });
    await userEvent.setup().click(checkbox);
    expect(screen.getByText(/已选 1 项/i)).toBeInTheDocument();
    unmount();
  });

  it('batch delete button shows selection count', async () => {
    mockHistoryStore.setState({ snapshots: SNAPSHOTS });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('checkbox', { name: /选择快照 Working Draft/i }));
    await userEvent.setup().click(screen.getByRole('checkbox', { name: /选择快照 After refactor/i }));
    expect(screen.getByRole('button', { name: /批量删除 2 个快照/i })).toBeInTheDocument();
    unmount();
  });

  it('calls deleteSnapshots with selected ids on batch delete', async () => {
    const deleteSpy = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    mockHistoryStore.setState({ snapshots: SNAPSHOTS, deleteSnapshots: deleteSpy });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('checkbox', { name: /选择快照 Working Draft/i }));
    await userEvent.setup().click(screen.getByRole('button', { name: /批量删除 1 个快照/i }));
    expect(deleteSpy).toHaveBeenCalledWith('test-canvas', ['snap-1']);
    unmount();
  });

  it('calls restoreSnapshot on restore button click', async () => {
    const restoreSpy = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    mockHistoryStore.setState({ snapshots: SNAPSHOTS, restoreSnapshot: restoreSpy });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /恢复 Working Draft/i }));
    expect(restoreSpy).toHaveBeenCalledWith('test-canvas', 'snap-1');
    unmount();
  });

  it('shows starred indicator for starred snapshots', async () => {
    mockHistoryStore.setState({ snapshots: SNAPSHOTS });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText('★')).toBeInTheDocument();
    unmount();
  });

  it('select all toggles all selections', async () => {
    mockHistoryStore.setState({ snapshots: SNAPSHOTS });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('checkbox', { name: /全选/i }));
    expect(screen.getByText(/已选 3 项/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /批量删除 3 个快照/i })).toBeInTheDocument();
    unmount();
  });

  it('refresh button calls listSnapshots', async () => {
    const listSpy = vi.fn<(canvasId: string) => Promise<MockSnapshot[]>>().mockResolvedValue(SNAPSHOTS);
    mockHistoryStore.setState({ snapshots: SNAPSHOTS, listSnapshots: listSpy });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /刷新/i }));
    expect(listSpy).toHaveBeenCalledWith('test-canvas');
    unmount();
  });

  it('renders snapshot names correctly', async () => {
    mockHistoryStore.setState({ snapshots: SNAPSHOTS });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();

    expect(screen.getByText('Working Draft')).toBeInTheDocument();
    expect(screen.getByText('After refactor')).toBeInTheDocument();
    expect(screen.getByText('Final version')).toBeInTheDocument();
    unmount();
  });

  it('shows node count in metadata', async () => {
    mockHistoryStore.setState({ snapshots: SNAPSHOTS });
    const { unmount } = render(<SnapshotManagerPanel canvasId="test-canvas" />);
    expect(screen.getByText(/3 个快照/i)).toBeInTheDocument();

    expect(screen.getAllByText('2 个节点').length).toBeGreaterThanOrEqual(1);
    unmount();
  });
});
