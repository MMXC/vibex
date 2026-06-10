/**
 * MergePreviewPanel.test.tsx — S85-E4
 * Tests for MergePreviewPanel — renders branch merge preview, executes merge.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { create } from 'zustand';
import React from 'react';
import { MergePreviewPanel } from '../MergePreviewPanel';

// --- Mock historyDB type ---
vi.mock('@/lib/canvas/historyDB', () => ({
  type: { Snapshot: {} },
}));

// --- Mock fetch globally ---
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// --- Pattern F: real Zustand create() store for mock ---
type Snapshot = { id: string; canvasId: string; branchName: string; timestamp: number };

const mockMergeBranch = vi.fn<
  [string, string, string, string],
  Promise<{ ok: boolean; error?: string }>
>();

const mockSnapshots: Snapshot[] = [];

const mockHistoryStore = create((set, get) => ({
  mergeBranch: mockMergeBranch,
  snapshots: mockSnapshots,
  // Minimal required state to satisfy store type
  past: [],
  future: [],
  history: [],
  currentIndex: -1,
  isPerforming: false,
  pendingChanges: null,
  pendingRevision: null,
  onRevisionConflict: null,
  restoringSnapshotId: null,
  pushCommand: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  clear: vi.fn(),
  restoreState: vi.fn(),
  // snapshots actions
  saveSnapshot: vi.fn(),
  loadSnapshot: vi.fn(),
  listSnapshots: vi.fn(),
  deleteSnapshot: vi.fn(),
  deleteSnapshots: vi.fn(),
  setRestoringSnapshotId: vi.fn(),
  compareSnapshots: vi.fn(),
  updateSnapshotMetadata: vi.fn(),
  // branch actions
  createBranch: vi.fn(),
  renameBranch: vi.fn(),
  deleteBranch: vi.fn(),
  // merge actions
  autoMergeBranch: vi.fn(),
  resolveBranchConflict: vi.fn(),
  clearPendingConflicts: vi.fn(),
  // other
  getMergeHistory: vi.fn(),
  mergeHistory: [],
  currentBranch: 'main',
  listBranches: vi.fn().mockResolvedValue(['main', 'feature-a']),
}));

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: Object.assign(
    (selector?: (s: ReturnType<typeof import('@/stores/dds/canvasHistoryStore').useCanvasHistoryStore.getState>) => unknown) => {
      if (typeof selector === 'function') return selector(mockHistoryStore.getState() as any);
      return mockHistoryStore.getState() as any;
    },
    { getState: () => mockHistoryStore.getState() }
  ),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector?: (s: { currentUser: { id: string } | null }) => unknown) =>
    selector ? selector({ currentUser: { id: 'test-user-1' } }) : { currentUser: { id: 'test-user-1' } },
}));

describe('MergePreviewPanel', () => {
  const defaultProps = {
    projectId: 'proj-1',
    sourceBranch: 'feature-a',
    targetBranch: 'main',
    canvasId: 'canvas-1',
    onClose: vi.fn(),
    onMerged: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMergeBranch.mockReset();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true } as Response);
    defaultProps.onClose.mockClear();
    defaultProps.onMerged.mockClear();
    // Reset snapshots to a known set
    mockHistoryStore.setState({ snapshots: [] } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Test 1: renders with branch names displayed ──────────────────────────
  it('renders with branch names displayed', () => {
    render(<MergePreviewPanel {...defaultProps} />);
    expect(screen.getByText('feature-a')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('合并预览')).toBeInTheDocument();
  });

  // ── Test 2: shows snapshot count from source branch ───────────────────────
  it('shows snapshot count from source branch', async () => {
    // Inject 3 snapshots on feature-a branch
    mockHistoryStore.setState({
      snapshots: [
        { id: 's1', canvasId: 'canvas-1', branchName: 'feature-a', timestamp: Date.now() },
        { id: 's2', canvasId: 'canvas-1', branchName: 'feature-a', timestamp: Date.now() },
        { id: 's3', canvasId: 'canvas-1', branchName: 'feature-a', timestamp: Date.now() },
        // Should be excluded (different branch)
        { id: 's4', canvasId: 'canvas-1', branchName: 'main', timestamp: Date.now() },
      ],
    } as any);

    render(<MergePreviewPanel {...defaultProps} />);

    // Snapshot count should appear after useEffect computes it
    await vi.waitFor(() => {
      // The count 3 appears inside <strong>; use getByRole to find the meta div
      const meta = screen.getByText((content) =>
        content.includes('源分支包含') && content.includes('个快照')
      );
      expect(meta.textContent).toContain('3');
    });
  });

  // ── Test 3: calls mergeBranch with correct args when Execute button clicked ─
  it('calls mergeBranch with correct args when Execute button clicked', async () => {
    const user = userEvent.setup();
    mockMergeBranch.mockResolvedValueOnce({ ok: true });

    render(<MergePreviewPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '执行合并' }));

    expect(mockMergeBranch).toHaveBeenCalledOnce();
    const [canvasId, sourceBranch, targetBranch, userId] = mockMergeBranch.mock.calls[0];
    expect(canvasId).toBe('canvas-1');
    expect(sourceBranch).toBe('feature-a');
    expect(targetBranch).toBe('main');
    expect(userId).toBe('test-user-1');
  });

  // ── Test 4: shows success message after successful merge ──────────────────
  it('shows success message after successful merge', async () => {
    const user = userEvent.setup();
    mockMergeBranch.mockResolvedValueOnce({ ok: true });

    render(<MergePreviewPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '执行合并' }));

    // Wait for fetch (audit log) to resolve
    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('✅ 合并成功！');
    });
  });

  // ── Test 5: shows error message after failed merge ────────────────────────
  it('shows error message after failed merge', async () => {
    const user = userEvent.setup();
    mockMergeBranch.mockResolvedValueOnce({ ok: false, error: '合并冲突：节点 node-42 已被修改' });

    render(<MergePreviewPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '执行合并' }));

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('❌ 合并失败：合并冲突：节点 node-42 已被修改');
    });
  });

  // ── Test 6: Merge button disabled while merging ───────────────────────────
  it('Merge button disabled while merging', async () => {
    const user = userEvent.setup();
    // Never resolve — button should become disabled immediately
    mockMergeBranch.mockImplementation(
      () => new Promise(() => {}) as any
    );

    render(<MergePreviewPanel {...defaultProps} />);

    const mergeBtn = screen.getByRole('button', { name: '执行合并' });
    await user.click(mergeBtn);

    // Button should be disabled (shows "合并中…")
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: '合并中…' })).toBeDisabled();
    });
  });

  // ── Test 7: onMerged called after successful merge ────────────────────────
  it('onMerged called after successful merge', async () => {
    const user = userEvent.setup();
    const onMerged = vi.fn();
    mockMergeBranch.mockResolvedValueOnce({ ok: true });

    render(<MergePreviewPanel {...defaultProps} onMerged={onMerged} />);

    await user.click(screen.getByRole('button', { name: '执行合并' }));

    await vi.waitFor(() => {
      expect(onMerged).toHaveBeenCalledOnce();
    });
  });

  // ── Test 8: onClose called when X button clicked ───────────────────────────
  it('onClose called when X button clicked', async () => {
    const user = userEvent.setup();
    render(<MergePreviewPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '关闭' }));

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  // ── Test 9: Cancel button calls onClose ───────────────────────────────────
  it('Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<MergePreviewPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '取消' }));

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  // ── Test 10: Merge button disabled after successful merge ────────────────
  it('Merge button disabled after successful merge', async () => {
    const user = userEvent.setup();
    mockMergeBranch.mockResolvedValueOnce({ ok: true });

    render(<MergePreviewPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '执行合并' }));

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: '执行合并' })).toBeDisabled();
    });
  });
});
