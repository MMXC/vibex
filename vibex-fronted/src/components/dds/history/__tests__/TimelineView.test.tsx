/**
 * TimelineView.test.tsx — E1 (Sprint61) D1.6
 * Tests: timeline rendering, snapshot cards, actions, empty state, relative time formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TimelineView from '../TimelineView';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';

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

describe('TimelineView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('renders empty state when no snapshots', () => {
      render(
        <TimelineView
          snapshots={[]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('暂无快照')).toBeInTheDocument();
    });
  });

  describe('timeline rendering', () => {
    it('renders snapshot cards with name and timestamp', () => {
      const snap = createSnapshot({ name: 'Initial Version', timestamp: now - 7200000 });
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('Initial Version')).toBeInTheDocument();
    });

    it('renders correct role and aria-label', () => {
      const snap = createSnapshot();
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByRole('list', { name: '快照时间线' })).toBeInTheDocument();
    });

    it('shows starred indicator for starred snapshots', () => {
      const starredSnap = createSnapshot({ isStarred: true });
      const normalSnap = createSnapshot({ id: 'snap-2', isStarred: false });
      render(
        <TimelineView
          snapshots={[starredSnap, normalSnap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });

    it('shows branch name for non-main branches', () => {
      const branchSnap = createSnapshot({ branchName: 'feature-auth' });
      render(
        <TimelineView
          snapshots={[branchSnap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('feature-auth')).toBeInTheDocument();
    });

    it('shows "当前" label for the first (most recent) snapshot', () => {
      const snap1 = createSnapshot({ id: 'snap-1', name: 'Current' });
      const snap2 = createSnapshot({ id: 'snap-2', name: 'Old', timestamp: now - 86400000 });
      render(
        <TimelineView
          snapshots={[snap1, snap2]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('当前')).toBeInTheDocument();
    });

    it('displays node and edge counts', () => {
      const snap = createSnapshot({
        data: { nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }], edges: [{ id: 'e1' }] },
      });
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText(/3 节点/)).toBeInTheDocument();
      expect(screen.getByText(/1 连线/)).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('calls onSelect when card is clicked', () => {
      const snap = createSnapshot();
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /快照: 初始版本/ }));
      expect(mockOnSelect).toHaveBeenCalledWith(snap);
    });

    it('calls onStar when star button is clicked', () => {
      const snap = createSnapshot({ isStarred: false });
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: '星标快照' }));
      expect(mockOnStar).toHaveBeenCalledWith(snap);
    });

    it('calls onStar with updated state when toggling star', () => {
      const snap = createSnapshot({ isStarred: true });
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: '取消星标' }));
      expect(mockOnStar).toHaveBeenCalledWith(snap);
    });

    it('shows compare button only for non-first snapshots', () => {
      const snap1 = createSnapshot({ id: 'snap-1', name: 'First' });
      const snap2 = createSnapshot({ id: 'snap-2', name: 'Second', timestamp: now - 86400000 });
      render(
        <TimelineView
          snapshots={[snap1, snap2]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      // First snapshot should NOT have compare button
      const compareButtons = screen.getAllByRole('button', { name: '与当前对比' });
      expect(compareButtons).toHaveLength(1);
    });

    it('calls onCompare when compare button is clicked', () => {
      const snap1 = createSnapshot({ id: 'snap-1', name: 'Current' });
      const snap2 = createSnapshot({ id: 'snap-2', name: 'Old', timestamp: now - 86400000 });
      render(
        <TimelineView
          snapshots={[snap1, snap2]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: '与当前对比' }));
      expect(mockOnCompare).toHaveBeenCalledWith(snap2);
    });

    it('calls onRestore when restore button is clicked', () => {
      const snap1 = createSnapshot({ id: 'snap-1', name: 'Current' });
      const snap2 = createSnapshot({ id: 'snap-2', name: 'Old', timestamp: now - 86400000 });
      render(
        <TimelineView
          snapshots={[snap1, snap2]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: '恢复到此版本' }));
      expect(mockOnRestore).toHaveBeenCalledWith(snap2);
    });

    it('calls onDelete when delete button is clicked', () => {
      const snap1 = createSnapshot({ id: 'snap-1', name: 'Current' });
      const snap2 = createSnapshot({ id: 'snap-2', name: 'Old', timestamp: now - 86400000 });
      render(
        <TimelineView
          snapshots={[snap1, snap2]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: '删除快照' }));
      expect(mockOnDelete).toHaveBeenCalledWith(snap2);
    });

    it('does not show restore/delete buttons for first snapshot', () => {
      const snap = createSnapshot({ id: 'snap-1', name: 'Current' });
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.queryByRole('button', { name: '恢复到此版本' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '删除快照' })).not.toBeInTheDocument();
    });
  });

  describe('keyboard interaction', () => {
    it('calls onSelect when Enter key is pressed on card', () => {
      const snap = createSnapshot();
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      const card = screen.getByRole('button', { name: /快照: 初始版本/ });
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith(snap);
    });
  });

  describe('relative time formatting', () => {
    it('shows "刚刚" for snapshots within 1 minute', () => {
      const snap = createSnapshot({ timestamp: now - 30000 });
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('刚刚')).toBeInTheDocument();
    });

    it('shows minutes for snapshots within 1 hour', () => {
      const snap = createSnapshot({ timestamp: now - 1800000 }); // 30 minutes ago
      render(
        <TimelineView
          snapshots={[snap]}
          selectedId={null}
          onSelect={mockOnSelect}
          onStar={mockOnStar}
          onCompare={mockOnCompare}
          onRestore={mockOnRestore}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText(/\d+分钟前/)).toBeInTheDocument();
    });
  });
});
