/**
 * VersionTimeline.test.tsx — S83-E1: 画布版本历史时间轴
 * Tests: zoom controls, branch filter, snapshot rendering, actions
 *
 * Pattern A: mock zustand/middleware (avoids vi.mock hoisting TDZ issue entirely)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';
import VersionTimeline from '../VersionTimeline';

// Module-level mutable mock functions — defined BEFORE vi.mock so factory can close over them
let mockSetZoomLevel = vi.fn();
let mockSetActiveBranch = vi.fn();
let mockSetSelectedRange = vi.fn();
let mockSetPreviewSnapshotId = vi.fn();
let mockZoomIn = vi.fn();
let mockZoomOut = vi.fn();
let mockState = {
  zoomLevel: 'day' as const,
  setZoomLevel: (level: any) => { mockState.zoomLevel = level; mockSetZoomLevel(level); },
  zoomIn: () => mockZoomIn(),
  zoomOut: () => mockZoomOut(),
  activeBranch: null as string | null,
  setActiveBranch: (branch: any) => { mockState.activeBranch = branch; mockSetActiveBranch(branch); },
  selectedRange: null,
  setSelectedRange: (range: any) => { mockState.selectedRange = range; mockSetSelectedRange(range); },
  previewSnapshotId: null,
  setPreviewSnapshotId: (id: any) => { mockState.previewSnapshotId = id; mockSetPreviewSnapshotId(id); },
  snapshots: [] as Snapshot[],
};

vi.mock('zustand', async () => {
  const actual = await import('zustand');
  return {
    ...actual,
    create: () => {
      return Object.assign(
        (selector?: (s: typeof mockState) => unknown) => {
          return selector ? selector(mockState) : mockState;
        },
        {
          getState: () => mockState,
          setState: (updates: Partial<typeof mockState>) => {
            Object.assign(mockState, updates);
          },
          subscribe: () => () => {},
        }
      );
    },
  };
});

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: vi.fn(() => ({
    past: [],
    future: [],
  })),
}));

const now = Date.now();

const createSnapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  id: 'snap-1',
  name: '初始版本',
  timestamp: now - 3600000,
  branchName: 'main',
  isStarred: false,
  data: { nodes: [{ id: 'n1', label: 'A' }], edges: [] },
  ...overrides,
});

const mockOnSelect = vi.fn();
const mockOnStar = vi.fn();
const mockOnCompare = vi.fn();
const mockOnRestore = vi.fn();
const mockOnDelete = vi.fn();

function renderTimeline(snapshots: Snapshot[] = []) {
  return render(
    <VersionTimeline
      snapshots={snapshots}
      selectedId={null}
      onSelect={mockOnSelect}
      onStar={mockOnStar}
      onCompare={mockOnCompare}
      onRestore={mockOnRestore}
      onDelete={mockOnDelete}
    />
  );
}

function setMockTimelineState(overrides: Partial<{
  zoomLevel: 'hour' | 'day' | 'week' | 'month';
  activeBranch: string | null;
  snapshots: Snapshot[];
}>) {
  if (overrides.zoomLevel !== undefined) mockState.zoomLevel = overrides.zoomLevel;
  if (overrides.activeBranch !== undefined) mockState.activeBranch = overrides.activeBranch;
  if (overrides.snapshots !== undefined) mockState.snapshots = overrides.snapshots;
}

beforeEach(() => {
  // Reset mock state to defaults
  mockState.zoomLevel = 'day';
  mockState.activeBranch = null;
  mockState.snapshots = [];
  mockSetZoomLevel.mockReset();
  mockSetActiveBranch.mockReset();
  mockSetSelectedRange.mockReset();
  mockSetPreviewSnapshotId.mockReset();
  mockZoomIn.mockReset();
  mockZoomOut.mockReset();
  mockOnSelect.mockReset();
  mockOnStar.mockReset();
  mockOnCompare.mockReset();
  mockOnRestore.mockReset();
  mockOnDelete.mockReset();
});

describe('VersionTimeline', () => {
  describe('empty state', () => {
    it('renders empty state when no snapshots', () => {
      renderTimeline([]);
      expect(screen.getByText('暂无快照')).toBeInTheDocument();
    });
  });

  describe('zoom controls', () => {
    it('renders all zoom level buttons', () => {
      renderTimeline([createSnapshot()]);
      expect(screen.getByRole('button', { name: '缩放到1小时' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '缩放到1天' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '缩放到1周' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '缩放到1月' })).toBeInTheDocument();
    });

    it('calls setZoomLevel when zoom button is clicked', () => {
      renderTimeline([createSnapshot()]);
      fireEvent.click(screen.getByRole('button', { name: '缩放到1周' }));
      expect(mockSetZoomLevel).toHaveBeenCalledWith('week');
    });

    it('highlights the active zoom level button', () => {
      renderTimeline([createSnapshot()]);
      expect(screen.getByRole('button', { name: '缩放到1天' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onZoomChange callback when zoom changes', () => {
      const onZoomChange = vi.fn();
      render(
        <VersionTimeline
          snapshots={[createSnapshot()]}
          selectedId={null}
          onSelect={vi.fn()}
          onStar={vi.fn()}
          onCompare={vi.fn()}
          onRestore={vi.fn()}
          onDelete={vi.fn()}
          onZoomChange={onZoomChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: '缩放到1月' }));
      expect(onZoomChange).toHaveBeenCalledWith('month');
    });
  });

  describe('timeline rendering', () => {
    it('renders snapshot cards with name and timestamp', () => {
      // Use 1hr ago to safely be within 'day' zoom window (avoids Date.now() timing edge case)
      renderTimeline([createSnapshot({ name: '测试版本', timestamp: now - 3600000 })]);
      expect(screen.getByText('测试版本')).toBeInTheDocument();
    });

    it('renders snapshot count', () => {
      renderTimeline([
        createSnapshot({ id: 'snap-1', timestamp: now - 3600000 }),
        createSnapshot({ id: 'snap-2', timestamp: now - 7200000 }),
      ]);
      expect(screen.getByText(/\d+ \/ \d+ 个快照/)).toBeInTheDocument();
    });

    it('shows branch badge for non-main branches', () => {
      renderTimeline([createSnapshot({ branchName: 'feature-x', timestamp: now - 3600000 })]);
      expect(screen.getByText('feature-x')).toBeInTheDocument();
    });

    it('shows starred indicator for starred snapshots', () => {
      renderTimeline([createSnapshot({ isStarred: true, timestamp: now - 3600000 })]);
      // Both the dot and button show ★, use getAllByText
      expect(screen.getAllByText('★').length).toBeGreaterThan(0);
    });

    it('shows node and edge counts in card', () => {
      const snap = createSnapshot({ data: { nodes: [{ id: 'n1' }, { id: 'n2' }], edges: [{ id: 'e1' }] }, timestamp: now - 3600000 });
      renderTimeline([snap]);
      expect(screen.getByText(/\d+ 节点/)).toBeInTheDocument();
      expect(screen.getByText(/\d+ 边/)).toBeInTheDocument();
    });

    it('shows "当前" label for the first (most recent) snapshot', () => {
      const snaps = [
        createSnapshot({ id: 's1', name: 'Current', timestamp: now }),
        createSnapshot({ id: 's2', name: 'Old', timestamp: now - 3600000 }),
      ];
      renderTimeline(snaps);
      expect(screen.getByText('当前')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('calls onSelect when card is clicked', () => {
      const snap = createSnapshot();
      renderTimeline([snap]);
      fireEvent.click(screen.getByRole('button', { name: /快照: / }));
      expect(mockOnSelect).toHaveBeenCalledWith(snap);
    });

    it('calls onStar when star button is clicked', () => {
      const snap = createSnapshot({ id: 'snap-star', name: 'Test' });
      renderTimeline([snap]);
      fireEvent.click(screen.getByRole('button', { name: '收藏' }));
      expect(mockOnStar).toHaveBeenCalledWith(snap);
    });

    it('calls onCompare when compare button is clicked', () => {
      // Pass [newer, older] so filtered=[newer, older], oldSnap is index1 (isFirst=false → compare shows)
      const newSnap = createSnapshot({ id: 'new-snap', name: 'Newest', timestamp: now });
      const oldSnap = createSnapshot({ id: 'old-snap', timestamp: now - 3600000 });
      renderTimeline([newSnap, oldSnap]);
      fireEvent.click(screen.getAllByRole('button', { name: '与当前对比' })[0]);
      expect(mockOnCompare).toHaveBeenCalledWith(oldSnap);
    });

    it('calls onRestore when restore button is clicked', () => {
      // Second snapshot is first in filtered (more recent), first snapshot gets restore button
      const snaps = [
        createSnapshot({ id: 'old-snap', name: 'Old', timestamp: now - 3600000 }),
        createSnapshot({ id: 'current', name: 'Active', timestamp: now }),
      ];
      renderTimeline(snaps);
      fireEvent.click(screen.getByRole('button', { name: '恢复到此版本' }));
      expect(mockOnRestore).toHaveBeenCalled();
    });

    it('calls onDelete when delete button is clicked', () => {
      // Second snapshot is first in filtered (more recent), first snapshot gets delete button
      const snaps = [
        createSnapshot({ id: 'old-snap', name: 'Old', timestamp: now - 3600000 }),
        createSnapshot({ id: 'current', name: 'Active', timestamp: now }),
      ];
      renderTimeline(snaps);
      fireEvent.click(screen.getByRole('button', { name: '删除快照' }));
      expect(mockOnDelete).toHaveBeenCalled();
    });

    it('does not show restore/delete buttons for the first snapshot', () => {
      const snap = createSnapshot({ id: 'current', timestamp: now }); // most recent = first in filtered
      renderTimeline([snap]);
      expect(screen.queryByRole('button', { name: '恢复到此版本' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '删除快照' })).not.toBeInTheDocument();
    });

    it('shows compare button only for non-first snapshots', () => {
      // Second snapshot is more recent (first in filtered), first is older (non-first = compare shows)
      const snaps = [
        createSnapshot({ id: 'old-snap', name: 'Old', timestamp: now - 3600000 }),
        createSnapshot({ id: 'current', name: 'Active', timestamp: now }),
      ];
      renderTimeline(snaps);
      expect(screen.getAllByRole('button', { name: '与当前对比' })).toHaveLength(1);
    });
  });

  describe('keyboard interaction', () => {
    it('calls onSelect when Enter key is pressed on card', () => {
      const snap = createSnapshot();
      renderTimeline([snap]);
      const card = screen.getByRole('button', { name: /快照: / });
      card.focus();
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith(snap);
    });
  });

  describe('branch filter', () => {
    it('shows branch select when multiple branches exist', () => {
      setMockTimelineState({ activeBranch: null });
      const snaps = [
        createSnapshot({ id: 'main-snap', name: 'Main branch snap' }),
        createSnapshot({ id: 'feature-snap', name: 'Feature branch snap', branchName: 'feature-a' }),
      ];
      renderTimeline(snaps);
      expect(screen.getByLabelText('筛选分支')).toBeInTheDocument();
    });

    it('calls setActiveBranch when branch is selected', () => {
      setMockTimelineState({ activeBranch: null });
      const snaps = [
        createSnapshot({ id: 'main-snap', name: 'Main snap', branchName: 'main' }),
        createSnapshot({ id: 'feature-snap', name: 'Feature snap', branchName: 'feature-a' }),
      ];
      renderTimeline(snaps);
      fireEvent.change(screen.getByLabelText('筛选分支'), { target: { value: 'feature-a' } });
      expect(mockSetActiveBranch).toHaveBeenCalledWith('feature-a');
    });
  });
});
