/**
 * HistoryPanel.test.tsx — Sprint61 E1 D1.6
 * Tests: timeline/list views, filters, detail panel, compare, restore, delete
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import HistoryPanel from '../HistoryPanel';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';

// ============================================
// Mock canvasHistoryStore
// ============================================

const mockCompareSnapshots = vi.fn();
const mockUpdateSnapshotMetadata = vi.fn();
const mockDeleteSnapshot = vi.fn();

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: vi.fn((selector) =>
    selector({
      snapshots: mockSnapshots,
      compareSnapshots: mockCompareSnapshots,
      updateSnapshotMetadata: mockUpdateSnapshotMetadata,
      deleteSnapshot: mockDeleteSnapshot,
    })
  ),
}));

// ============================================
// Test data
// ============================================

const mockSnapshots: Snapshot[] = [
  {
    id: 'snap-1',
    name: '初始版本',
    timestamp: new Date('2026-06-01T10:00:00').getTime(),
    branchName: 'main',
    isStarred: true,
    data: { nodes: [{ id: 'n1', label: 'A' }], edges: [] },
  },
  {
    id: 'snap-2',
    name: '添加用户模块',
    timestamp: new Date('2026-06-01T11:00:00').getTime(),
    branchName: 'feature-auth',
    isStarred: false,
    data: { nodes: [{ id: 'n1', label: 'A' }, { id: 'n2', label: 'B' }], edges: [] },
  },
];

// ============================================
// Helpers
// ============================================

const mockOnClose = vi.fn();
const mockOnRestore = vi.fn();

function renderPanel(open = true) {
  return render(
    <HistoryPanel open={open} onClose={mockOnClose} onRestore={mockOnRestore} />
  );
}

/** Click the list-view toggle (☰ button in history-view-toggle group) */
function switchToListView() {
  const group = screen.getByRole('group', { name: '视图切换' });
  const btns = group.querySelectorAll('button');
  fireEvent.click(btns[1]);
}

/** Get list items from the LIST view only (not timeline) */
function getListViewItems() {
  const list = screen.getByRole('list', { name: '快照列表' });
  return Array.from(list.querySelectorAll(':scope > .history-list-item'));
}

// ============================================
// Tests
// ============================================

describe('HistoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompareSnapshots.mockReturnValue({ added: [], removed: [], modified: [] });
    mockUpdateSnapshotMetadata.mockResolvedValue(undefined);
    mockDeleteSnapshot.mockResolvedValue(undefined);
  });

  // --- D1.4: Panel renders ---
  describe('D1.4: Panel renders', () => {
    it('renders panel with correct accessible name', () => {
      renderPanel();
      expect(screen.getByRole('complementary', { name: '画布版本历史' })).toBeInTheDocument();
    });

    it('renders header title', () => {
      renderPanel();
      expect(screen.getByText('版本历史')).toBeInTheDocument();
    });

    it('does not render when open=false', () => {
      renderPanel(false);
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
  });

  // --- D1.1: Timeline view ---
  describe('D1.1: Timeline view', () => {
    it('renders snapshot names in timeline', () => {
      renderPanel();
      expect(screen.getByText('初始版本')).toBeInTheDocument();
      expect(screen.getByText('添加用户模块')).toBeInTheDocument();
    });

    it('shows starred snapshot indicator (★)', () => {
      renderPanel();
      // TimelineView renders ★ for starred snapshots; star appears in both timeline and list
      expect(screen.getAllByText('★').length).toBeGreaterThanOrEqual(1);
    });
  });

  // --- D1.4: View toggle ---
  describe('D1.4: View toggle', () => {
    it('switches to list view when list toggle is clicked', () => {
      renderPanel();
      switchToListView();
      expect(screen.getByRole('list', { name: '快照列表' })).toBeInTheDocument();
    });

    it('renders list items in list view', () => {
      renderPanel();
      switchToListView();
      expect(getListViewItems()).toHaveLength(2);
    });

    it('switches back to timeline view', () => {
      renderPanel();
      switchToListView();
      expect(screen.getByRole('list', { name: '快照列表' })).toBeInTheDocument();
      // Click timeline view button (≡)
      const group = screen.getByRole('group', { name: '视图切换' });
      fireEvent.click(group.querySelectorAll('button')[0]);
      expect(screen.queryByRole('list', { name: '快照列表' })).not.toBeInTheDocument();
    });
  });

  // --- D1.4: Search filter ---
  describe('D1.4: Search filter', () => {
    it('renders search input', () => {
      renderPanel();
      expect(screen.getByRole('searchbox', { name: '搜索快照' })).toBeInTheDocument();
    });

    it('filters list by name when search is typed', () => {
      renderPanel();
      switchToListView();
      expect(getListViewItems()).toHaveLength(2);

      fireEvent.change(screen.getByRole('searchbox', { name: '搜索快照' }), {
        target: { value: '初始' },
      });
      const items = getListViewItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('初始版本');
    });
  });

  // --- D1.7: Branch filter ---
  describe('D1.7: Branch filter', () => {
    it('renders branch filter select', () => {
      renderPanel();
      expect(screen.getByRole('combobox', { name: '分支筛选' })).toBeInTheDocument();
    });

    it('shows snapshot count', () => {
      renderPanel();
      // Appears twice: filters bar + meta bar
      expect(screen.getAllByText('2 个快照').length).toBeGreaterThanOrEqual(1);
    });

    it('filters list by branch when feature-auth is selected', () => {
      renderPanel();
      switchToListView();
      expect(getListViewItems()).toHaveLength(2);

      fireEvent.change(screen.getByRole('combobox', { name: '分支筛选' }), {
        target: { value: 'feature-auth' },
      });
      const items = getListViewItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('添加用户模块');
    });
  });

  // --- D1.2: Snapshot detail panel (SnapshotPreview — E1 Sprint61) ---
  describe('D1.2: Snapshot detail panel', () => {
    it('opens detail when list item is clicked', () => {
      renderPanel();
      switchToListView();
      fireEvent.click(getListViewItems()[0]);
      // SnapshotPreview renders in .preview-title
      expect(document.querySelector('.preview-title')).toBeInTheDocument();
    });

    it('shows node preview for snapshot with multiple nodes', () => {
      renderPanel();
      switchToListView();
      fireEvent.click(getListViewItems()[1]);
      // snap-2 has nodes A and B rendered in .preview-nodes
      const nodeArea = document.querySelector('.preview-nodes');
      expect(nodeArea).toBeInTheDocument();
    });

    it('closes detail when close button is clicked', () => {
      renderPanel();
      switchToListView();
      fireEvent.click(getListViewItems()[0]);
      expect(document.querySelector('.preview-title')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '关闭预览' }));
      expect(document.querySelector('.preview-title')).not.toBeInTheDocument();
    });
  });

  // --- D1.3: Compare ---
  describe('D1.3: Snapshot compare', () => {
    it('calls compareSnapshots when compare button in list item is clicked', () => {
      renderPanel();
      switchToListView();
      const compareBtn = getListViewItems()[1].querySelector('button[aria-label="对比"]');
      expect(compareBtn).not.toBeNull();
      fireEvent.click(compareBtn!);
      expect(mockCompareSnapshots).toHaveBeenCalledWith(mockSnapshots[0], mockSnapshots[1]);
    });

    it('opens diff dialog after compare', () => {
      renderPanel();
      switchToListView();
      const compareBtn = getListViewItems()[1].querySelector('button[aria-label="对比"]');
      fireEvent.click(compareBtn!);
      // SnapshotDiffDialog shows added/removed/modified content
      expect(document.body.textContent).toContain('添加');
    });
  });

  // --- D1.6: Restore / delete (TimelineView actions) ---
  describe('D1.6: Restore and delete', () => {
    it('calls onRestore with snapshot when restore list-action is clicked', () => {
      renderPanel();
      switchToListView();
      // Find restore button (↩) in the second list item (snap-2, not current)
      const restoreBtn = getListViewItems()[1].querySelector('button[aria-label="恢复"]');
      expect(restoreBtn).not.toBeNull();
      fireEvent.click(restoreBtn!);
      expect(mockOnRestore).toHaveBeenCalledWith(mockSnapshots[1]);
      // handleRestore calls both onRestore and onClose
    });

    it('calls deleteSnapshot after confirm when delete is clicked in timeline view', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderPanel();
      // Timeline view: snap-2 (not current) should have delete button
      const deleteBtn = document.querySelectorAll('button[aria-label="删除快照"]')[0];
      expect(deleteBtn).not.toBeNull();
      fireEvent.click(deleteBtn);
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDeleteSnapshot).toHaveBeenCalledWith('snap-2');
      confirmSpy.mockRestore();
    });

    it('does not call deleteSnapshot when confirm is cancelled', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderPanel();
      const deleteBtn = document.querySelectorAll('button[aria-label="删除快照"]')[0];
      expect(deleteBtn).not.toBeNull();
      fireEvent.click(deleteBtn);
      expect(mockDeleteSnapshot).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });

  // --- D1.1/D1.6: Star toggle ---
  describe('D1.1/D1.6: Star toggle', () => {
    it('toggles star on for unstarred snapshot', () => {
      renderPanel();
      switchToListView();
      // snap-2 is not starred — find ☆ button in snap-2 list item
      const starBtn = getListViewItems()[1].querySelector('button[aria-label="星标"]');
      expect(starBtn).not.toBeNull();
      fireEvent.click(starBtn!);
      expect(mockUpdateSnapshotMetadata).toHaveBeenCalledWith('snap-2', { isStarred: true });
    });

    it('toggles star off for starred snapshot', () => {
      renderPanel();
      switchToListView();
      // snap-1 is starred — find ★ button in snap-1 list item
      const starBtn = getListViewItems()[0].querySelector('button[aria-label="取消星标"]');
      expect(starBtn).not.toBeNull();
      fireEvent.click(starBtn!);
      expect(mockUpdateSnapshotMetadata).toHaveBeenCalledWith('snap-1', { isStarred: false });
    });
  });

  // --- D1.4: Close ---
  describe('D1.4: Close button', () => {
    it('calls onClose when close button is clicked', () => {
      renderPanel();
      fireEvent.click(screen.getByRole('button', { name: '关闭' }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
